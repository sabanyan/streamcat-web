import pprint
from .api_test_case_base import ApiTestCaseBase

class DatabaseTestCase(ApiTestCaseBase):
    def test_create_get_database(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)

        # POST /databasesの戻り値が正しいことを検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'database')
        self.assertEqual(result['data']['label'], 'リモートフォルダ')
        self.assertEqual(result['data']['dbms'], 'postgresql')
        self.assertEqual(result['data']['hostname'], 'db')
        self.assertEqual(result['data']['port'], 5432)
        self.assertEqual(result['data']['database'], 'kskp')
        self.assertEqual(result['data']['userId'], 'postgres')
        self.assertEqual(result['data']['password'], '')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        database_uuid = result['data']['uuid']

        # Databaseを取得する(GET /databases)
        result = self.get_uri('/api/v0/databases/' + database_uuid, self.USER1)

        # GET /databasesの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], database_uuid)
        self.assertEqual(result['data']['type'], 'database')
        self.assertEqual(result['data']['label'], 'リモートフォルダ')
        self.assertEqual(result['data']['dbms'], 'postgresql')
        self.assertEqual(result['data']['hostname'], 'db')
        self.assertEqual(result['data']['port'], 5432)
        self.assertEqual(result['data']['database'], 'kskp')
        self.assertEqual(result['data']['userId'], 'postgres')
        self.assertEqual(result['data']['password'], '')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER1)

        # Databaseはゴミ箱に移動していること
        db = self.factory.data.find_by_uuid(database_uuid)
        self.assertEqual(db.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

    def test_update_label(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        
        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)

        database_uuid = result['data']['uuid']

        # Databaseのラベルを更新する(PUT /databases)
        update_data = {
            "label"    : "データベースストア?",
        }
        result = self.put_uri('/api/v0/databases/' + database_uuid, update_data, self.USER1)

        # PUT /databasesの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], database_uuid)
        self.assertEqual(result['data']['type'], 'database')
        self.assertEqual(result['data']['label'], 'データベースストア?')
        self.assertEqual(result['data']['dbms'], 'postgresql')
        self.assertEqual(result['data']['hostname'], 'db')
        self.assertEqual(result['data']['port'], 5432)
        self.assertEqual(result['data']['database'], 'kskp')
        self.assertEqual(result['data']['userId'], 'postgres')
        self.assertEqual(result['data']['password'], '')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER1)

    def test_update_database(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        
        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)

        database_uuid = result['data']['uuid']

        # Databaseのラベルを更新する(PUT /databases)
        update_data = {
            "label"    : "データベースストア?",
            "dbms"     : "oracle",
            "hostname" : "localhost",
            "port"     : 1192,
            "database" : "kskp!",
            'userId'  : "tiger",
            "password" : "scott"
        }
        result = self.put_uri('/api/v0/databases/' + database_uuid, update_data, self.USER1)

        # PUT /databasesの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], database_uuid)
        self.assertEqual(result['data']['type'], 'database')
        self.assertEqual(result['data']['label'], 'データベースストア?')
        self.assertEqual(result['data']['dbms'], 'oracle')
        self.assertEqual(result['data']['hostname'], 'localhost')
        self.assertEqual(result['data']['port'], 1192)
        self.assertEqual(result['data']['database'], 'kskp!')
        self.assertEqual(result['data']['userId'], 'tiger')
        self.assertEqual(result['data']['password'], 'scott')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER1)

    def test_move_database(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1B", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root.uuid,
            "label"    : "リモートフォルダ?",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)
        database_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/databases/%s' % database_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
            "label"    : "リモートフォルダ?",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : "",
            'type'     : 'database',
            'creator'  : 'ユーザー管理者'
        }

        # PUT /databases apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], database_uuid)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['dbms'], expected_result['dbms'])
        self.assertEqual(result['data']['hostname'], expected_result['hostname'])
        self.assertEqual(result['data']['port'], expected_result['port'])
        self.assertEqual(result['data']['database'], expected_result['database'])
        self.assertEqual(result['data']['userId'], expected_result['userId'])
        self.assertEqual(result['data']['password'], expected_result['password'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)
