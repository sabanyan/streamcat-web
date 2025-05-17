import io
import os
import copy
import unittest
import pprint
from streamcat.core import SavableDatum
from streamcat.store.auth import User, Role
from .api_test_case_base import ApiTestCaseBase

class SystemTest(ApiTestCaseBase):

    expected_everyone = {
        "uuid": Role.EVERYONE_ROLE_UUID,
        "name": Role.EVERYONE_ROLE_LABEL,
        "systemRole": Role.EVERYONE_ROLE_LABEL
    }

    expected_sys_admin = {
        "uuid": Role.SYS_ADMIN_ROLE_UUID,
        "name": Role.SYS_ADMIN_ROLE_LABEL,
        "systemRole": Role.SYS_ADMIN_ROLE_LABEL
    }

    expected_usr_admin = {
        "uuid": Role.USR_ADMIN_ROLE_UUID,
        "name": Role.USR_ADMIN_ROLE_LABEL,
        "systemRole": Role.USR_ADMIN_ROLE_LABEL
    }

    expected_edit_lock = {
        "uuid": Role.EDIT_LOCK_ROLE_UUID,
        "name": Role.EDIT_LOCK_ROLE_LABEL,
        "systemRole": Role.EDIT_LOCK_ROLE_LABEL
    }

    # フローJSON
    # mnewnumber -> d(cache=on) -> mcut -> d1(out=on)
    flow_json = {
        "label": "flow", 
        "nodes": [
        {
            "id": "d", 
            "type": "frame", 
            "uuid": None, 
            "label": "d", 
            "makeCache": True, 
            "dataSource": "csv", 
            "cacheCreatedAt": None
        }, 
        {
            "id": "c", 
            "args": {
            "I": "1", 
            "S": "1", 
            "a": "a", 
            "l": "10"
            }, 
            "dsts": {
            "o": "d"
            },
            "srcs": {}, 
            "type": "command", 
            "label": "c", 
            "commandId": "mnewnumber", 
            "srcsOrder": []
        }, 
        {
            "id": "d1", 
            "type": "frame", 
            "uuid": None, 
            "label": "d1", 
            "makeCache": False, 
            "dataSource": "csv", 
            "cacheCreatedAt": None
        }, 
        {
            "id": "c1", 
            "args": {
            "f": "*"
            }, 
            "dsts": {
            "o": "d1"
            }, 
            "srcs": {
            "i": "d"
            }, 
            "type": "command", 
            "label": "c1", 
            "commandId": "mcut", 
            "srcsOrder": [
            "i"
            ]
        }
        ], 
        "ports": [
        [], 
        [
            {
            "type": "frame", 
            "label": "d1", 
            "nodeId": "d1"
            }
        ]
        ], 
        "params": [], 
        "creator": "ユーザー管理者", 
        "createdAt": "2020-10-04 17:45:16", 
        "projectId": None, 
        "description": ""
    }

    # 
    # Users
    # 

    def test_create_get_delete_user(self):
        """
        Userの作成・取得・削除を検証する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'abc@def.com', 'name':'テストです', 'password':'abcdefghij'}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'user')
        self.assertEqual(result['email'], 'abc@def.com')
        self.assertEqual(result['name'], 'テストです')
        self.assertEqual(result['state'], 'tmp')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertEqual(result['password'], 'abcdefghij')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 仮登録ユーザは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.user.find_by_uuid(user_uuid)

    def test_create_user_with_myproject(self):
        """
        Userの登録処理時にMyProjectが作成されること
        """
        # 金さんを作成する
        result = self.post_uri('/api/v0/users', {'email':'kin@kitamchi.go.jp', 'name':'遠山　金四郎', 'password':'sakurafubuki'}, self.USER1)
        user_uuid = result['uuid']

        # 金さんを登録状態にする
        self.post_register_complete(user_uuid, 'ououou_sakkikaradamatte_kiiterayou')

        # 金さんを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], user_uuid)
        self.assertEqual(result['email'], 'kin@kitamchi.go.jp')
        self.assertEqual(result['name'], '遠山　金四郎')
        self.assertEqual(result['state'], 'active')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        # MyProjectが作成されること
        self.assertEqual(len(result['projects']), 1)
        self.assertIsNotNone(result['projects'][0]['uuid'])
        self.assertEqual(result['projects'][0]['type'], SavableDatum.PROJECT_TYPE)
        self.assertEqual(result['projects'][0]['label'], 'MyProject')
        self.assertIsNone(result['projects'][0]['prevFolderPath'])
        self.assertIsNotNone(result['projects'][0]['creator'])
        self.assertIsNotNone(result['projects'][0]['createdAt'])

        # MyProjectが作成されること
        project_uuid = result['projects'][0]['uuid']
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER1)
        self.assertEqual(result['label'], 'MyProject')

        # 金さんを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 金さんは論理削除状態になること
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)
        self.assertEqual(result['state'], 'inactive')

        # MyProjectを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

    def test_update_user(self):
        """
        ユーザ情報を変更する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'aaa-bbb_ccc@sabanyan.com', 'name':'一般ユーザです', 'password':'0123iampassword!'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('hogehoge88')

        # 登録を確定する
        self.factory.end()

        # ユーザ管理者は、ユーザ情報を変更する
        expected = {
            'email': '変更後＠aiueo.co.jp',
            'name' : '私はカモメ',
            'password' : '#yerhfkdi8'
        }
        result = self.put_uri(f'/api/v0/users/{user_uuid}', expected, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'user')
        self.assertEqual(result['email'], expected['email'])
        self.assertEqual(result['name'], expected['name'])
        self.assertEqual(result['state'], 'active')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'user')
        self.assertEqual(result['email'], expected['email'])
        self.assertEqual(result['name'], expected['name'])
        self.assertEqual(result['state'], 'inactive')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 論理削除状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

    def test_update_self(self):
        """
        一般ユーザが自分のユーザ情報を変更する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'harunobu@kai.co.jp', 'name':'武田晴信', 'password':'abc012_-%[]();'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('fuurinkazann')

        # 登録を確定する
        self.factory.end()

        # ユーザ情報を変更する
        expected = {
            'email': 'harunobu＠shinano.co.jp',
            'name' : '武田信玄',
            'password' : 'ugokazarukoto-yamanogotoshi',
            'currentPassword' : 'fuurinkazann'
        }
        result = self.put_uri(f'/api/v0/users/self', expected, new_user)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'user')
        self.assertEqual(result['email'], expected['email'])
        self.assertEqual(result['name'], expected['name'])
        self.assertEqual(result['state'], 'active')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'user')
        self.assertEqual(result['email'], expected['email'])
        self.assertEqual(result['name'], expected['name'])
        self.assertEqual(result['state'], 'inactive')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 論理削除状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

    def test_update_self_without_pass(self):
        """
        一般ユーザが自分の名前を変更する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'ujiyasu@odawara.co.jp', 'name':'北条氏康', 'password':'qscftyhnmko'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        self.post_register_complete(user_uuid, 'jurujurujuru')

        # 名前だけの変更であればパスワード認証は必要ないこと
        expected = {
            'name' : '汁かけ飯大好きマン'
        }
        result = self.put_uri(f'/api/v0/users/self', expected, new_user)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'ujiyasu@odawara.co.jp')
        self.assertEqual(result['name'], expected['name'])
        self.assertEqual(result['state'], 'active')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # パスワード認証をして名前を変更してもよいこと
        expected = {
            'name' : '一回で汁の量を見極められずにn怒られたマン',
            'currentPassword' : 'jurujurujuru'

        }
        result = self.put_uri(f'/api/v0/users/self', expected, new_user)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'ujiyasu@odawara.co.jp')
        self.assertEqual(result['name'], expected['name'])
        self.assertEqual(result['state'], 'active')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # emailの変更にはパスワード認証が必要であること
        expected = {'email' : 'ujiyasu01@odawara.co.jp'}
        with self.assertRaises(Exception):
            self.put_uri(f'/api/v0/users/self', expected, new_user)

        # passwordの変更にはパスワード認証が必要であること
        expected = {'password' : 'abcdefg098'}
        with self.assertRaises(Exception):
            self.put_uri(f'/api/v0/users/self', expected, new_user)

        # passwordのリセットにはパスワード認証が必要であること
        expected = {'password' : None}
        with self.assertRaises(Exception):
            self.put_uri(f'/api/v0/users/self', expected, new_user)

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_update_user_by_other(self):
        """
        一般ユーザが他人のユーザ情報を変更できないこと
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'kagetora@echigo.co.jp', 'name':'長尾景虎', 'password':'bishamon123'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('bishamontenn123')

        # 変更を確定する
        self.factory.end()

        # 他人のユーザ情報を変更する
        data = {
            'email': 'kensshin@echigo.co.jp',
            'name' : '上杉謙信',
            'password' : 'auauwa',
            'currentPassword' : 'bishamontenn123'
        }
        with self.assertRaises(Exception):
            self.put_uri(f'/api/v0/users/{user_uuid}', data, self.USER3)

        # 一般ユーザは、他人のユーザ情報を取得できる
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER3)

        # ユーザ情報は変更されていないこと
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'kagetora@echigo.co.jp')
        self.assertEqual(result['name'], '長尾景虎')
        self.assertEqual(result['state'], 'active')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'kagetora@echigo.co.jp')
        self.assertEqual(result['name'], '長尾景虎')
        self.assertEqual(result['state'], 'inactive')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # 論理削除状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

    def test_generate_password_and_create_user(self):
        """
        Userを作成する(パスワードは自動生成する)
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'def@def.com', 'name':'テストですよ', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'def@def.com')
        self.assertEqual(result['name'], 'テストですよ')
        self.assertEqual(result['state'], 'tmp')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsInstance(result['password'], str)
        self.assertEqual(len(result['password']), 10)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

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
        result = self.post_uri('/api/v0/users', {'email':'ghi@def.com', 'name':'テストですよっと', 'password':'AIUEOKAKIKU'}, self.USER1)
        user_uuid = result['uuid']

        # パスワードをリセットする
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'ghi@def.com')
        self.assertEqual(result['name'], 'テストですよっと')
        self.assertEqual(result['state'], 'tmp')
        self.assertNotIn('roles', result)
        self.assertNotIn('projects', result)
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertNotEqual(result['password'], 'AIUEOKAKIKU')
        self.assertIsInstance(result['password'], str)
        self.assertEqual(len(result['password']), 10)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

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
        result = self.post_uri('/api/v0/users', {'email':'jkl@def.com', 'name':'テストですよっと♪', 'password':'^^^_%@/\\a0$$'}, self.USER1)
        user_uuid = result['uuid']

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
        result = self.get_uri(f'/api/v0/users/{self.USER0.uuid}?roles=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'Admin@streamcat.io')
        self.assertEqual(result['name'], 'システム管理者')
        self.assertEqual(result['state'], 'active')
        # 編集ロックロール
        self.assertEqual(len(result['roles']), 5)
        self.assertEqual(result['roles'][0]['uuid'], self.expected_edit_lock['uuid'])
        self.assertEqual(result['roles'][0]['name'], self.expected_edit_lock['name'])
        self.assertEqual(result['roles'][0]['systemRole'], self.expected_edit_lock['systemRole'])
        self.assertIsNotNone(result['roles'][0]['creator'])
        self.assertIsNotNone(result['roles'][0]['createdAt'])
        # EveryOneロール
        self.assertEqual(result['roles'][1]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['roles'][1]['name'], self.expected_everyone['name'])
        self.assertEqual(result['roles'][1]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['roles'][1]['creator'])
        self.assertIsNotNone(result['roles'][1]['createdAt'])
        # システム管理者ロール
        self.assertEqual(result['roles'][2]['uuid'], self.expected_sys_admin['uuid'])
        self.assertEqual(result['roles'][2]['name'], self.expected_sys_admin['name'])
        self.assertEqual(result['roles'][2]['systemRole'], self.expected_sys_admin['systemRole'])
        self.assertIsNotNone(result['roles'][2]['creator'])
        self.assertIsNotNone(result['roles'][2]['createdAt'])
        # 本人ロール
        self.assertIsNotNone(result['roles'][3]['uuid'])
        self.assertEqual(result['roles'][3]['name'], 'システム管理者')
        self.assertEqual(result['roles'][3]['systemRole'], '')
        self.assertIsNotNone(result['roles'][3]['creator'])
        self.assertIsNotNone(result['roles'][3]['createdAt'])
        # データデストプロジェクトのロール
        self.assertIsNotNone(result['roles'][4]['uuid'])
        self.assertEqual(result['roles'][4]['name'], 'データデスト📂_readers')
        self.assertEqual(result['roles'][4]['systemRole'], '')
        self.assertIsNotNone(result['roles'][4]['creator'])
        self.assertIsNotNone(result['roles'][4]['createdAt'])

        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertIsNotNone(result['createdAt'])

        # ユーザ管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER1.uuid}?roles=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'admin@streamcat.io')
        self.assertEqual(result['name'], 'ユーザー管理者')
        self.assertEqual(result['state'], 'active')
        # 編集ロックロール
        self.assertEqual(len(result['roles']), 7)
        self.assertEqual(result['roles'][0]['uuid'], self.expected_edit_lock['uuid'])
        self.assertEqual(result['roles'][0]['name'], self.expected_edit_lock['name'])
        self.assertEqual(result['roles'][0]['systemRole'], self.expected_edit_lock['systemRole'])
        self.assertIsNotNone(result['roles'][0]['creator'])
        self.assertIsNotNone(result['roles'][0]['createdAt'])
        # EveryOneロール
        self.assertEqual(result['roles'][1]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['roles'][1]['name'], self.expected_everyone['name'])
        self.assertEqual(result['roles'][1]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['roles'][1]['creator'])
        self.assertIsNotNone(result['roles'][1]['createdAt'])
        # ユーザ管理者ロール
        self.assertEqual(result['roles'][2]['uuid'], self.expected_usr_admin['uuid'])
        self.assertEqual(result['roles'][2]['name'], self.expected_usr_admin['name'])
        self.assertEqual(result['roles'][2]['systemRole'], self.expected_usr_admin['systemRole'])
        self.assertIsNotNone(result['roles'][2]['creator'])
        self.assertIsNotNone(result['roles'][2]['createdAt'])
        # データデストプロジェクトのロール
        self.assertIsNotNone(result['roles'][3]['uuid'])
        self.assertEqual(result['roles'][3]['name'], 'データデスト📂_owners')
        self.assertEqual(result['roles'][3]['systemRole'], '')
        self.assertIsNotNone(result['roles'][3]['creator'])
        self.assertIsNotNone(result['roles'][3]['createdAt'])
        # データデストプロジェクトのロール
        self.assertIsNotNone(result['roles'][4]['uuid'])
        self.assertEqual(result['roles'][4]['name'], 'データデスト📂_readers')
        self.assertEqual(result['roles'][4]['systemRole'], '')
        self.assertIsNotNone(result['roles'][4]['creator'])
        self.assertIsNotNone(result['roles'][4]['createdAt'])
        # データデストプロジェクトのロール
        self.assertIsNotNone(result['roles'][5]['uuid'])
        self.assertEqual(result['roles'][5]['name'], 'データデスト📂_writers')
        self.assertEqual(result['roles'][5]['systemRole'], '')
        self.assertIsNotNone(result['roles'][5]['creator'])
        self.assertIsNotNone(result['roles'][5]['createdAt'])
        # 本人ロール
        self.assertIsNotNone(result['roles'][6]['uuid'])
        self.assertEqual(result['roles'][6]['name'], 'ユーザー管理者')
        self.assertEqual(result['roles'][6]['systemRole'], '')
        self.assertIsNotNone(result['roles'][6]['creator'])
        self.assertIsNotNone(result['roles'][6]['createdAt'])
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result)
        self.assertIsNotNone(result['createdAt'])

    def test_get_usr_with_projects(self):
        """
        Userの所属プロジェクトを取得する
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # ユーザを作成する
        USER_X = self.factory.user.create('test-x@streamcat.io', 'TestX', '~!@#$%^&*()')
        USER_X.save()

        # 仮登録状態から登録状態にする
        USER_X.update_password('_)(*&^%$#@!')

        # 変更を確定する
        self.factory.end()

        # ユーザ2は、本登録処理をする
        # (USER2は、TestCaseBase.setUpClass()で登録済みなので、MyProjectは作成されない)
        self.post_register_complete(self.USER2.uuid, 'adminpass0')

        # プロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : 'プロジェクトX'}
        result = self.post_uri('/api/v0/projects', data, self.USER2)
        project_uuid1 = result['uuid']

        # プロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : 'プロジェクトY'}
        result = self.post_uri('/api/v0/projects', data, self.USER2)
        project_uuid2 = result['uuid']

        # プロジェクトメンバでないユーザが、プロジェクト管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER2.uuid}?projects=on', USER_X)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'test@streamcat.io')
        self.assertEqual(result['name'], 'Test')
        self.assertEqual(result['state'], 'active')
        # プロジェクトメンバでないユーザが所属しないプロジェクトは取得できない
        self.assertEqual(len(result['projects']), 0)

        # 自分のユーザ情報を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER2.uuid}?projects=on', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'test@streamcat.io')
        self.assertEqual(result['name'], 'Test')
        self.assertEqual(result['state'], 'active')
        # 自分が所属するプロジェクトの数を取得する
        # (TestCaseBaseで'全員がメンバのデータデスト📂'プロジェクトを作成していることに注意)
        self.assertEqual(len(result['projects']), 3, msg=result['projects'])
        # データデスト📂
        self.assertIsNotNone(result['projects'][0]['uuid'])
        self.assertEqual(result['projects'][0]['type'], SavableDatum.PROJECT_TYPE)
        self.assertEqual(result['projects'][0]['label'], 'データデスト📂')
        self.assertIsNone(result['projects'][0]['prevFolderPath'])
        self.assertIsNotNone(result['projects'][0]['creator'])
        self.assertIsNotNone(result['projects'][0]['createdAt'])
        # プロジェクトX
        self.assertIsNotNone(result['projects'][1]['uuid'])
        self.assertEqual(result['projects'][1]['type'], SavableDatum.PROJECT_TYPE)
        self.assertEqual(result['projects'][1]['label'], 'プロジェクトX')
        self.assertIsNone(result['projects'][1]['prevFolderPath'])
        self.assertIsNotNone(result['projects'][1]['creator'])
        self.assertIsNotNone(result['projects'][1]['createdAt'])
        # プロジェクトY
        self.assertIsNotNone(result['projects'][2]['uuid'])
        self.assertEqual(result['projects'][2]['type'], SavableDatum.PROJECT_TYPE)
        self.assertEqual(result['projects'][2]['label'], 'プロジェクトY')
        self.assertIsNone(result['projects'][2]['prevFolderPath'])
        self.assertIsNotNone(result['projects'][2]['creator'])
        self.assertIsNotNone(result['projects'][2]['createdAt'])

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid1}', self.USER2)
        self.delete_uri(f'/api/v0/projects/{project_uuid2}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_get_tmp_user_with_roles(self):
        """
        一度も登録状態になっていないUserの本人ロールは存在しない
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'メール@アドレス.co.jp', 'name':'平将門', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?roles=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'メール@アドレス.co.jp')
        self.assertEqual(result['name'], '平将門')
        self.assertEqual(result['state'], 'tmp')
        # 本人ロールは存在しないので所属するロールはeveryoneと編集ロックロールのみである
        self.assertEqual(len(result['roles']), 2)
        # 編集ロックロール
        self.assertEqual(result['roles'][0]['uuid'], self.expected_edit_lock['uuid'])
        self.assertEqual(result['roles'][0]['name'], self.expected_edit_lock['name'])
        self.assertEqual(result['roles'][0]['systemRole'], self.expected_edit_lock['systemRole'])
        self.assertIsNotNone(result['roles'][0]['creator'])
        self.assertIsNotNone(result['roles'][0]['createdAt'])
        # EveryOneロール
        self.assertEqual(result['roles'][1]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['roles'][1]['name'], self.expected_everyone['name'])
        self.assertEqual(result['roles'][1]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['roles'][1]['creator'])
        self.assertIsNotNone(result['roles'][1]['createdAt'])
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsNotNone(result['password'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_get_tmp_user_with_projects(self):
        """
        一度も登録状態になっていないUserのMyProjectは存在しない
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'iam.new-man@sabanyan.co.jp', 'name':'IAM New Man', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'iam.new-man@sabanyan.co.jp')
        self.assertEqual(result['name'], 'IAM New Man')
        self.assertEqual(result['state'], 'tmp')
        # MyProjectも含め所属するプロジェクトは存在しない
        self.assertEqual(len(result['projects']), 0)
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsNotNone(result['password'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_get_expired_user(self):
        """
        仮パスワードが環境変数で設定した期間を過ぎたユーザは、
        失効状態になること
        """
        # 失効状態のユーザを用意するため、仮パスワードの有効日数を設定する
        devault_seconds = User.TMP_PASS_EXPIRE_SECONDS
        User.TMP_PASS_EXPIRE_SECONDS = 0

        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'🐱@neko.co.jp', 'name':'🚢', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)
        password = result['password']

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], '🐱@neko.co.jp')
        self.assertEqual(result['name'], '🚢')
        self.assertEqual(result['state'], 'expired')
        # MyProjectも含め所属するプロジェクトは存在しない
        self.assertEqual(len(result['projects']), 0)
        # 失効状態でも仮パスワードは確認できること
        self.assertIsNotNone(result['password'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # パスワードをリセットできること
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)
        self.assertNotEqual(result['password'], password)

        # 他のテストケースに影響しないよう有効日数を初期値に戻す
        User.TMP_PASS_EXPIRE_SECONDS = devault_seconds

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_cannot_login_by_expired_user1(self):
        """
        失効状態のユーザはログインできないこと
        """
        # 失効状態のユーザを用意するため、仮パスワードの有効日数を設定する
        devault_seconds = User.TMP_PASS_EXPIRE_SECONDS
        User.TMP_PASS_EXPIRE_SECONDS = 0

        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'ruiji@nintendo.co.jp', 'name':'ルイージ', 'password':None}, self.USER1)
        user_uuid = result['uuid']
        user_email = result['email']
        user_passwd = result['password']

        # ユーザ1を取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        # 失効状態であること
        self.assertEqual(result['state'], 'expired')
        # 失効状態でも仮パスワードは確認できること
        self.assertEqual(result['password'], user_passwd)

        # ユーザは失効状態なのでログインできないこと
        with self.assertRaises(AssertionError):
            self.post_login(user_email, user_passwd)
        with self.assertRaises(AssertionError):
            self.post_login(user_email, '')

        # 他のテストケースに影響しないよう有効日数を初期値に戻す
        User.TMP_PASS_EXPIRE_SECONDS = devault_seconds

        # パスワードをリセットすれば失効状態から仮パスワード状態に遷移すること
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)
        self.assertEqual(result['state'], 'tmp')
        user_passwd = result['password']

        # ユーザを登録状態にできること
        self.post_register_complete(user_uuid, 'hohho-hhoho-')

        # ユーザはログインできること
        result = self.post_login(user_email, 'hohho-hhoho-')

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_cannot_login_by_expired_user2(self):
        """
        登録状態のユーザでも、失効状態になったユーザはログインできないこと
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'mario@nintendo.co.jp', 'name':'マリオ', 'password':None}, self.USER1)
        user_uuid = result['uuid']
        user_email = result['email']

        # ユーザを登録状態にする
        self.post_register_complete(user_uuid, 'pokemon-get-daze')

        # 失効状態のユーザを用意するため、仮パスワードの有効日数を設定する
        devault_seconds = User.TMP_PASS_EXPIRE_SECONDS
        User.TMP_PASS_EXPIRE_SECONDS = 0

        # パスワードをリセットして仮登録状態にする
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)
        user_passwd = result['password']

        # ユーザ1を取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        # 失効状態であること
        self.assertEqual(result['state'], 'expired')
        # 失効状態でも仮パスワードは確認できること
        self.assertEqual(result['password'], user_passwd)

        # ユーザは失効状態なのでログインできないこと
        with self.assertRaises(AssertionError):
            self.post_login(user_email, user_passwd)
        with self.assertRaises(AssertionError):
            self.post_login(user_email, 'pokemon-get-daze')

        # ユーザは失効状態なのでパスワードを登録できないこと
        # TODO: メールアドレスをSessionに格納すれば誰でも(失効状態でも)パスワード登録できてしまう
        # with self.assertRaises(AssertionError):
        #     self.post_register_complete(user_uuid, 'i-love-peach-princess')

        # 他のテストケースに影響しないよう有効日数を初期値に戻す
        User.TMP_PASS_EXPIRE_SECONDS = devault_seconds

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_get_inactive_user(self):
        """
        except_inactive=onで論理削除状態のユーザを
        抽出結果から除外できること
        """
        # 桃太郎侍を作成する
        result = self.post_uri('/api/v0/users', {'email':'momotarou@hatamoto.jp', 'name':'桃太郎侍', 'password':'taijitekureyou'}, self.USER1)
        user_uuid = result['uuid']
        user_email = result['email']

        # 桃太郎侍を取得する
        new_user = self.factory.user.find_by_uuid(user_uuid)

        # 桃太郎侍を本登録処理をする
        self.post_register_complete(user_uuid, 'momotarou!')

        # 桃太郎侍を削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}?except_inactive=on', self.USER1)

        # 桃太郎侍は取得できないこと1
        with self.assertRaises(Exception):
            self.get_uri(f'/api/v0/users/{user_uuid}?except_inactive=on', self.USER1)

        # 桃太郎侍は取得できないこと2
        with self.assertRaises(Exception):
            self.get_uri(f'/api/v0/users/self?except_inactive=on', new_user)

        # 桃太郎侍は取得できないこと3
        results = self.get_uri(f'/api/v0/users?q=桃太郎?except_inactive=on', self.USER1)
        self.assertEqual(results, [])

        # 桃太郎侍は取得できないこと4
        results = self.get_uri(f'/api/v0/users?except_inactive=on', self.USER1)
        for result in results:
            self.assertNotEqual(result['uuid'], user_uuid)

    def test_delete_tmp_user(self):
        """
        一旦登録状態になったUserが仮登録状態になった後、
        削除すると論理削除となること
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'gentoku@shoku.go.china', 'name':'劉備玄徳', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを取得する
        new_user = self.factory.user.find_by_uuid(user_uuid)

        # ユーザを登録状態にする
        self.post_register_complete(user_uuid, 'password012345')

        # ユーザのパスワードをリセットする
        # (ユーザを仮登録状態にする)
        self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザは論理削除状態になること
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)
        self.assertEqual(result['state'], 'inactive')

        # 同じユーザを2回論理削除してもエラーにならないこと
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザは論理削除状態のママのこと
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)
        self.assertEqual(result['state'], 'inactive')

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
        self.assertEqual(len(results), 15)
        self.assertEqual(results[0]['email'], 'takauji@muromachi.go.jp')
        self.assertEqual(results[14]['email'], 'yoshizumi@muromachi.go.jp')

        # 公方様を検索する
        keyword = '尊氏'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'takauji@muromachi.go.jp')

        # 公方様を検索する
        keyword = '義'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 14)
        self.assertEqual(results[0]['email'], 'yoshiaki@muromachi.go.jp')
        self.assertEqual(results[13]['email'], 'yoshizumi@muromachi.go.jp')

        # 公方様を検索する(大文字)
        keyword = 'KA'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['email'], 'takauji@muromachi.go.jp')
        self.assertEqual(results[1]['email'], 'yoshikatsu@muromachi.go.jp')
        self.assertEqual(results[2]['email'], 'yoshikazu@muromachi.go.jp')

        # 公方様を検索する(小文字)
        keyword = 'ka'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['email'], 'takauji@muromachi.go.jp')
        self.assertEqual(results[1]['email'], 'yoshikatsu@muromachi.go.jp')
        self.assertEqual(results[2]['email'], 'yoshikazu@muromachi.go.jp')

        # 公方様を検索する
        keyword = '将軍様'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 0)

    def test_search_user2(self):
        """
        仕事人をAND検索する
        """
        # 仕事人を作成する
        result = self.post_uri('/api/v0/users', {'email':'hacchoubori@edo.go.jp', 'name':'中村 主水', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'hide@edo.co.jp', 'name':'飾り職人の秀さん', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'yuuji@edo.co.jp', 'name':'三味線屋の勇次', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'junnosuke@edo.ac.jp', 'name':'西 順之助', 'password':None}, self.USER1)
        result = self.post_uri('/api/v0/users', {'email':'kayo@edo.co.jp', 'name':'何でも屋の加代', 'password':None}, self.USER1)

        # ユーザを検索する
        keyword = '中村 主水'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'hacchoubori@edo.go.jp')

        # ユーザを検索する
        keyword = '三味線 勇次'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'yuuji@edo.co.jp')

        # ユーザを検索する
        keyword = '職人 三味線'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)

        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 0)

        # ユーザを検索する
        keyword = 'hide 秀'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'hide@edo.co.jp')

        # ユーザを検索する(大文字)
        keyword = 'JP Edo '
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 5)

        # ユーザを検索する(小文字)
        keyword = 'jp edo '
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 5)

        # ユーザを検索する
        keyword = '"中村 主水"'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'hacchoubori@edo.go.jp')

        # ユーザを検索する
        keyword = '"中村 ""主水"'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 0)

    def test_search_user3(self):
        """
        Userを検索する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'aaa%bbb@gmail.com', 'name':'アウアウ\\あー', 'password':None}, self.USER1)
        user_uuid1 = result['uuid']
        result = self.post_uri('/api/v0/users', {'email':'aui_eo@yahoo.co.jp', 'name':'😄', 'password':None}, self.USER1)
        user_uuid2 = result['uuid']

        # ユーザを検索する
        keyword = '%'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'aaa%bbb@gmail.com')

        # ユーザを検索する
        keyword = '\\'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'aaa%bbb@gmail.com')

        # ユーザを検索する
        keyword = '_'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'aui_eo@yahoo.co.jp')

        # ユーザを検索する
        keyword = '😄'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'aui_eo@yahoo.co.jp')

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid1}', self.USER1)
        self.delete_uri(f'/api/v0/users/{user_uuid2}', self.USER1)

    def test_search_user4(self):
        """
        Userを検索する
        """
        # ユーザを作成する
        email = '^ \% % \_ _  *#(.*)+ \\ @ugoge.co.jp$'
        result = self.post_uri('/api/v0/users', {'email':email, 'name':'うごゲ〜', 'password':None}, self.USER1)
        user_uuid1 = result['uuid']
        result = self.post_uri('/api/v0/users', {'email':'abc@abc.jp', 'name':'とうぜんですわ', 'password':None}, self.USER1)
        user_uuid2 = result['uuid']
        result = self.post_uri('/api/v0/users', {'email':'\%@com', 'name':'ウゲー爆弾', 'password':None}, self.USER1)
        user_uuid3 = result['uuid']

        # ユーザを検索する
        keyword = '%'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['email'], '\%@com', msg=str(results))
        self.assertEqual(results[1]['email'], email)

        # ユーザを検索する
        keyword = '\%'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['email'], '\%@com')
        self.assertEqual(results[1]['email'], email)

        # ユーザを検索する
        keyword = '_'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], email)

        # ユーザを検索する
        # (検索語の前後の空白は削除するが
        #  空白のみの場合はその空白で検索する)
        keyword = '  '
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1, msg=str(results))
        self.assertEqual(results[0]['email'], email)

        # ユーザを検索する
        keyword = 'ugoge'
        results = self.get_uri(f'/api/v0/users?q={keyword}', self.USER3)
        # 期待するJSONが返ることを確認する
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], email)

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid1}', self.USER1)
        self.delete_uri(f'/api/v0/users/{user_uuid2}', self.USER1)
        self.delete_uri(f'/api/v0/users/{user_uuid3}', self.USER1)

    def test_api_by_inactive_user(self):
        """
        論理削除UserはAPI操作ができないこと
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'inactive-user@sabanyan.com', 'name':'論理削除ユーザです', 'password':'<2rf-_aab=[uUU9]>!'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('alslb**^a#2a@aa0O')

        # 変更を確定する
        self.factory.end()

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        self.assertEqual(result['state'], 'inactive')

        # 論理削除ユーザはAPI操作はできないこと
        with self.assertRaisesRegex(AssertionError, expected_regex='False is not true : GET /api/v0/library is failed. not authorized'):
            result = self.get_uri('/api/v0/library', new_user)

    def test_putback_user(self):
        """
        論理削除Userを登録状態Userに戻す
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'inactive-user!@sabanyan.com', 'name':'論理削除ユーザです！', 'password':'AadiemtJ89'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('passoiuyt*')

        # 変更を確定する
        self.factory.end()

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?roles=on', self.USER1)

        # 登録ユーザは論理削除されていること
        self.assertEqual(result['state'], 'inactive')
        # 編集ロックロールから外されていないこと
        self.assertEqual(len(result['roles']), 2)
        self.assertEqual(result['roles'][0]['uuid'], self.expected_edit_lock['uuid'])
        self.assertEqual(result['roles'][0]['name'], self.expected_edit_lock['name'])
        self.assertEqual(result['roles'][0]['systemRole'], self.expected_edit_lock['systemRole'])
        self.assertIsNotNone(result['roles'][0]['creator'])
        self.assertIsNotNone(result['roles'][0]['createdAt'])

        # 論理削除ユーザを登録ユーザに戻す
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'state':User.ACTIVE_STATE}, self.USER1)

        # 登録ユーザに戻っていること
        self.assertEqual(result['state'], 'active')

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?roles=on', self.USER1)
        
        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['email'], 'inactive-user!@sabanyan.com')
        self.assertEqual(result['name'], '論理削除ユーザです！')
        self.assertEqual(result['state'], 'active')
        # 本人ロールは存在しないので所属するロールはeveryoneのみである
        self.assertEqual(len(result['roles']), 3)
        # 編集ロックロールに所属していること
        self.assertEqual(result['roles'][0]['uuid'], self.expected_edit_lock['uuid'])
        self.assertEqual(result['roles'][0]['name'], self.expected_edit_lock['name'])
        self.assertEqual(result['roles'][0]['systemRole'], self.expected_edit_lock['systemRole'])
        self.assertIsNotNone(result['roles'][0]['creator'])
        self.assertIsNotNone(result['roles'][0]['createdAt'])
        # EveryOneロールに復帰していること
        self.assertEqual(result['roles'][1]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['roles'][1]['name'], self.expected_everyone['name'])
        self.assertEqual(result['roles'][1]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['roles'][1]['creator'])
        self.assertIsNotNone(result['roles'][1]['createdAt'])
        # 本人ロールに所属していること
        self.assertEqual(result['roles'][2]['uuid'], new_user.load_self_role().uuid)
        self.assertEqual(result['roles'][2]['name'], new_user.load_self_role().name)
        self.assertEqual(result['roles'][2]['systemRole'], '')
        self.assertIsNotNone(result['roles'][2]['creator'])
        self.assertIsNotNone(result['roles'][2]['createdAt'])

    def test_delete_sys_admin(self):
        """
        デフォルトのシステム管理者を削除できること
        """
        # デフォルトのシステム管理者を取得する
        user0_result = self.get_uri(f'/api/v0/users/{self.USER0.uuid}?roles=on', self.USER1)
        # データデストを入れたプロジェクトへのロールを取得する
        data_dst_role_uuid = user0_result['roles'][4]['uuid']
        
        # デフォルトのユーザを削除する
        self.delete_uri(f'/api/v0/users/{self.USER0.uuid}', self.USER1)

        # ユーザは論理削除状態になること
        result = self.get_uri(f'/api/v0/users/{self.USER0.uuid}?projects=on', self.USER1)
        self.assertEqual(result['state'], 'inactive')

        # 論理削除されたユーザは認証されないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/library', self.USER0)

        # streamcat.store.__init__.pyを再読み込みする
        # (Docker再起動を再現する)
        import importlib
        streamcat_store = importlib.import_module('streamcat.store')
        importlib.reload(streamcat_store)

        # 論理削除ユーザを登録ユーザに戻す
        result = self.put_uri(f'/api/v0/users/{self.USER0.uuid}', {'state':User.ACTIVE_STATE}, self.USER1)

        # 管理者権限を再び与える
        result = self.put_uri(f'/api/v0/roles/sys_admin/users/{self.USER0.uuid}', {}, self.USER1)

        # データデストを入れたプロジェクトに再び所属させる
        result = self.put_uri(f'/api/v0/roles/{data_dst_role_uuid}/users/{self.USER0.uuid}', {'owner':False}, self.USER1)

        # デフォルトのシステム管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER0.uuid}?roles=on', self.USER1)

        # 削除前と同じ結果が得られることを確認する
        self.assertDictEqual(result, user0_result)

    def test_delete_usr_admin(self):
        """
        デフォルトのユーザ管理者を削除できること
        """
        # コッコロちゃんを作成する
        result = self.post_uri('/api/v0/users', {'email':'kokkoro@elf.org', 'name':'コッコロちゃん', 'password':'seikatsuhi0'}, self.USER1)
        user_uuid = result['uuid']

        # コッコロちゃんを取得する
        new_user = self.factory.user.find_by_uuid(user_uuid)

        # コッコロちゃんを本登録処理をする
        self.post_register_complete(user_uuid, 'adminpass0')

        # コッコロちゃんに管理者権限を与える
        result = self.put_uri(f'/api/v0/roles/usr_admin/users/{user_uuid}', {}, self.USER1)

        # デフォルトのユーザ管理者を取得する
        user1_result = self.get_uri(f'/api/v0/users/{self.USER1.uuid}?roles=on', new_user)
        # データデストを入れたプロジェクトへのロールを取得する
        data_dst_o_role_uuid = user1_result['roles'][3]['uuid']
        data_dst_r_role_uuid = user1_result['roles'][4]['uuid']
        data_dst_w_role_uuid = user1_result['roles'][5]['uuid']

        # デフォルトのユーザを削除する
        self.delete_uri(f'/api/v0/users/{self.USER1.uuid}', self.USER1)

        # ユーザは論理削除状態になること
        result = self.get_uri(f'/api/v0/users/{self.USER1.uuid}?projects=on', new_user)
        self.assertEqual(result['state'], 'inactive')

        # 論理削除されたユーザは認証されないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/library', self.USER1)

        # streamcat.store.__init__.pyを再読み込みする
        # (Docker再起動を再現する)
        import importlib
        streamcat_store = importlib.import_module('streamcat.store')
        importlib.reload(streamcat_store)

        # 論理削除ユーザを登録ユーザに戻す
        result = self.put_uri(f'/api/v0/users/{self.USER1.uuid}', {'state':User.ACTIVE_STATE}, new_user)

        # 管理者権限を再び与える
        result = self.put_uri(f'/api/v0/roles/usr_admin/users/{self.USER1.uuid}', {}, new_user)

        # データデストを入れたプロジェクトに再び所属させる
        result = self.put_uri(f'/api/v0/roles/{data_dst_o_role_uuid}/users/{self.USER1.uuid}', {'owner':True}, new_user)
        result = self.put_uri(f'/api/v0/roles/{data_dst_r_role_uuid}/users/{self.USER1.uuid}', {'owner':True}, new_user)
        result = self.put_uri(f'/api/v0/roles/{data_dst_w_role_uuid}/users/{self.USER1.uuid}', {'owner':True}, new_user)

        # デフォルトのユーザ管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER1.uuid}?roles=on', new_user)

        # 削除前と同じ結果が得られることを確認する
        self.assertDictEqual(result, user1_result)

        # コッコロちゃんを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_get_no_uer(self):
        """
        存在しないUserを取得しようとすると例外を送出する
        """
        with self.assertRaises(Exception):
            unkown_user_id = '00000000-0000-0000-0000-000000000000'
            self.get_uri(f'/api/v0/users/{unkown_user_id}', self.USER1)

    #
    # Roles
    #

    def test_create_get_delete_role(self):
        """
        Roleの作成・取得・削除を検証する
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'テストロール'}, self.USER1)
        role_uuid = result['uuid']

        # ロールを取得する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['name'], 'テストロール')
        self.assertEqual(result['systemRole'], '')
        self.assertNotIn('members', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER1)

        # ロールは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.role.find_by_uuid(role_uuid)

    def test_update_role_by_self(self):
        """
        Role情報を変更する
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'テストロールです'}, self.USER1)
        role_uuid = result['uuid']

        # ロール情報を変更する
        result = self.put_uri(f'/api/v0/roles/{role_uuid}', {'name':'ロールケーキ'}, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], role_uuid)
        self.assertEqual(result['name'], 'ロールケーキ')
        self.assertEqual(result['systemRole'], '')
        self.assertNotIn('members', result)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER1)

    def test_get_all_role(self):
        """
        全てのRoleを取得する
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'テストロールですよっと'}, self.USER2)
        role_uuid = result['uuid']

        # ロールを検索する
        results = self.get_uri(f'/api/v0/roles', self.USER2)

        # 一件以上のロールが取得できることを確認する
        self.assertTrue(len(results) > 0)
        
        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER2)

        # ロールは物理削除されていること
        with self.assertRaises(Exception):
            self.factory.role.find_by_uuid(role_uuid)

    def test_join_leave_user_to_role(self):
        """
        Roleにユーザを参加・脱退させる
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'にゃーお'}, self.USER0)
        role_uuid = result['uuid']

        # ユーザを参加させる
        result = self.put_uri(f'/api/v0/roles/{role_uuid}/users/{self.USER2.uuid}', {'owner':False}, self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?members=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], role_uuid)
        self.assertEqual(result['name'], 'にゃーお')
        self.assertEqual(result['systemRole'], '')
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        # 参加ユーザ
        self.assertEqual(len(result['members']), 2)
        # USER0
        self.assertEqual(result['members'][0]['uuid'], self.USER0.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER0.email)
        self.assertEqual(result['members'][0]['name'], self.USER0.name)
        self.assertEqual(result['members'][0]['state'], self.USER0.state)
        self.assertEqual(result['members'][0]['creator'], self.USER0.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER0.created_at_str)
        # USER2
        self.assertEqual(result['members'][1]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER2.email)
        self.assertEqual(result['members'][1]['name'], self.USER2.name)
        self.assertEqual(result['members'][1]['state'], self.USER2.state)
        self.assertEqual(result['members'][1]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER2.created_at_str)

        # ユーザを脱退させる
        result = self.delete_uri(f'/api/v0/roles/{role_uuid}/users/{self.USER2.uuid}', self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?members=on', self.USER0)

        # 参加ユーザはUSER0だけであることを確認する
        self.assertEqual(len(result['members']), 1)
        # USER0
        self.assertEqual(result['members'][0]['uuid'], self.USER0.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER0.email)
        self.assertEqual(result['members'][0]['name'], self.USER0.name)
        self.assertEqual(result['members'][0]['state'], self.USER0.state)
        self.assertEqual(result['members'][0]['creator'], self.USER0.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER0.created_at_str)

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER0)

    def test_join_leave_user_to_role2(self):
        """
        Roleにユーザを参加・脱退させる
        (PUT /roles を用いる)
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'チュール🐱'}, self.USER0)
        role_uuid = result['uuid']

        # ユーザを参加させる
        data = {
            'name'   : 'ちゃおちゅーる🐈',
            'members': [{'uuid' : self.USER2.uuid, 'owner': True},
                        {'uuid' : self.USER3.uuid, 'owner': False}]
        }
        result = self.put_uri(f'/api/v0/roles/{role_uuid}', data, self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?members=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], role_uuid)
        self.assertEqual(result['name'], 'ちゃおちゅーる🐈')
        self.assertEqual(result['systemRole'], '')
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['members']), 2)
        self.assertEqual(result['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER2.created_at_str)
        # 参加ユーザ(USER3)
        self.assertEqual(result['members'][1]['uuid'], self.USER3.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER3.email)
        self.assertEqual(result['members'][1]['name'], self.USER3.name)
        self.assertEqual(result['members'][1]['state'], self.USER3.state)
        self.assertEqual(result['members'][1]['creator'], self.USER3.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER3.created_at_str)

        # ユーザを脱退させる
        data = {
            'members': [{'uuid' : self.USER3.uuid, 'owner': True}]
        }
        result = self.put_uri(f'/api/v0/roles/{role_uuid}', data, self.USER2)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?members=on', self.USER2)

        # 参加ユーザはUSER3だけであることを確認する
        self.assertEqual(len(result['members']), 1)
        # 参加ユーザ(USER3)
        self.assertEqual(result['members'][0]['uuid'], self.USER3.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER3.email)
        self.assertEqual(result['members'][0]['name'], self.USER3.name)
        self.assertEqual(result['members'][0]['state'], self.USER3.state)
        self.assertEqual(result['members'][0]['creator'], self.USER3.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER3.created_at_str)

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER3)

    def test_join_leave_sys_admin_role(self):
        """
        システム管理者Roleにユーザを参加・脱退させる
        """
        # システム管理者にユーザを参加させる
        result = self.put_uri(f'/api/v0/roles/sys_admin/users/{self.USER2.uuid}', {}, self.USER1)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{Role.SYS_ADMIN_ROLE_UUID}?members=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], Role.SYS_ADMIN_ROLE_UUID)
        self.assertEqual(result['name'], Role.SYS_ADMIN_ROLE_LABEL)
        self.assertEqual(result['systemRole'], Role.SYS_ADMIN_ROLE_LABEL)
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        # 参加ユーザ
        self.assertEqual(len(result['members']), 2)
        # USER0
        self.assertEqual(result['members'][0]['uuid'], self.USER0.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER0.email)
        self.assertEqual(result['members'][0]['name'], self.USER0.name)
        self.assertEqual(result['members'][0]['state'], self.USER0.state)
        self.assertEqual(result['members'][0]['creator'], self.USER0.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER0.created_at_str)
        # USER2
        self.assertEqual(result['members'][1]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER2.email)
        self.assertEqual(result['members'][1]['name'], self.USER2.name)
        self.assertEqual(result['members'][1]['state'], self.USER2.state)
        self.assertEqual(result['members'][1]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER2.created_at_str)

        # ユーザを脱退させる
        result = self.delete_uri(f'/api/v0/roles/sys_admin/users/{self.USER2.uuid}', self.USER1)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{Role.SYS_ADMIN_ROLE_UUID}?members=on', self.USER0)

        # 参加ユーザはUSER0だけであることを確認する
        self.assertEqual(len(result['members']), 1)
        # USER0
        self.assertEqual(result['members'][0]['uuid'], self.USER0.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER0.email)
        self.assertEqual(result['members'][0]['name'], self.USER0.name)
        self.assertEqual(result['members'][0]['state'], self.USER0.state)
        self.assertEqual(result['members'][0]['creator'], self.USER0.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER0.created_at_str)

    def test_cannot_join_leave_sys_admin_role(self):
        """
        ユーザ管理者以外のユーザは、システム管理者Roleにユーザを参加・脱退できないこと
        """
        # USER2は、システム管理者にユーザを参加できないこと
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/roles/sys_admin/users/{self.USER2.uuid}', {}, self.USER2)

        # USER2は、ユーザを脱退できないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/roles/sys_admin/users/{self.USER0.uuid}', self.USER2)

        # システム管理者から最後のユーザを脱退できること
        self.delete_uri(f'/api/v0/roles/sys_admin/users/{self.USER0.uuid}', self.USER1)

        # ユーザを戻す
        self.put_uri(f'/api/v0/roles/sys_admin/users/{self.USER0.uuid}', {}, self.USER1)

    def test_join_leave_usr_admin_role(self):
        """
        ユーザ管理者Roleにユーザを参加・脱退させる
        """
        # ユーザ管理者にユーザを参加させる
        result = self.put_uri(f'/api/v0/roles/usr_admin/users/{self.USER2.uuid}', {}, self.USER1)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{Role.USR_ADMIN_ROLE_UUID}?members=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], Role.USR_ADMIN_ROLE_UUID)
        self.assertEqual(result['name'], Role.USR_ADMIN_ROLE_LABEL)
        self.assertEqual(result['systemRole'], Role.USR_ADMIN_ROLE_LABEL)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        # 参加ユーザ
        self.assertEqual(len(result['members']), 2, msg=result['members'])
        # USER1
        self.assertEqual(result['members'][0]['uuid'], self.USER1.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER1.email)
        self.assertEqual(result['members'][0]['name'], self.USER1.name)
        self.assertEqual(result['members'][0]['state'], self.USER1.state)
        self.assertEqual(result['members'][0]['creator'], self.USER1.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER1.created_at_str)
        # USER2
        self.assertEqual(result['members'][1]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER2.email)
        self.assertEqual(result['members'][1]['name'], self.USER2.name)
        self.assertEqual(result['members'][1]['state'], self.USER2.state)
        self.assertEqual(result['members'][1]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER2.created_at_str)

        # ユーザを脱退させる
        result = self.delete_uri(f'/api/v0/roles/usr_admin/users/{self.USER2.uuid}', self.USER1)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{Role.USR_ADMIN_ROLE_UUID}?members=on', self.USER0)

        # 参加ユーザはUSER1だけであることを確認する
        self.assertEqual(len(result['members']), 1)
        # USER1
        self.assertEqual(result['members'][0]['uuid'], self.USER1.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER1.email)
        self.assertEqual(result['members'][0]['name'], self.USER1.name)
        self.assertEqual(result['members'][0]['state'], self.USER1.state)
        self.assertEqual(result['members'][0]['creator'], self.USER1.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER1.created_at_str)

    def test_cannot_join_leave_usr_admin_role(self):
        """
        ユーザ管理者以外のユーザは、ユーザ管理者Roleにユーザを参加・脱退できないこと
        """
        # USER2は、ユーザ管理者にユーザを参加できないこと
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/roles/usr_admin/users/{self.USER2.uuid}', {}, self.USER2)

        # 既でに参加済みのユーザの参加で所有権の変更もない場合は、DBへの更新が発生しないのでエラーにならない
        self.put_uri(f'/api/v0/roles/usr_admin/users/{self.USER1.uuid}', {}, self.USER2)

        # USER2は、ユーザを脱退できないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/roles/usr_admin/users/{self.USER1.uuid}', self.USER2)

        # ユーザ管理者から最後のユーザを脱退できないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/roles/usr_admin/users/{self.USER1.uuid}', self.USER1)

    def test_cannot_no_usr_admin(self):
        """
        ユーザ管理者ロールのメンバを0人にはできないこと
        """
        # ユーザ管理者を取得する
        result = self.get_uri(f'/api/v0/users/self?roles=on', self.USER1)
        usr_admin_uuid = result['uuid']

        # ユーザ管理者ロールを取得する
        usr_admin_role = None
        for data_role in result['roles']:
            if data_role['systemRole'] == self.expected_usr_admin['systemRole']:
                usr_admin_role = data_role['uuid']
                break
        if usr_admin_role is None:
            self.assertTrue(False, msg=f'{self.USER1}にユーザ管理者ロールが見つかりませんでした')

        # 最後の一人のメンバをロールから外せないこと
        with self.assertRaises(Exception):
            self.delete_uri(f'/api/v0/roles/{usr_admin_role}/users/{usr_admin_uuid}', self.USER1)

        # 最後の一人のメンバを削除できないこと
        with self.assertRaises(Exception):
            self.delete_uri(f'/api/v0/users/{usr_admin_uuid}', self.USER1)

    # 
    # Projects
    # 

    def test_join_leave_user_to_project(self):
        """
        Projectにユーザを参加・脱退させる
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER0)
        project_uuid = result['uuid']

        # ユーザを参加させる
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Reader'}, self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], 'プロジェクトだよ')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 作成ユーザ
        self.assertEqual(len(result['members']), 2)
        self.assertEqual(result['members'][0]['uuid'], self.USER0.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER0.email)
        self.assertEqual(result['members'][0]['name'], self.USER0.name)
        self.assertEqual(result['members'][0]['state'], self.USER0.state)
        self.assertEqual(result['members'][0]['creator'], self.USER0.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER0.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')
        # 参加ユーザ
        self.assertEqual(result['members'][1]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER2.email)
        self.assertEqual(result['members'][1]['name'], self.USER2.name)
        self.assertEqual(result['members'][1]['state'], self.USER2.state)
        self.assertEqual(result['members'][1]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['members'][1]['type'], 'Reader')

        # ユーザを脱退させる
        result = self.delete_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER0)

        # 参加ユーザは1人である
        self.assertEqual(len(result['members']), 1)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER0)

    def test_join_leave_user_to_project2(self):
        """
        Projectにユーザを参加・脱退させる
        (PUT /projects を用いる)
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトですよ'}, self.USER0)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)
        project_modified_at = result['modifiedAt']
        
        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], 'プロジェクトですよ')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['members']), 2)
        self.assertEqual(result['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')
        # 参加ユーザ(USER3)
        self.assertEqual(result['members'][1]['uuid'], self.USER3.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER3.email)
        self.assertEqual(result['members'][1]['name'], self.USER3.name)
        self.assertEqual(result['members'][1]['state'], self.USER3.state)
        self.assertEqual(result['members'][1]['creator'], self.USER3.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER3.created_at_str)
        self.assertEqual(result['members'][1]['type'], 'Reader')

        # ユーザを脱退させる
        data = {
            'members': [{'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)

        # 参加ユーザは1人である
        self.assertEqual(len(result['members']), 1)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

    def test_join_leave_user_to_project3(self):
        """
        Projectにユーザを参加・脱退させる
        (ユーザ管理者ロールに属するユーザもメンバに参加する場合)
        (PUT /projects を用いる)
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトですよ'}, self.USER0)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER1.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)
        project_modified_at = result['modifiedAt']
        
        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], 'プロジェクトですよ')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['members']), 3)
        self.assertEqual(result['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')
        # 参加ユーザ(USER1)
        self.assertEqual(result['members'][1]['uuid'], self.USER1.uuid)
        self.assertEqual(result['members'][1]['email'], self.USER1.email)
        self.assertEqual(result['members'][1]['name'], self.USER1.name)
        self.assertEqual(result['members'][1]['state'], self.USER1.state)
        self.assertEqual(result['members'][1]['creator'], self.USER1.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], self.USER1.created_at_str)
        self.assertEqual(result['members'][1]['type'], 'Writer')
        # 参加ユーザ(USER3)
        self.assertEqual(result['members'][2]['uuid'], self.USER3.uuid)
        self.assertEqual(result['members'][2]['email'], self.USER3.email)
        self.assertEqual(result['members'][2]['name'], self.USER3.name)
        self.assertEqual(result['members'][2]['state'], self.USER3.state)
        self.assertEqual(result['members'][2]['creator'], self.USER3.creator_str)
        self.assertEqual(result['members'][2]['createdAt'], self.USER3.created_at_str)
        self.assertEqual(result['members'][2]['type'], 'Reader')

        # ユーザを脱退させる
        data = {
            'members': [{'uuid' : self.USER1.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)

        # 参加ユーザは1人である
        self.assertEqual(len(result['members']), 2)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

    def test_join_project_by_usr_admin(self):
        """
        ユーザ管理者は全てのプロジェクトに対してメンバの追加と削除ができること
        """
        # ROOTを取得する
        root = self.factory2.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'KitKat'}, self.USER2)
        project_uuid = result['uuid']

        # ユーザ管理者は、プロジェクトメンバを追加する
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER3.uuid}', {'memberType':'Owner'}, self.USER1)

        # ユーザ管理者は、プロジェクトメンバを外す
        result = self.delete_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER3.uuid}', self.USER1)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_join_project_init_user(self):
        """
        Projectに初期状態のユーザを追加できること
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'rupin@the.thrid', 'name':'ルパーンⅢ世', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザは仮登録状態である
        self.assertEqual(result['state'], 'tmp')

        # ユーザを取得する
        user = self.factory.user.find_by_uuid(user_uuid)
        # DBでの状態は初期状態(=init)である
        self.assertEqual(user.state, 'init')

        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'そりゃないよとっつぁん'}, self.USER0)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : user_uuid,       'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], 'そりゃないよとっつぁん')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], 'システム管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['modifiedAt'], project_modified_at)
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['members']), 2)
        self.assertEqual(result['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')
        # 参加ユーザ(ルパーンⅢ世)
        self.assertEqual(result['members'][1]['uuid'], user.uuid)
        self.assertEqual(result['members'][1]['email'], user.email)
        self.assertEqual(result['members'][1]['name'], user.name)
        self.assertEqual(result['members'][1]['state'], 'tmp')
        self.assertEqual(result['members'][1]['creator'], user.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], user.created_at_str)
        self.assertEqual(result['members'][1]['type'], 'Reader')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_join_project_tmp_user(self):
        """
        Projectに仮登録状態のユーザを追加できること
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'jigen@magnum44', 'name':'次元大介', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを登録状態にする
        self.post_register_complete(user_uuid, 'abedgiykekd*&()')

        # ユーザのパスワードをリセットする
        # (ユーザを仮登録状態にする)
        result = self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)

        # ユーザは仮登録状態である
        self.assertEqual(result['state'], 'tmp')

        # ユーザを取得する
        user = self.factory.user.find_by_uuid(user_uuid)
        self.assertEqual(user.state, 'tmp')

        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'とっつぁーん'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : user_uuid,       'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], 'とっつぁーん')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], self.USER2.name)
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['modifiedAt'], project_modified_at)
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['members']), 2)
        self.assertEqual(result['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')
        # 参加ユーザ(次元大介)
        self.assertEqual(result['members'][1]['uuid'], user.uuid)
        self.assertEqual(result['members'][1]['email'], user.email)
        self.assertEqual(result['members'][1]['name'], user.name)
        self.assertEqual(result['members'][1]['state'], 'tmp')
        self.assertEqual(result['members'][1]['creator'], user.creator_str)
        self.assertEqual(result['members'][1]['createdAt'], user.created_at_str)
        self.assertEqual(result['members'][1]['type'], 'Writer')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_join_project_usr_admin(self):
        """
        ユーザ管理者は、プロジェクト管理者に自身を追加できること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'ワルサーP38'}, self.USER1)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者からユーザ管理者を一旦削除する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # プロジェクト管理者にユーザ管理者を追加する
        data = {
            'members': [{'uuid' : self.USER1.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], 'ワルサーP38')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], self.USER1.name)
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['modifiedAt'], project_modified_at)
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER1)
        self.assertEqual(len(result['members']), 1)
        self.assertEqual(result['members'][0]['uuid'], self.USER1.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER1.email)
        self.assertEqual(result['members'][0]['name'], self.USER1.name)
        self.assertEqual(result['members'][0]['state'], self.USER1.state)
        self.assertEqual(result['members'][0]['creator'], self.USER1.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER1.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_join_project_inactive_user(self):
        """
        Projectに論理削除状態のユーザを追加できないこと
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'goemon@samurai.jp', 'name':'五右衛門', 'password':None}, self.USER1)
        user_uuid = result['uuid']

        # ユーザを登録状態にする
        self.post_register_complete(user_uuid, 'abedgiykekd*&()')

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザは論理削除状態である
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)
        self.assertEqual(result['state'], 'inactive')

        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'斬鉄剣'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : user_uuid,       'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], project_uuid)
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], '斬鉄剣')
        self.assertEqual(result['children'], [])
        self.assertEqual(result['creator'], self.USER2.name)
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['modifiedAt'], project_modified_at)
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['members']), 1)
        self.assertEqual(result['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['members'][0]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['members'][0]['type'], 'Owner')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_join_project_without_owner(self):
        """
        プロジェクト管理者は必ず指定すること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'にゃおーん'}, self.USER1)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は外せないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER1.uuid}', self.USER1)

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Reader'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

    def test_join_project_without_member(self):
        """
        プロジェクトメンバは必ず指定すること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'ネコミミモード'}, self.USER1)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # メンバを設定する
        data = {
            'members': [],
            'lastModifiedAt' : project_modified_at
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

    def test_join_project_simultaneously(self):
        """
        プロジェクトメンバの設定は先勝であること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'北海道はでっかいどう'}, self.USER1)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # USER2は、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)
        project_modified_at_1 = result['modifiedAt']

        # USER3は、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)
        project_modified_at_2 = result['modifiedAt']

        # USER2は、ユーザを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Reader'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at_1
        }
        self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # USER3は、ユーザを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at_2
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER3)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

    def test_join_project_simultaneously2(self):
        """
        プロジェクトメンバの設定は先勝であること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'北海道はでっかいどう'}, self.USER1)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at
        }
        self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER1)

        # USER2は、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)
        project_modified_at_1 = result['modifiedAt']

        # USER3は、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)
        project_modified_at_2 = result['modifiedAt']

        # USER2は、ユーザを設定する
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Reader'}, self.USER2)

        # USER3は、ユーザを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project_modified_at_2
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER3)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

    def test_delete_project_owner(self):
        """
        ユーザがプロジェクトの唯一の所有者の場合でも、そのユーザを削除できること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # ユーザ1を作成する
        result = self.post_uri('/api/v0/users', {'email':'donald@mcdonalds.co.jp', 'name':'ドナルド', 'password':'mcdonald!!!!!!'}, self.USER1)
        user_uuid = result['uuid']
        # 作成したユーザを登録状態にする
        new_user1 = self.factory.user.find_by_uuid(user_uuid)
        self.post_register_complete(user_uuid, 'mcdonald!!!!!!0')

        # ユーザ2を作成する
        result = self.post_uri('/api/v0/users', {'email':'kernel@kfc.co.jp', 'name':'カーネルサンダース', 'password':'kfc!kfc!kfc!'}, self.USER1)
        user_uuid = result['uuid']
        # 作成したユーザを登録状態にする
        new_user2 = self.factory.user.find_by_uuid(user_uuid)
        self.post_register_complete(user_uuid, 'kfc!kfc!kfc!0')

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'うにゃあ'}, new_user1)
        project_uuid = result['uuid']

        # プロジェクト管理者をもう一人追加する
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{new_user2.uuid}', {'memberType':'Owner'}, new_user1)

        # プロジェクト管理者を一人削除する
        self.delete_uri(f'/api/v0/users/{new_user1.uuid}', self.USER1)
        result = self.get_uri(f'/api/v0/users/{new_user1.uuid}', self.USER1)
        self.assertEqual(result['email'], 'donald@mcdonalds.co.jp')
        self.assertEqual(result['state'], 'inactive')

        # 最後のプロジェクト管理者も削除できること
        self.delete_uri(f'/api/v0/users/{new_user2.uuid}', self.USER1)
        result = self.get_uri(f'/api/v0/users/{new_user2.uuid}', self.USER1)
        self.assertEqual(result['email'], 'kernel@kfc.co.jp')
        self.assertEqual(result['state'], 'inactive')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_flow_in_project(self):
        """
        プロジェクトの編集者はプロジェクト内のDatumを編集できること
        """
        # テスト用のフロー
        flow_json = {
            "label": "Test フロー ！",
            "params": [],
            "description": "",
            "ports": [
                [],
                [
                    {
                    "type": "frame", 
                    "label": "d1", 
                    "nodeId": "d1"
                    }
                ]
            ],
            "nodes": [
                {
                "type": "frame",
                "id": "d1",
                "label": "出力結果",
                "uuid": None,
                "dataSource": "csv"
                },
                {
                "type": "command",
                "id": "c1",
                "label": "c1",
                "srcs": {
                    "i": "i"
                },
                "dsts": {
                    "o": "d1"
                },
                "args": {
                    "f": "0,1",
                    "x": True
                },
                "commandId": "mcut"
                }
            ]
        }

        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'Flowプロジェクト'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '私のフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)

        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)
        flow_uuid = result['children'][0]['uuid']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、フローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']
            
        # 編集者は、フローを変更する
        data = {
            'flow' : flow_json,
            'label': '私のフロー🛀',
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローをゴミ箱へほかす
        self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}', {'lock':lock_uuid}, self.USER3)

        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_cannot_update_database_in_project(self):
        """
        プロジェクトの閲覧者はそのプロジェクト内のDatumを編集できないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'Testプロジェクト'}, self.USER2)
        project_uuid = result['uuid']

        # プロジェクト管理者は、プロジェクト内にdatabaseを作成する
        data = {
            "parent"   : project_uuid,
            "label"    : "社内データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : "password"
        }
        result = self.post_uri('/api/v0/databases', data, self.USER2)
        database_uuid = result['uuid']

        # プロジェクトメンバではないユーザは、databaseを変更できない
        data = {
            "label"    : "社内データベースA",
            "dbms"     : "ORACLE",
            "hostname" : "db0",
            "port"     : 2935,
            "database" : "streamcat",
            'userId'  : "scott",
            "password" : "tiger"
        }
        with self.assertRaises(AssertionError):
            result = self.put_uri(f'/api/v0/databases/{database_uuid}', data, self.USER3)
        with self.assertRaises(AssertionError):
            result = self.delete_uri(f'/api/v0/databases/{database_uuid}', self.USER3)

        # プロジェクトにUSER3を閲覧者として参加させる
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER3.uuid}', {'memberType':'Reader'}, self.USER2)

        # プロジェクトの閲覧者は、databaseを参照できる
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER3)

        # プロジェクトの閲覧者は、databaseを変更できない
        with self.assertRaises(AssertionError):
            result = self.put_uri(f'/api/v0/databases/{database_uuid}', data, self.USER3)
        with self.assertRaises(AssertionError):
            result = self.delete_uri(f'/api/v0/databases/{database_uuid}', self.USER3)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_read_other_owner_flow(self):
        """
        プロジェクトのメンバになったユーザは
        プロジェクト内のフローとフレームを参照できること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'みんな大好き虫食い'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクト内にフローを作成する
        data = {
            'parent': project_uuid,
            'label': 'なか卯',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)

        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)
        flow_uuid = result['children'][0]['uuid']

        # プロジェクト管理者は、プロジェクト内にフレームを作成する
        f = io.BytesIO(b'wxyz')
        result = self.post_frames('𠮷野家', project_uuid, f, self.USER2)
        frame_uuid = result['uuid']

        # プロジェクトのメンバでないユーザは、フローとフレームを参照できないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER3)

        # USER3をメンバに参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクトのメンバとなったユーザは、フローとフレームを参照できること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        self.assertEqual(result['label'], 'なか卯')
        result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER3)
        # 驚いたことにGET /framesではlabelを返していない
        # self.assertEqual(result['label'], '𠮷野家')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_move_inter_projects(self):
        """
        プロジェクト間でファイルを移動した場合、
        ファイルの権限は移動先プロジェクトの権限に従うこと
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()
        # ルートフォルダの下にプロジェクトAを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'格さん'}, self.USER0)
        project_a_uuid = result['uuid']
        project_a_modified_at = result['modifiedAt']

        # ルートフォルダの下にプロジェクトBを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'助さん'}, self.USER3)
        project_b_uuid = result['uuid']
        project_b_modified_at = result['modifiedAt']

        # USER2をプロジェクトAとBの編集者にする
        result = self.put_uri(f'/api/v0/projects/{project_a_uuid}/users/{self.USER2.uuid}', {'memberType':'Writer'}, self.USER0)
        result = self.put_uri(f'/api/v0/projects/{project_b_uuid}/users/{self.USER2.uuid}', {'memberType':'Writer'}, self.USER3)

        # プロジェクトAの下にフレームを作成する
        f = io.BytesIO(b'I am a chilimen byer')
        result = self.post_frames('御隠居', project_a_uuid, f, self.USER0)
        frame_uuid = result['uuid']

        # USER2は、フレームをプロジェクトAからプロジェクトBへ移動できること
        result = self.put_uri(f'/api/v0/frames/{frame_uuid}', {"parent": project_b_uuid}, self.USER2)

        # プロジェクトAのメンバは、フレームを参照できないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER0)

        # プロジェクトAのメンバは、フレームをプレビューできないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{frame_uuid}?contents=on', self.USER0)

        # プロジェクトBのメンバは、フレームの参照・更新ができること
        result = self.put_uri(f'/api/v0/frames/{frame_uuid}', {'label': '水戸光圀公であらせられるぞ'}, self.USER3)

        # USER2は、フレームを削除する
        self.delete_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_a_uuid}', self.USER0)
        self.delete_uri(f'/api/v0/projects/{project_b_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER0)
        self.delete_uri('/api/v0/trashes', self.USER3)

    def test_move_folder_inter_projects(self):
        """
        プロジェクト間でフォルダを移動した場合、
        フォルダ内のファイルの権限は移動先プロジェクトの権限に従うこと
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()
        # ルートフォルダの下にプロジェクトAを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'関西電気保安協会'}, self.USER0)
        project_a_uuid = result['uuid']
        project_a_modified_at = result['modifiedAt']

        # ルートフォルダの下にプロジェクトBを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'とんかつとんかつKYK'}, self.USER3)
        project_b_uuid = result['uuid']
        project_b_modified_at = result['modifiedAt']

        # USER2をプロジェクトAとBの編集者にする
        result = self.put_uri(f'/api/v0/projects/{project_a_uuid}/users/{self.USER2.uuid}', {'memberType':'Writer'}, self.USER0)
        result = self.put_uri(f'/api/v0/projects/{project_b_uuid}/users/{self.USER2.uuid}', {'memberType':'Writer'}, self.USER3)

        # プロジェクトAの下にフォルダを作成する
        result = self.post_uri('/api/v0/folders', {"label": 'グランシャトーへいらっしゃい', 'parent': project_a_uuid}, self.USER0)
        folder_uuid = result['uuid']

        # フォルダの下にフレームを作成する
        f = io.BytesIO(b'I am a chilimen byer')
        result = self.post_frames('はぎや整形', folder_uuid, f, self.USER0)
        frame_uuid = result['uuid']

        # USER2は、フォルダをプロジェクトAからプロジェクトBへ移動できること
        result = self.put_uri(f'/api/v0/folders/{folder_uuid}', {"parent": project_b_uuid}, self.USER2)

        # プロジェクトAのメンバは、フレームを参照できないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER0)

        # プロジェクトAのメンバは、フレームをプレビューできないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{frame_uuid}?contents=on', self.USER0)

        # プロジェクトBのメンバは、フレームの参照・更新ができること
        result = self.put_uri(f'/api/v0/frames/{frame_uuid}', {'label': 'カタツムリ大作戦'}, self.USER3)

        # USER3は、フレームを削除する
        self.delete_uri(f'/api/v0/frames/{frame_uuid}', self.USER3)

        # USER3は、ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER3)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_a_uuid}', self.USER0)
        self.delete_uri(f'/api/v0/projects/{project_b_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER0)
        self.delete_uri('/api/v0/trashes', self.USER3)

    def test_exec_flow_in_project(self):
        """
        プロジェクトメンバはプロジェクト内のFlowを実行できること
        """
        pass

    def test_cannot_exec_flow_in_project(self):
        """
        プロジェクトメンバでないユーザはプロジェクト内のFlowを実行できないこと
        """
        pass

    def test_exec_flow_using_source_outside_project(self):
        """
        全てのプロジェクトのメンバの場合、データソースが他のプロジェクトに存在するFlowを実行できること
        全てのプロジェクトのメンバでない場合、実行できないこと
        """
        folder_dst_json = {
            "label": "Folderデータデスト",
            "creator": "開発用",
            "createdAt": "2021-03-20 09:29:00",
            "projectId": None,
            "description": "",
            "params": [],
            "ports": [
            [
                {
                "type": "frame",
                "label": "d1",
                "nodeId": "d1"
                }
            ],
            []
            ],
            "nodes": [
                {
                    "id": "d1",
                    "label": "d1",
                    "type": "frame",
                    "uuid": None,
                    "makeCache": False,
                    "dataSource": "csv",
                    "cacheCreatedAt": None
                },
                {
                    "id": "c1",
                    "label": "c1",
                    "type": "command",
                    "commandId": "saver",
                    "args": {},
                    "srcs": {
                        "i": "d1"
                    },
                    "dsts": {
                        "o": "d2"
                    }
                },
                {
                    "id": "d2",
                    "label": "d2",
                    "type": "frame",
                    "uuid": None,
                    "makeCache": False,
                    "dataSource": "csv",
                    "cacheCreatedAt": None
                }
            ]
        }

        sub_flow_json = {
            "label": "test用",
            "creator": "開発用",
            "createdAt": "2021-3-21 11:41:00",
            "projectId": None,
            "description": "",
            "params": [],
            "ports": [
                [
                    {
                        "type": "frame", 
                        "label": "d", 
                        "nodeId": "d"
                    }
                ],
                []
            ],
            "nodes": [
                {
                    "id": "d",
                    "label": "d",
                    "type": "frame",
                    "uuid": None,
                    "makeCache": False,
                    "dataSource": "csv",
                    "cacheCreatedAt": None
                },
                {
                    "id": "f1",
                    "label": "Folderデータデスト",
                    "type": "flow",
                    "uuid": None,
                    "args": {},
                    "srcs": {
                        "d1": "d"
                    },
                    "dsts": {}
                }
            ]
        }

        flow_json = {
            "label": "main",
            "params": [],
            "ports": [[],[]],
            "nodes": [
                {
                    "id": "d",
                    "label": "d",
                    "type": "frame",
                    "uuid": None,
                    "value": [["顧客", "数量", "金額"],
                                ["x", 1, 10],
                                ["x", 2, 20],
                                ["y", 1, 30],
                                ["y", 3, 40],
                                ["z", 1, 50]],
                    "makeCache": False,
                    "dataSource": "csv",
                    "cacheCreatedAt": None
                },
                {
                    "id": "f0",
                    "label": "f0",
                    "type": "flow",
                    "uuid": None,
                    "args": {},
                    "srcs": {
                        "d": "d"
                    },
                    "dsts": {},
                    "srcsOrder": []
                }
            ]
        }

        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトAを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトA'}, self.USER1)
        project_uuid1 = result['uuid']
        project_modified_at1 = result['modifiedAt']

        # プロジェクトBを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトB'}, self.USER1)
        project_uuid2 = result['uuid']
        project_modified_at2 = result['modifiedAt']

        # プロジェクトCを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトC'}, self.USER1)
        project_uuid3 = result['uuid']
        project_modified_at3 = result['modifiedAt']

        # プロジェクトA管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER1.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER2.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER0.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at1
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid1}', data, self.USER1)

        # プロジェクトB管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER1.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER2.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER0.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at2
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid2}', data, self.USER1)

        # プロジェクトC管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER1.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER0.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at3
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid3}', data, self.USER1)


        # プロジェクトC編集者は、プロジェクトC内にデータデストを作成する
        data = {
            'parent': project_uuid3,
            'label': 'データデスト!',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)
        datadest_uuid = result['uuid']

        # プロジェクトC編集者は、データデストのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':datadest_uuid}, self.USER3)
        lock_uuid3 = result['uuid']

        # プロジェクトC編集者は、データデストを編集する
        result = self.put_uri(f'/api/v0/flows/{datadest_uuid}', {'flow':folder_dst_json, 'lock':lock_uuid3}, self.USER3)


        # プロジェクトB編集者は、プロジェクトB内にサブフローを作成する
        data = {
            'parent': project_uuid2,
            'label': '私のSubフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)
        sub_flow_uuid = result['uuid']

        # プロジェクトB編集者は、サブフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':sub_flow_uuid}, self.USER2)
        lock_uuid2 = result['uuid']

        # プロジェクトB編集者は、サブフローを編集する
        sub_flow_json['nodes'][1]['uuid'] = datadest_uuid
        result = self.put_uri(f'/api/v0/flows/{sub_flow_uuid}', {'flow':sub_flow_json, 'lock':lock_uuid2}, self.USER2)


        # プロジェクトA編集者は、プロジェクトA内にFlowを作成する
        data = {
            'parent': project_uuid1,
            'label': '私のフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER0)
        flow_uuid = result['uuid']

        # プロジェクトA編集者は、フローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER0)
        lock_uuid1 = result['uuid']

        # プロジェクトA編集者は、フローを編集する
        flow_json['nodes'][1]['uuid'] = sub_flow_uuid
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', {'flow':flow_json, 'lock':lock_uuid1}, self.USER0)

        # 
        # USER0は、Flowを実行できること
        # 
        result = self.post_uri('/api/v0/activities', {'uuid':flow_uuid}, self.USER0)
        activity_uuid = result['uuid']

        # # 
        # # USER1は、Flowを実行できること
        # # 
        # result = self.post_uri('/api/v0/frames', {'flow_uuid':flow_uuid}, self.USER1)
        # lasts = result

        # 
        # USER2は、Flowを実行できないこと!
        # 
        with self.assertRaises(AssertionError):
            self.post_uri('/api/v0/frames', {'flow_uuid':flow_uuid}, self.USER2)

        # 編集者は、フローをゴミ箱へほかす
        self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}', {'lock':lock_uuid1}, self.USER0)
        self.delete_uri_with_json(f'/api/v0/flows/{sub_flow_uuid}', {'lock':lock_uuid2}, self.USER2)
        self.delete_uri_with_json(f'/api/v0/flows/{datadest_uuid}', {'lock':lock_uuid3}, self.USER3)

        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid1}', self.USER0)
        self.delete_uri(f'/api/v0/locks/{lock_uuid2}', self.USER2)
        self.delete_uri(f'/api/v0/locks/{lock_uuid3}', self.USER3)

        # プロジェクト管理者はプロジェクトをゴミ箱へほかす
        self.delete_uri(f'/api/v0/projects/{project_uuid3}', self.USER1)
        self.delete_uri(f'/api/v0/projects/{project_uuid2}', self.USER1)
        self.delete_uri(f'/api/v0/projects/{project_uuid1}', self.USER1)

        # 
        # プロジェクトAを削除しても、プロジェクトAに属するActivityが残るため、'プロジェクトA_readers'ロールが残る
        # ここでロールが残るとself.test_get_admin_user()などのテストケースがパスしなくなる
        # そのため、ここで生成されたActivityを強制的に削除する
        # 
        project1 = self.factory.data.find_by_uuid(project_uuid1)
        activity = self.factory.data.find_by_uuid(activity_uuid)
        # プロジェクトAに更新権限を付与する
        project1_writers_role = project1._find_writers_role()
        project1_writers_role.init_authz(activity.id, read=True, write=True, own=True)
        # Activityをほかす
        activity.throw_away()
        # 削除を確定する
        self.factory.end()

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    # 
    # Edit Lock
    # 

    def test_edit_locked_flow(self):
        """
        フローの情報にeditLock属性が設定されていること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'後白河上皇'}, self.USER1)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '山法師と鴨川と賽子',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER1)
        flow_uuid = result['children'][0]['uuid']

        # 編集ロックはFalseであること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)
        self.assertTrue(result['allowlist']['lock'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['editLock'])

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER1)

        # フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

        # 編集ロックはTrueであること
        # allowlistのlockとcopyは編集ロックの値に影響されないこと
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)
        self.assertTrue(result['allowlist']['lock'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['editLock'])

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローを編集ロックする
        data = {
            'editLock' : False,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER1)

        # フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

        # 編集ロックはFalseであること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)
        self.assertTrue(result['allowlist']['lock'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['editLock'])

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_edit_locked_by_reader(self):
        """
        閲覧者は編集ロックの値を変更できないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'猫耳モード'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': 'うにゃあ',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)

        # 閲覧者は、フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # 閲覧者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 閲覧者は、フローを編集ロックできないこと
        data = {
            'editLock' : True,
            'lock' : lock_uuid
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集ロックはFalseであること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertFalse(result['editLock'])

        # 閲覧者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)


        # プロジェクト管理者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER2)
        lock_uuid = result['uuid']

        # プロジェクト管理者は、フローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER2)

        # 編集ロックはTrueであること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['lock'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['editLock'])

        # プロジェクト管理者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER2)


        # 閲覧者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 閲覧者は、フローの編集ロックを解除できないこと
        data = {
            'editLock' : False,
            'lock' : lock_uuid
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集ロックはTrueのままであること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertTrue(result['editLock'])

        # プロジェクト管理者は、フローの編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER2)

        # 閲覧者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_exec_edit_locked_flow(self):
        """
        編集ロックがONのFlowを実行できること
        """
        # ROOTを取得する
        root = self.factory2.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'後鳥羽上皇'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '隠岐に島流し',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # 編集者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 編集者は、フローを変更する
        data = {
            'flow' : copy.deepcopy(self.flow_json),
            'label': 'いやでおじゃる',
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクト管理者は、編集ロックされた、かつキャッシュ出力をするフローをプレビューできること
        # (編集ロックによりキャッシュ出力をしない)
        vis_args = {"uuid": flow_uuid,
                    "args": {"use_cache": True,
                             "vis": {
                                "d1": {
                                    "command_id": "csvtohtmltable",
                                    "args": {
                                        "offset": 0,
                                        "limit": 100
                                    }
                                }
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER2)
        outs = result['outs']

        # ラベルとIDチェック
        self.assertEqual(outs[0]['id'], 'd1')

        # プロジェクト管理者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER2)
        lock_uuid = result['uuid']

        # プロジェクト管理者は、フローの編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # フローのキャッシュ出力をOFFにする
        flow_json = copy.deepcopy(self.flow_json)
        flow_json['nodes'][0]['makeCache'] = False

        # プロジェクト管理者は、フローを変更する
        data = {
            'flow' : flow_json,
            'label': '都落ちなどしとうない',
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER2)

        # プロジェクト管理者は、フローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER2)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER2)

        # プロジェクト管理者は、編集ロックされたフローをプレビューできること
        vis_args = {"uuid": flow_uuid,
                    "args": {"use_cache": True,
                             "vis": {
                                "d1": {
                                    "command_id": "csvtohtmltable",
                                    "args": {
                                        "offset": 0,
                                        "limit": 100
                                    }
                                }
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER2)
        outs = result['outs']

        # ラベルとIDチェック
        self.assertEqual(outs[0]['id'], 'd1')

        # プロジェクト管理者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER2)
        lock_uuid = result['uuid']

        # プロジェクト管理者は、フローの編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # プロジェクト管理者は、フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}', {'lock':lock_uuid}, self.USER2)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER2)

        # プロジェクト管理者は、プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_cannot_update_edit_locked_flow(self):
        """
        編集ロックがONのFlowは更新・削除ができないこと
        """
        # ROOTを取得する
        root = self.factory2.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'にゃゴーにゃゴー'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': 'ニャお〜ん',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # 編集者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 編集者は、フローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # 編集者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 編集者は、フローを変更できないこと
        data = {
            'flow' : copy.deepcopy(self.flow_json),
            'label': 'ワオーン',
            'lock' : lock_uuid
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクト管理者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER2)
        lock_uuid = result['uuid']

        # プロジェクト管理者は、プロジェクトを削除できないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクト管理者は、フローの編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER2)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクト管理者は、プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_cannot_edit_lock_locked_flow(self):
        """
        排他ロック中のFlowの編集ロックは変更できないこと
        """
        # ROOTを取得する
        root = self.factory2.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'後醍醐天皇'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '足利髙氏',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # 編集者は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # プロジェクト管理者は、他ユーザが排他ロック中のフローの排他ロックを取得できないこと
        with self.assertRaises(AssertionError):
            self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER2)

        # プロジェクト管理者は、他ユーザが排他ロック中のフローを編集ロックできないこと
        data = {
            'editLock' : True
        }
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER2)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクト管理者は、プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    #
    # Other Datum
    # 

    def test_cannot_read_cache_by_creator(self):
        """
        キャッシュの作成者であっても
        プロジェクトメンバでなければキャッシュを参照できないこと
        """
        # ROOTを取得する
        root = self.factory2.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'上様を語る不届き者じゃ'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '出逢え出逢え！',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # 編集者は、フローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 編集者は、フローを変更する
        data = {
            'flow' : copy.deepcopy(self.flow_json),
            'label': '構わん、此奴を切って捨てえい！',
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローをプレビュー実行して、キャッシュファイルを作成する
        vis_args = {"uuid": flow_uuid,
                    "lock": lock_uuid,
                    "args": {"use_cache": True,
                             "vis": {
                                "d1": {
                                    "command_id": "csvtohtmltable",
                                    "args": {
                                        "offset": 0,
                                        "limit": 100
                                    }
                                }
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER3)
        outs = result['outs']

        # ラベルとIDチェック
        self.assertEqual(outs[0]['id'], 'd1')

        # 作成したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        # プレビューを持つポイントが存在すること
        self.assertEqual(result['flow']['nodes'][0]['id'], 'd')
        # TODO: POST /vizsでロックのUUIDを指定可能にして、キャッシュを作成できるようにする予定
        self.assertIsNotNone(result['flow']['nodes'][0]['uuid'], msg='キャッシュが作成できませんでした')
        cache_uuid = result['flow']['nodes'][0]['uuid']

        # 編集者をプロジェクトから脱退させる
        result = self.delete_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER3.uuid}', self.USER2)

        # USER3は、プロジェクトから外れたのでUSER3はキャッシュを参照できないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{cache_uuid}', self.USER3)

        # プロジェクト管理者はキャッシュを参照できること
        result = self.get_uri(f'/api/v0/frames/{cache_uuid}', self.USER2)

        # フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER2)

        # プロジェクトとキャッシュを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.delete_uri(f'/api/v0/frames/{cache_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_duplicate_flow_with_cache(self):
        """
        キャッシュを持つフローを複製しても、
        キャッシュの権限はフローのプロジェクトに紐づいていること
        """
        # ROOTを取得する
        root = self.factory2.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'祇園精舎の鐘の声'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '諸行無常の響きあり',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # 編集者は、フローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # 編集者は、フローを変更する
        data = {
            'flow' : copy.deepcopy(self.flow_json),
            'label': '娑羅双樹の花の色盛者必衰の理を表わす',
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', data, self.USER3)

        # 編集者は、フローをプレビュー実行して、キャッシュファイルを作成する
        vis_args = {"uuid": flow_uuid,
                    "lock": lock_uuid,
                    "args": {"use_cache": True,
                             "vis": {
                                "d1": {
                                    "command_id": "csvtohtmltable",
                                    "args": {
                                        "offset": 0,
                                        "limit": 100
                                    }
                                }
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER3)
        outs = result['outs']

        # ラベルとIDチェック
        self.assertEqual(outs[0]['id'], 'd1')

        # 作成したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        # プレビューを持つポイントが存在すること
        self.assertEqual(result['flow']['nodes'][0]['id'], 'd')
        # TODO: POST /vizsでロックのUUIDを指定可能にして、キャッシュを作成できるようにする予定
        self.assertIsNotNone(result['flow']['nodes'][0]['uuid'], msg='キャッシュが作成できませんでした')

        # 編集者は、フローのロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクト管理者は、フローを複製する
        data = {
            'source': flow_uuid
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER2)
        flow_uuid = result['children'][0]['uuid']

        # 編集者は、複製したフローをプレビュー実行できること
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER3)
        data = result

        # プロジェクトに属さないユーザは、複製したフローをプレビュー実行できないこと
        with self.assertRaises(AssertionError):
            self.post_uri(f'/api/v0/activities', vis_args, self.USER0)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)
        
    def test_download_file(self):
        """
        閲覧者はフレームをダウンロードできないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'STAR⭐️BUCKS'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクト内にフレームを作成する
        f = io.BytesIO(b'Every cup has a story')
        result = self.post_frames('TULLY\'s', project_uuid, f, self.USER2)
        frame_uuid = result['uuid']

        # プロジェクトのメンバでないユーザは、フレームをダウンロードできないこと
        with self.assertRaises(AssertionError):
            result = self.get_file(f'/api/v0/frames/{frame_uuid}?contents=on', charset=None, user=self.USER3)

        # USER3を閲覧者メンバとして参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 閲覧者メンバはフレームをダウンロードできないこと
        with self.assertRaises(AssertionError):
            self.get_file(f'/api/v0/frames/{frame_uuid}?contents=on', charset=None, user=self.USER3)

        # USER3を編集者メンバとして参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # ダウンロード文字コードの設定がcp932の場合は改行コードがCR＋LFになる
        if os.environ.get('STREAMCAT_FRAME_CHARACTER_CODE') == 'cp932':
            expected_frame = b'Every cup has a story\r\n'
        else:
            expected_frame = b'Every cup has a story\n'

        # 編集者メンバはフレームをダウンロードできること
        result = self.get_file(f'/api/v0/frames/{frame_uuid}?contents=on', charset=None, user=self.USER3)
        self.assertEqual(result, expected_frame)

        # プロジェクト管理者はフレームーをダウンロードできること
        result = self.get_file(f'/api/v0/frames/{frame_uuid}?contents=on', charset=None, user=self.USER2)
        self.assertEqual(result, expected_frame)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)
