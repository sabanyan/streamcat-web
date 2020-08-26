import unittest
import os
import json
import pprint
from pathlib import Path

from kskp.web.backend import app
from kskp.web.backend.api.tests.api_test_case_base import ApiTestCaseBase

class SystemTestCase(ApiTestCaseBase):
    def test_create_get_delete_user(self):
        """
        Userの作成・取得・削除を検証する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'abc@def.com', 'name':'テストです', 'password':'abcアウアウ'}, self.USER1)
        user_uuid = result['data']['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'abc@def.com')
        self.assertEqual(result['data']['name'], 'テストです')
        self.assertEqual(result['data']['state'], 'tmp')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':False,'USR_ADMIN':False})
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertEqual(result['data']['password'], 'abcアウアウ')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 仮登録ユーザは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.user.find_by_uuid(user_uuid)

    def test_update_user_by_self(self):
        """
        一般ユーザが自分のユーザ情報を変更する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'aaa-bbb_ccc@ksk-anl.com', 'name':'一般ユーザです', 'password':'0123iampassword!'}, self.USER1)
        user_uuid = result['data']['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('hogehoge')

        # ユーザ情報を変更する
        expected = {
            'email': '変更後＠aiueo.co.jp',
            'name' : '私はカモメ',
            'password' : '#yerhfkdi'
        }
        result = self.put_uri(f'/api/v0/users/{user_uuid}', expected, new_user)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], expected['email'])
        self.assertEqual(result['data']['name'], expected['name'])
        self.assertEqual(result['data']['state'], 'active')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':False,'USR_ADMIN':False})
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], expected['email'])
        self.assertEqual(result['data']['name'], expected['name'])
        self.assertEqual(result['data']['state'], 'inactive')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':False,'USR_ADMIN':False})
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

    def test_generate_password_and_create_user(self):
        """
        Userを作成する(パスワードは自動生成する)
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'def@def.com', 'name':'テストですよ', 'password':None}, self.USER1)
        user_uuid = result['data']['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'def@def.com')
        self.assertEqual(result['data']['name'], 'テストですよ')
        self.assertEqual(result['data']['state'], 'tmp')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':False,'USR_ADMIN':False})
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsInstance(result['data']['password'], str)
        self.assertEqual(len(result['data']['password']), 8)
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 仮登録ユーザは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.user.find_by_uuid(user_uuid)

    def test_reset_user_password(self):
        """
        Userのパスワードをリセットする
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'ghi@def.com', 'name':'テストですよっと', 'password':'アイウエオ'}, self.USER1)
        user_uuid = result['data']['uuid']

        # パスワードをリセットする
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'ghi@def.com')
        self.assertEqual(result['data']['name'], 'テストですよっと')
        self.assertEqual(result['data']['state'], 'tmp')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':False,'USR_ADMIN':False})
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertNotEqual(result['data']['password'], 'アイウエオ')
        self.assertIsInstance(result['data']['password'], str)
        self.assertEqual(len(result['data']['password']), 8)
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 仮登録ユーザは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.user.find_by_uuid(user_uuid)

    def test_get_all_user(self):
        """
        全てのUserを取得する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'jkl@def.com', 'name':'テストですよっと♪', 'password':'_%@/\\a0'}, self.USER1)
        user_uuid = result['data']['uuid']

        # ユーザを検索する
        results = self.get_uri(f'/api/v0/users', self.USER2)

        # 一件以上のユーザが取得できることを確認する
        self.assertTrue(len(results) > 0)
        
        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 仮登録ユーザは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.user.find_by_uuid(user_uuid)

    def test_get_admin_user(self):
        """
        管理者Userを取得する
        """
        # システム管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER0.uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'Admin@kskp.io')
        self.assertEqual(result['data']['name'], 'システム管理者')
        self.assertEqual(result['data']['state'], 'active')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':True,'USR_ADMIN':False})
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザ管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER1.uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'admin@kskp.io')
        self.assertEqual(result['data']['name'], 'ユーザ管理者')
        self.assertEqual(result['data']['state'], 'active')
        self.assertEqual(result['data']['systemRoles'], {'SYS_ADMIN':False,'USR_ADMIN':True})
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertIsNotNone(result['data']['createdAt'])

    def test_search_user(self):
        """
        公方様を検索する
        """
        # 公方様を作成する
        result = self.post_uri('/api/v0/users', {'email':'takauji@muromachi.go.jp', 'name':'足利 尊氏', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshiakira@muromachi.go.jp', 'name':'足利 義詮', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshimitsu@muromachi.go.jp', 'name':'足利 義満', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshimochi@muromachi.go.jp', 'name':'足利 義持', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshikazu@muromachi.go.jp', 'name':'足利 義量', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshinori@muromachi.go.jp', 'name':'足利 義教', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshikatsu@muromachi.go.jp', 'name':'足利 義勝', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshimasa@muromachi.go.jp', 'name':'足利 義政', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshihisa@muromachi.go.jp', 'name':'足利 義尚', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshiki@muromachi.go.jp', 'name':'足利 義材', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshizumi@muromachi.go.jp', 'name':'足利 義澄', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshiharu@muromachi.go.jp', 'name':'足利 義晴', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshiteru@muromachi.go.jp', 'name':'足利 義輝', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshihide@muromachi.go.jp', 'name':'足利 義栄', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yoshiaki@muromachi.go.jp', 'name':'足利 義昭', 'password':None}, self.USER1)

        # 公方様を検索する
        keyword = '足利 '
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 15)
        self.assertEqual(results['data'][0]['email'], 'takauji@muromachi.go.jp')
        self.assertEqual(results['data'][14]['email'], 'yoshizumi@muromachi.go.jp')

        # 公方様を検索する
        keyword = '尊氏'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 1)
        self.assertEqual(results['data'][0]['email'], 'takauji@muromachi.go.jp')

        # 公方様を検索する
        keyword = '義'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 14)
        self.assertEqual(results['data'][0]['email'], 'yoshiaki@muromachi.go.jp')
        self.assertEqual(results['data'][13]['email'], 'yoshizumi@muromachi.go.jp')

        # 公方様を検索する
        keyword = 'ka'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 3)
        self.assertEqual(results['data'][0]['email'], 'takauji@muromachi.go.jp')
        self.assertEqual(results['data'][1]['email'], 'yoshikatsu@muromachi.go.jp')
        self.assertEqual(results['data'][2]['email'], 'yoshikazu@muromachi.go.jp')

        # 公方様を検索する
        keyword = '将軍様'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 0)

    def test_search_user2(self):
        """
        Userを検索する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'aaa%bbb@gmail.com', 'name':'アウアウ\\あー', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'aui_eo@yahoo.co.jp', 'name':'😄', 'password':None}, self.USER1)

        # ユーザを検索する
        keyword = '%'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 1)
        self.assertEqual(results['data'][0]['email'], 'aaa%bbb@gmail.com')

        # ユーザを検索する
        keyword = '\\'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 1)
        self.assertEqual(results['data'][0]['email'], 'aaa%bbb@gmail.com')

        # ユーザを検索する
        keyword = '_'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 1)
        self.assertEqual(results['data'][0]['email'], 'aui_eo@yahoo.co.jp')

        # ユーザを検索する
        keyword = '😄'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results['data']), 1)
        self.assertEqual(results['data'][0]['email'], 'aui_eo@yahoo.co.jp')

    def test_api_by_inactive_user(self):
        """
        論理削除UserはAPI操作ができないこと
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'inactive-user@ksk-anl.com', 'name':'論理削除ユーザです', 'password':'<2rf-_aab=[uUU9]>!'}, self.USER1)
        user_uuid = result['data']['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('alslb**^a#2a@aa0O')

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        self.assertEqual(result['data']['state'], 'inactive')

        # 論理削除ユーザはAPI操作はできないこと
        with self.assertRaisesRegex(AssertionError, expected_regex='False is not true : GET /api/v0/library is failed. not authorized'):
            result = self.get_uri('/api/v0/library', new_user)
