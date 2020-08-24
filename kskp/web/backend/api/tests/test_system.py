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
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertEqual(result['data']['password'], 'abcアウアウ')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

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
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

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
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsInstance(result['data']['password'], str)
        self.assertEqual(len(result['data']['password']), 8)
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

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
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertNotEqual(result['data']['password'], 'アイウエオ')
        self.assertIsInstance(result['data']['password'], str)
        self.assertEqual(len(result['data']['password']), 8)
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)