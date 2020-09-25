import io
import unittest
import pprint
from kskp.core.datum import Datum
from kskp.store.auth import Role
from .api_test_case_base import ApiTestCaseBase

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

    # 
    # Users
    # 

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

    def test_update_user(self):
        """
        ユーザ情報を変更する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'aaa-bbb_ccc@ksk-anl.com', 'name':'一般ユーザです', 'password':'0123iampassword!'}, self.USER1)
        user_uuid = result['data']['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('hogehoge')

        # ユーザ管理者は、ユーザ情報を変更する
        expected = {
            'email': '変更後＠aiueo.co.jp',
            'name' : '私はカモメ',
            'password' : '#yerhfkdi'
        }
        result = self.put_uri(f'/api/v0/users/{user_uuid}', expected, self.USER1)

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
        # 論理削除状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

    def test_update_user_by_self(self):
        """
        一般ユーザが自分のユーザ情報を変更する
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'harunobu@kai.co.jp', 'name':'武田晴信', 'password':'abc012_-%[]();'}, self.USER1)
        user_uuid = result['data']['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('fuurinkazann')

        # ユーザ情報を変更する
        expected = {
            'email': 'harunobu＠shinano.co.jp',
            'name' : '武田信玄',
            'password' : 'ugokazarukoto-yamanogotoshi',
            'currentPassword' : 'fuurinkazann'
        }
        result = self.put_uri(f'/api/v0/users/self', expected, new_user)

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
        # 論理削除状態なのでpassword属性は返されない
        self.assertNotIn('password', result['data'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

    def test_update_user_by_other(self):
        """
        一般ユーザが他人のユーザ情報を変更できないこと
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'kagetora@echigo.co.jp', 'name':'長尾景虎', 'password':'bishamon123'}, self.USER1)
        user_uuid = result['data']['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('bishamontenn123')

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
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'kagetora@echigo.co.jp')
        self.assertEqual(result['data']['name'], '長尾景虎')
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
        self.assertEqual(result['data']['email'], 'kagetora@echigo.co.jp')
        self.assertEqual(result['data']['name'], '長尾景虎')
        self.assertEqual(result['data']['state'], 'inactive')
        self.assertNotIn('roles', result['data'])
        self.assertNotIn('projects', result['data'])
        # 論理削除状態なのでpassword属性は返されない
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
        root = self.factory.data.load_root()

        # ユーザ2は、本登録処理をする
        # (MyProjectが作成される)
        self.post_register_complete(self.USER2.email, 'adminpass0', self.USER2)

        # プロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : 'プロジェクトX'}
        self.post_uri('/api/v0/projects', data, self.USER2)

        # プロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : 'プロジェクトY'}
        self.post_uri('/api/v0/projects', data, self.USER2)

        # プロジェクトメンバでないユーザが、プロジェクト管理者を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER2.uuid}?projects=on', self.USER3)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'test@kskp.io')
        self.assertEqual(result['data']['name'], 'Test')
        self.assertEqual(result['data']['state'], 'active')
        # プロジェクトメンバでないユーザが所属しないプロジェクトは取得できない
        self.assertEqual(len(result['data']['projects']), 0)

        # 自分のユーザ情報を取得する
        result = self.get_uri(f'/api/v0/users/{self.USER2.uuid}?projects=on', self.USER2)
        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'test@kskp.io')
        self.assertEqual(result['data']['name'], 'Test')
        self.assertEqual(result['data']['state'], 'active')
        # プロジェクトメンバでないユーザが所属しないプロジェクトは取得できない
        self.assertEqual(len(result['data']['projects']), 3)
        # MyProject
        self.assertIsNotNone(result['data']['projects'][0]['uuid'])
        self.assertEqual(result['data']['projects'][0]['type'], Datum.PROJECT_TYPE)
        self.assertEqual(result['data']['projects'][0]['label'], 'MyProject')
        self.assertIsNone(result['data']['projects'][0]['prevFolderPath'])
        self.assertIsNotNone(result['data']['projects'][0]['creator'])
        self.assertIsNotNone(result['data']['projects'][0]['createdAt'])
        # プロジェクトX
        self.assertIsNotNone(result['data']['projects'][1]['uuid'])
        self.assertEqual(result['data']['projects'][1]['type'], Datum.PROJECT_TYPE)
        self.assertEqual(result['data']['projects'][1]['label'], 'プロジェクトX')
        self.assertIsNone(result['data']['projects'][1]['prevFolderPath'])
        self.assertIsNotNone(result['data']['projects'][1]['creator'])
        self.assertIsNotNone(result['data']['projects'][1]['createdAt'])
        # プロジェクトY
        self.assertIsNotNone(result['data']['projects'][2]['uuid'])
        self.assertEqual(result['data']['projects'][2]['type'], Datum.PROJECT_TYPE)
        self.assertEqual(result['data']['projects'][2]['label'], 'プロジェクトY')
        self.assertIsNone(result['data']['projects'][2]['prevFolderPath'])
        self.assertIsNotNone(result['data']['projects'][2]['creator'])
        self.assertIsNotNone(result['data']['projects'][2]['createdAt'])

    def test_get_tmp_user_with_roles(self):
        """
        一度も登録状態になっていないUserの本人ロールは存在しない
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'メール@アドレス.co.jp', 'name':'平将門', 'password':None}, self.USER1)
        user_uuid = result['data']['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?roles=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'メール@アドレス.co.jp')
        self.assertEqual(result['data']['name'], '平将門')
        self.assertEqual(result['data']['state'], 'tmp')
        # 本人ロールは存在しないので所属するロールはeveryoneのみである
        self.assertEqual(len(result['data']['roles']), 1)
        # EveryOneロール
        self.assertEqual(result['data']['roles'][0]['uuid'], self.expected_everyone['uuid'])
        self.assertEqual(result['data']['roles'][0]['name'], self.expected_everyone['name'])
        self.assertEqual(result['data']['roles'][0]['systemRole'], self.expected_everyone['systemRole'])
        self.assertIsNotNone(result['data']['roles'][0]['creator'])
        self.assertIsNotNone(result['data']['roles'][0]['createdAt'])
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsNotNone(result['data']['password'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_get_tmp_user_with_projects(self):
        """
        一度も登録状態になっていないUserのMyProjectは存在しない
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'iam.new-man@ksk-anl.co.jp', 'name':'IAM New Man', 'password':None}, self.USER1)
        user_uuid = result['data']['uuid']

        # ユーザを取得する
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['email'], 'iam.new-man@ksk-anl.co.jp')
        self.assertEqual(result['data']['name'], 'IAM New Man')
        self.assertEqual(result['data']['state'], 'tmp')
        # MyProjectも含め所属するプロジェクトは存在しない
        self.assertEqual(len(result['data']['projects']), 0)
        # ユーザ管理者は仮パスワードは確認することができる
        self.assertIsNotNone(result['data']['password'])
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_delete_tmp_user(self):
        """
        一旦登録状態になったUserが仮登録状態になった後、
        削除すると論理削除となること
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'gentoku@shoku.go.china', 'name':'劉備玄徳', 'password':None}, self.USER1)
        user_uuid = result['data']['uuid']

        # ユーザを取得する
        new_user = self.factory.user.find_by_uuid(user_uuid)

        # ユーザを登録状態にする
        self.post_register_complete(new_user.email, 'password012345', new_user)

        # ユーザのパスワードをリセットする
        # (ユーザを仮登録状態にする)
        self.put_uri(f'/api/v0/users/{user_uuid}', {'password':None}, self.USER1)

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザは論理削除状態になること
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)
        self.assertEqual(result['data']['state'], 'inactive')

        # 同じユーザを2回論理削除してもエラーにならないこと
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

        # ユーザは論理削除状態のママのこと
        result = self.get_uri(f'/api/v0/users/{user_uuid}?projects=on', self.USER1)
        self.assertEqual(result['data']['state'], 'inactive')

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
        Roleにユーザを参加・脱退させる
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

    def test_join_leave_user_to_role2(self):
        """
        Roleにユーザを参加・脱退させる
        (PUT /roles を用いる)
        """
        # ロールを作成する
        result = self.post_uri('/api/v0/roles', {'name':'チュール🐱'}, self.USER0)
        role_uuid = result['data']['uuid']

        # ユーザを参加させる
        data = {
            'name'   : 'ちゃおちゅーる🐈',
            'users': [self.USER2.uuid, self.USER3.uuid]
        }
        result = self.put_uri(f'/api/v0/roles/{role_uuid}', data, self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?users=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], role_uuid)
        self.assertEqual(result['data']['name'], 'ちゃおちゅーる🐈')
        self.assertEqual(result['data']['systemRole'], '')
        self.assertEqual(result['data']['creator'], 'システム管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['data']['users']), 2)
        self.assertEqual(result['data']['users'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['data']['users'][0]['email'], self.USER2.email)
        self.assertEqual(result['data']['users'][0]['name'], self.USER2.name)
        self.assertEqual(result['data']['users'][0]['state'], self.USER2.state)
        self.assertEqual(result['data']['users'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['data']['users'][0]['createdAt'], self.USER2.created_at_str)
        # 参加ユーザ(USER3)
        self.assertEqual(result['data']['users'][1]['uuid'], self.USER3.uuid)
        self.assertEqual(result['data']['users'][1]['email'], self.USER3.email)
        self.assertEqual(result['data']['users'][1]['name'], self.USER3.name)
        self.assertEqual(result['data']['users'][1]['state'], self.USER3.state)
        self.assertEqual(result['data']['users'][1]['creator'], self.USER3.creator_str)
        self.assertEqual(result['data']['users'][1]['createdAt'], self.USER3.created_at_str)

        # ユーザを脱退させる
        data = {
            'users': []
        }
        result = self.put_uri(f'/api/v0/roles/{role_uuid}', data, self.USER0)

        # ロールを検索する
        result = self.get_uri(f'/api/v0/roles/{role_uuid}?users=on', self.USER0)

        # 参加ユーザがいないことを確認する
        self.assertEqual(len(result['data']['users']), 0)

        # ロールを削除する
        self.delete_uri(f'/api/v0/roles/{role_uuid}', self.USER0)

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
        project_uuid = result['data']['uuid']

        # ユーザを参加させる
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Reader'}, self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER0)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], project_uuid)
        self.assertEqual(result['data']['type'], 'project')
        self.assertEqual(result['data']['label'], 'プロジェクトだよ')
        self.assertEqual(result['data']['children'], [])
        self.assertEqual(result['data']['creator'], 'システム管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')
        # 作成ユーザ
        self.assertEqual(len(result['data']['members']), 3)
        self.assertEqual(result['data']['members'][0]['uuid'], self.USER0.uuid)
        self.assertEqual(result['data']['members'][0]['email'], self.USER0.email)
        self.assertEqual(result['data']['members'][0]['name'], self.USER0.name)
        self.assertEqual(result['data']['members'][0]['state'], self.USER0.state)
        self.assertEqual(result['data']['members'][0]['creator'], self.USER0.creator_str)
        self.assertEqual(result['data']['members'][0]['createdAt'], self.USER0.created_at_str)
        self.assertEqual(result['data']['members'][0]['type'], 'Owner')
        # システム管理者
        self.assertEqual(result['data']['members'][1]['uuid'], self.USER1.uuid)
        self.assertEqual(result['data']['members'][1]['email'], self.USER1.email)
        self.assertEqual(result['data']['members'][1]['name'], self.USER1.name)
        self.assertEqual(result['data']['members'][1]['state'], self.USER1.state)
        self.assertEqual(result['data']['members'][1]['creator'], self.USER1.creator_str)
        self.assertEqual(result['data']['members'][1]['createdAt'], self.USER1.created_at_str)
        self.assertEqual(result['data']['members'][1]['type'], 'Owner')
        # 参加ユーザ
        self.assertEqual(result['data']['members'][2]['uuid'], self.USER2.uuid)
        self.assertEqual(result['data']['members'][2]['email'], self.USER2.email)
        self.assertEqual(result['data']['members'][2]['name'], self.USER2.name)
        self.assertEqual(result['data']['members'][2]['state'], self.USER2.state)
        self.assertEqual(result['data']['members'][2]['creator'], self.USER2.creator_str)
        self.assertEqual(result['data']['members'][2]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['data']['members'][2]['type'], 'Reader')

        # ユーザを脱退させる
        result = self.delete_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER0)

        # 参加ユーザは2人である
        self.assertEqual(len(result['data']['members']), 2)

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
        project_uuid = result['data']['uuid']

        # ユーザを参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}]
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER0)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)
        
        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], project_uuid)
        self.assertEqual(result['data']['type'], 'project')
        self.assertEqual(result['data']['label'], 'プロジェクトですよ')
        self.assertEqual(result['data']['children'], [])
        self.assertEqual(result['data']['creator'], 'システム管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')
        # 参加ユーザ(USER2)
        self.assertEqual(len(result['data']['members']), 2)
        self.assertEqual(result['data']['members'][0]['uuid'], self.USER2.uuid)
        self.assertEqual(result['data']['members'][0]['email'], self.USER2.email)
        self.assertEqual(result['data']['members'][0]['name'], self.USER2.name)
        self.assertEqual(result['data']['members'][0]['state'], self.USER2.state)
        self.assertEqual(result['data']['members'][0]['creator'], self.USER2.creator_str)
        self.assertEqual(result['data']['members'][0]['createdAt'], self.USER2.created_at_str)
        self.assertEqual(result['data']['members'][0]['type'], 'Owner')
        # 参加ユーザ(USER3)
        self.assertEqual(result['data']['members'][1]['uuid'], self.USER3.uuid)
        self.assertEqual(result['data']['members'][1]['email'], self.USER3.email)
        self.assertEqual(result['data']['members'][1]['name'], self.USER3.name)
        self.assertEqual(result['data']['members'][1]['state'], self.USER3.state)
        self.assertEqual(result['data']['members'][1]['creator'], self.USER3.creator_str)
        self.assertEqual(result['data']['members'][1]['createdAt'], self.USER3.created_at_str)
        self.assertEqual(result['data']['members'][1]['type'], 'Reader')

        # ユーザを脱退させる
        data = {
            'members': [{'uuid' : self.USER3.uuid, 'type': 'Owner'}]
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクトを検索する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER3)

        # 参加ユーザは1人である
        self.assertEqual(len(result['data']['members']), 1)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

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
        project_uuid = result['data']['uuid']

        # プロジェクト管理者は、プロジェクト内にFlowを作成する
        data = {
            'project_uuid': project_uuid,
            'name': '私のフロー',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)

        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)
        flow_uuid = result['data']['children'][0]['uuid']

        # プロジェクト管理者は、プロジェクトメンバを設定する
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Writer'}]
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # 編集者は、フローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['data']['uuid']
            
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
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER3)

    def test_cannot_update_database_in_project(self):
        """
        プロジェクトの閲覧者はそのプロジェクト内のDatumを編集できないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'Testプロジェクト'}, self.USER2)
        project_uuid = result['data']['uuid']

        # プロジェクト管理者は、プロジェクト内にdatabaseを作成する
        data = {
            "parent"   : project_uuid,
            "label"    : "社内データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            "user_id"  : "postgres",
            "password" : "password"
        }
        result = self.post_uri('/api/v0/databases', data, self.USER2)
        database_uuid = result['data']['uuid']

        # プロジェクトメンバではないユーザは、databaseを変更できない
        data = {
            "label"    : "社内データベースA",
            "dbms"     : "ORACLE",
            "hostname" : "db0",
            "port"     : 2935,
            "database" : "kskp",
            "user_id"  : "scott",
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
        project_uuid = result['data']['uuid']

        # プロジェクト管理者は、プロジェクト内にフローを作成する
        data = {
            'project_uuid': project_uuid,
            'name': 'なか卯',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)

        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?members=on', self.USER2)
        flow_uuid = result['data']['children'][0]['uuid']

        # プロジェクト管理者は、プロジェクト内にフレームを作成する
        f = (io.BytesIO(b'wxyz'), 'frame1.csv')
        result = self.post_frames('𠮷野家', project_uuid, f, self.USER2)
        frame_uuid = result['data']['uuid']

        # プロジェクトのメンバでないユーザは、フローとフレームを参照できないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER3)

        # USER3をメンバに参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}]
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # プロジェクトのメンバとなったユーザは、フローとフレームを参照できること
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        self.assertEqual(result['data']['label'], 'なか卯')
        result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER3)
        # 驚いたことにGET /framesではlabelを返していない
        # self.assertEqual(result['data']['label'], '𠮷野家')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

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
        データソースが他のプロジェクトに存在するFlowを実行できること
        """
        pass

    def test_exec_flow_using_subflow_outside_project(self):
        """
        サブフローが他のプロジェクトに存在するFlowを実行できること
        """
        pass

    def test_cannot_exec_flow_using_source_outside_project(self):
        """
        データソースが他のプロジェクトに存在するFlowを実行できないこと
        """
        pass

    def test_cannot_exec_flow_using_subflow_outside_project(self):
        """
        サブフローが他のプロジェクトに存在するFlowを実行できないこと
        """
        pass

    #
    # Other Datum
    # 

    def test_allowlist(self):
        """
        Datumのallowlistを検証する
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'暴れん坊将軍'}, self.USER1)
        project_uuid = result['data']['uuid']

        # 
        # USER2を、プロジェクトに編集者メンバとして参加させる
        # 
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Writer'}, self.USER1)

        # プロジェクトの下にフォルダを作成する
        result = self.post_uri('/api/v0/folders', {"label" : "水戸黄門", "parent": project_uuid}, self.USER2)
        folder_uuid = result['data']['uuid']

        # フォルダの下にフローを作成する
        # プロジェクト管理者は、プロジェクト内にフローを作成する
        data = {
            'project_uuid': folder_uuid,
            'name': '遠山の金さん',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)
        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}?members=on', self.USER2)
        flow_uuid = result['data']['children'][0]['uuid']

        # フォルダの下にフレームを作成する
        f = (io.BytesIO(b'abcABC'), 'frame1')
        result = self.post_frames('大岡越前', folder_uuid, f, self.USER2)
        frame_uuid = result['data']['uuid']

        # フォルダの下にDatabaseを作成する
        data = {
            "parent"   : folder_uuid,
            "label"    : "桃太郎侍",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            "user_id"  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER2)
        database_uuid = result['data']['uuid']

        # # フォルダの下にリモートフォルダを作成する
        # data = {
        #     "parent"   : folder_uuid,
        #     "label"    : "中村主水",
        #     "protocol" : "smb",
        #     "hostname" : "kskds-HP-Workstation-z620.local",
        #     "domain"   : "WORKGROUP",
        #     "directory": "share",
        #     "user_id"  : "ksk-ds",
        #     "password" : "kskanalytics"
        # }
        # result = self.post_uri('/api/v0/remote-folders', data, self.USER2)
        # remote_folder_uuid = result['data']['uuid']

        # # フォルダの下にAWS S3を作成する
        # data = {
        #     'parent': folder_uuid,
        #     'label' : '銭形平次',
        #     'bucket': 'kskp-test'
        # }
        # result = self.post_uri('/api/v0/awss3s', data, self.USER2)
        # awss3_uuid = result['data']['uuid']


        # 編集者メンバは、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['create'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['upload'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # 編集者メンバは、フォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['create'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['upload'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # # 編集者メンバは、フローを取得する
        # result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertTrue(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertTrue(result['data']['allowlist']['lock'])

        # # 編集者メンバは、フレームを取得する
        # result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)
        # print(result)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # 編集者メンバは、Databaseを取得する
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertNotIn('create', result['data']['allowlist'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertNotIn('upload', result['data']['allowlist'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # # 編集者メンバは、リモートフォルダを取得する
        # result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # # 編集者メンバは、AWS S3を取得する
        # result = self.get_uri(f'/api/v0/awss3s/{awss3_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # 
        # USER2を、プロジェクトの閲覧者メンバに変更する
        # 
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Reader'}, self.USER1)
 
        # 閲覧者メンバは、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertFalse(result['data']['allowlist']['create'])
        self.assertFalse(result['data']['allowlist']['update'])
        self.assertFalse(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertFalse(result['data']['allowlist']['move'])
        self.assertFalse(result['data']['allowlist']['copy'])
        self.assertFalse(result['data']['allowlist']['upload'])
        self.assertFalse(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # 閲覧者メンバは、フォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertFalse(result['data']['allowlist']['create'])
        self.assertFalse(result['data']['allowlist']['update'])
        self.assertFalse(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertFalse(result['data']['allowlist']['move'])
        self.assertFalse(result['data']['allowlist']['copy'])
        self.assertFalse(result['data']['allowlist']['upload'])
        self.assertFalse(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # # 閲覧者メンバは、フローを取得する
        # result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['update'])
        # self.assertFalse(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertFalse(result['data']['allowlist']['move'])
        # self.assertFalse(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # # 閲覧者メンバは、フレームを取得する
        # result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['update'])
        # self.assertFalse(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertFalse(result['data']['allowlist']['move'])
        # self.assertFalse(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # 閲覧者メンバは、Databaseを取得する
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertNotIn('create', result['data']['allowlist'])
        self.assertFalse(result['data']['allowlist']['update'])
        self.assertFalse(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertFalse(result['data']['allowlist']['move'])
        self.assertFalse(result['data']['allowlist']['copy'])
        self.assertNotIn('upload', result['data']['allowlist'])
        self.assertFalse(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # # 閲覧者メンバは、リモートフォルダを取得する
        # result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['update'])
        # self.assertFalse(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertFalse(result['data']['allowlist']['move'])
        # self.assertFalse(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # # 閲覧者メンバは、AWS S3を取得する
        # result = self.get_uri(f'/api/v0/awss3s/{awss3_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['update'])
        # self.assertFalse(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertFalse(result['data']['allowlist']['move'])
        # self.assertFalse(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertFalse(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # 
        # USER2を、プロジェクトのプロジェクト管理者に変更する
        # 
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Owner'}, self.USER1)
 
        # プロジェクト管理者は、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['create'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['upload'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertTrue(result['data']['allowlist']['findMember'])
        self.assertTrue(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # プロジェクト管理者は、フォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['create'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['upload'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # # プロジェクト管理者は、フローを取得する
        # result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertTrue(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertTrue(result['data']['allowlist']['lock'])

        # # プロジェクト管理者は、フレームを取得する
        # result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # プロジェクト管理者は、Databaseを取得する
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER2)
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertNotIn('create', result['data']['allowlist'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertNotIn('upload', result['data']['allowlist'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])
        self.assertFalse(result['data']['allowlist']['lock'])

        # # プロジェクト管理者は、リモートフォルダを取得する
        # result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # # プロジェクト管理者は、AWS S3を取得する
        # result = self.get_uri(f'/api/v0/awss3s/{awss3_uuid}', self.USER2)
        # self.assertTrue(result['data']['allowlist']['read'])
        # self.assertNotIn('create', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['update'])
        # self.assertTrue(result['data']['allowlist']['delete'])
        # self.assertFalse(result['data']['allowlist']['execute'])
        # self.assertTrue(result['data']['allowlist']['move'])
        # self.assertTrue(result['data']['allowlist']['copy'])
        # self.assertNotIn('upload', result['data']['allowlist'])
        # self.assertTrue(result['data']['allowlist']['download'])
        # self.assertFalse(result['data']['allowlist']['findMember'])
        # self.assertFalse(result['data']['allowlist']['updateMember'])
        # self.assertFalse(result['data']['allowlist']['lock'])

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)
