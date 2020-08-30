import unittest
import pprint
from kskp.core.datum import Datum
from kskp.web.backend.api.tests.api_test_case_base import ApiTestCaseBase
from kskp.store.auth import Role

class SystemTestCase(ApiTestCaseBase):

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
        self.assertNotIn('roles', result['data'])
        self.assertNotIn('projects', result['data'])
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
        self.assertNotIn('roles', result['data'])
        self.assertNotIn('projects', result['data'])
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
        self.assertNotIn('roles', result['data'])
        self.assertNotIn('projects', result['data'])
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
        self.assertNotIn('roles', result['data'])
        self.assertNotIn('projects', result['data'])
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
        self.assertNotIn('roles', result['data'])
        self.assertNotIn('projects', result['data'])
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
        result = self.get_uri(f'/api/v0/users/{self.USER0.uuid}?roles=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'Admin@kskp.io')
        self.assertEqual(result['data']['name'], 'システム管理者')
        self.assertEqual(result['data']['state'], 'active')
        # EveryOneロール
        self.assertEqual(result['data']['roles'][0]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['data']['roles'][0]['name'], self.expected_everyone['name'])
        self.assertEqual(result['data']['roles'][0]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['data']['roles'][0]['creator'])
        self.assertIsNotNone(result['data']['roles'][0]['createdAt'])
        # システム管理者ロール
        self.assertEqual(result['data']['roles'][1]['uuid'], self.expected_sys_admin['uuid'])
        self.assertEqual(result['data']['roles'][1]['name'], self.expected_sys_admin['name'])
        self.assertEqual(result['data']['roles'][1]['systemRole'], self.expected_sys_admin['systemRole'])
        self.assertIsNotNone(result['data']['roles'][1]['creator'])
        self.assertIsNotNone(result['data']['roles'][1]['createdAt'])
        # 本人ロール
        self.assertIsNotNone(result['data']['roles'][2]['uuid'])
        self.assertEqual(result['data']['roles'][2]['name'], 'システム管理者')
        self.assertEqual(result['data']['roles'][2]['systemRole'], '')
        self.assertIsNotNone(result['data']['roles'][2]['creator'])
        self.assertIsNotNone(result['data']['roles'][2]['createdAt'])
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザ管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER1.uuid}?roles=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'admin@kskp.io')
        self.assertEqual(result['data']['name'], 'ユーザ管理者')
        self.assertEqual(result['data']['state'], 'active')
        # EveryOneロール
        self.assertEqual(result['data']['roles'][0]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['data']['roles'][0]['name'], self.expected_everyone['name'])
        self.assertEqual(result['data']['roles'][0]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['data']['roles'][0]['creator'])
        self.assertIsNotNone(result['data']['roles'][0]['createdAt'])
        # システム管理者ロール
        self.assertEqual(result['data']['roles'][1]['uuid'], self.expected_usr_admin['uuid'])
        self.assertEqual(result['data']['roles'][1]['name'], self.expected_usr_admin['name'])
        self.assertEqual(result['data']['roles'][1]['systemRole'], self.expected_usr_admin['systemRole'])
        self.assertIsNotNone(result['data']['roles'][1]['creator'])
        self.assertIsNotNone(result['data']['roles'][1]['createdAt'])
        # 登録状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertIsNotNone(result['data']['createdAt'])

    def test_get_usr_with_projects(self):
        """
        Userの所属プロジェクトを取得する
        """
        # ROOTを取得する
        flow_folder = self.factory.data.load_flow_folder()

        # プロジェクトを作成する
        data = {'parent': flow_folder.uuid,
                'label' : 'プロジェクトX'}
        self.post_uri('/api/v0/projects', data, self.USER2)

        # プロジェクトを作成する
        data = {'parent': flow_folder.uuid,
                'label' : 'プロジェクトY'}
        self.post_uri('/api/v0/projects', data, self.USER2)

        # プロジェクト管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER2.uuid}?projects=on', self.USER3)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'test@kskp.io')
        self.assertEqual(result['data']['name'], 'Test')
        self.assertEqual(result['data']['state'], 'active')
        # プロジェクトX
        self.assertIsNotNone(result['data']['projects'][0]['uuid'])
        self.assertEqual(result['data']['projects'][0]['type'], Datum.PROJECT_TYPE)
        self.assertEqual(result['data']['projects'][0]['label'], 'プロジェクトX')
        self.assertTrue(result['data']['projects'][0]['readable'])
        self.assertIsNone(result['data']['projects'][0]['prevFolderPath'])
        self.assertIsNotNone(result['data']['projects'][0]['creator'])
        self.assertIsNotNone(result['data']['projects'][0]['createdAt'])
        # プロジェクトY
        self.assertIsNotNone(result['data']['projects'][1]['uuid'])
        self.assertEqual(result['data']['projects'][1]['type'], Datum.PROJECT_TYPE)
        self.assertEqual(result['data']['projects'][1]['label'], 'プロジェクトY')
        self.assertTrue(result['data']['projects'][1]['readable'])
        self.assertIsNone(result['data']['projects'][1]['prevFolderPath'])
        self.assertIsNotNone(result['data']['projects'][1]['creator'])
        self.assertIsNotNone(result['data']['projects'][1]['createdAt'])


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

    def test_putback_user(self):
        """
        論理削除Userを登録状態Userに戻す
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'inactive-user!@ksk-anl.com', 'name':'論理削除ユーザです！', 'password':'AadiemtJ89'}, self.USER1)
        user_uuid = result['data']['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('passoiuyt*')

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # 登録ユーザは論理削除されていること
        self.assertEqual(result['data']['state'], 'inactive')

        # 論理削除ユーザを登録ユーザに戻す
        result = self.put_uri(f'/api/v0/users/{user_uuid}/undelete', {}, self.USER1)

        # 登録ユーザに戻っていること
        self.assertEqual(result['data']['state'], 'active')

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
        role_uuid = result['data']['uuid']

        # ロールを取得する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['name'], 'テストロール')
        self.assertEqual(result['data']['systemRole'], '')
        self.assertNotIn('users', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

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
        role_uuid = result['data']['uuid']

        # ロール情報を変更する
        result = self.put_uri(f'/api/v0/roles/{role_uuid}', {'name':'ロールケーキ'}, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], role_uuid)
        self.assertEqual(result['data']['name'], 'ロールケーキ')
        self.assertEqual(result['data']['systemRole'], '')
        self.assertNotIn('users', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER1)

    def test_get_all_role(self):
        """
        全てのRoleを取得する
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'テストロールですよっと'}, self.USER2)
        role_uuid = result['data']['uuid']

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
        Roleの所属ユーザを取得する
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'にゃーお'}, self.USER0)
        role_uuid = result['data']['uuid']

        # ユーザを参加させる
        result = self.put_uri(f'/api/v0/roles/{role_uuid}/users/{self.USER2.uuid}', {}, self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?users=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], role_uuid)
        self.assertEqual(result['data']['name'], 'にゃーお')
        self.assertEqual(result['data']['systemRole'], '')
        self.assertEqual(result['data']['creator'], 'システム管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        # 参加ユーザ
        self.assertEqual(len(result['data']['users']), 1)
        self.assertEqual(result['data']['users'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['data']['users'][0]['email'], self.USER2.email)
        self.assertEqual(result['data']['users'][0]['name'], self.USER2.name)
        self.assertEqual(result['data']['users'][0]['state'], self.USER2.state)
        self.assertEqual(result['data']['users'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['data']['users'][0]['createdAt'], self.USER2.created_at_str)

        # ユーザを脱退させる
        result = self.delete_uri(f'/api/v0/roles/{role_uuid}/users/{self.USER2.uuid}', self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?users=on', self.USER0)

        # 参加ユーザがいないことを確認する
        self.assertEqual(len(result['data']['users']), 0)

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER0)

