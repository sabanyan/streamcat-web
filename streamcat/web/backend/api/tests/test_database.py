import pprint
from .api_test_case_base import ApiTestCaseBase

class DatabaseTestCase(ApiTestCaseBase):

    def test_connection_database(self):
        """
        指定するデータベースが接続可能か問い合わせる
        """
        # 
        # 接続可能な場合
        # 
        data = {
            'dbms'     : "postgresql",
            'hostname' : "db", 
            'port'     : 5432, 
            'database' : "streamcat", 
            'userId'  : "streamcat", 
            'password' : 'ZQZtVgL6G32Vy6p6WJtG3C3K84yuJ4zz'
        }
        # 接続情報をクエリパラメタ文字列に変換する
        arg_str = ''
        for key, value in data.items():
            arg_str += f'&{key}={value}'

        # 接続が可能であることを確認する
        result = self.get_uri(f'/api/v0/connections/databases?{arg_str}', self.USER2)

        # GET /connections/databasesの戻り値が正しいことを検証する
        self.assertTrue(result['conn'])

        # 
        # 接続不可能な場合
        # 
        data_err = data.copy()
        data_err['userId'] = 'anonymous'
        # 接続情報をクエリパラメタ文字列に変換する
        arg_str = ''
        for key, value in data_err.items():
            arg_str += f'&{key}={value}'

        # 接続が不可能であることを確認する
        result = self.get_uri(f'/api/v0/connections/databases?{arg_str}', self.USER2)

        # GET /connections/databasesの戻り値が正しいことを検証する
        self.assertFalse(result['conn'])

    def test_create_get_database(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root_uuid,
            "label"    : "データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)

        # POST /databasesの戻り値が正しいことを検証する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'database')
        self.assertEqual(result['label'], 'データベース')
        self.assertEqual(result['dbms'], 'postgresql')
        self.assertEqual(result['hostname'], 'db')
        self.assertEqual(result['port'], 5432)
        self.assertEqual(result['database'], 'streamcat')
        self.assertEqual(result['userId'], 'postgres')
        self.assertEqual(result['password'], '')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        database_uuid = result['uuid']

        # Databaseを取得する(GET /databases)
        result = self.get_uri('/api/v0/databases/' + database_uuid, self.USER1)

        # GET /databasesの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], database_uuid)
        self.assertEqual(result['type'], 'database')
        self.assertEqual(result['label'], 'データベース')
        self.assertEqual(result['dbms'], 'postgresql')
        self.assertEqual(result['hostname'], 'db')
        self.assertEqual(result['port'], 5432)
        self.assertEqual(result['database'], 'streamcat')
        self.assertEqual(result['userId'], 'postgres')
        self.assertEqual(result['password'], '')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

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
            "label"    : "データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)

        database_uuid = result['uuid']

        # Databaseのラベルを更新する(PUT /databases)
        update_data = {
            "label"    : "データベースストア?",
        }
        result = self.put_uri('/api/v0/databases/' + database_uuid, update_data, self.USER1)

        # PUT /databasesの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], database_uuid)
        self.assertEqual(result['type'], 'database')
        self.assertEqual(result['label'], 'データベースストア?')
        self.assertEqual(result['dbms'], 'postgresql')
        self.assertEqual(result['hostname'], 'db')
        self.assertEqual(result['port'], 5432)
        self.assertEqual(result['database'], 'streamcat')
        self.assertEqual(result['userId'], 'postgres')
        self.assertEqual(result['password'], '')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER1)

    def test_update_database(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        
        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root_uuid,
            "label"    : "データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)

        database_uuid = result['uuid']

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
        self.assertEqual(result['uuid'], database_uuid)
        self.assertEqual(result['type'], 'database')
        self.assertEqual(result['label'], 'データベースストア?')
        self.assertEqual(result['dbms'], 'oracle')
        self.assertEqual(result['hostname'], 'localhost')
        self.assertEqual(result['port'], 1192)
        self.assertEqual(result['database'], 'kskp!')
        self.assertEqual(result['userId'], 'tiger')
        self.assertEqual(result['password'], 'scott')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER1)

    def test_move_database(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1B", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['uuid']

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root.uuid,
            "label"    : "データベース?",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)
        database_uuid = result['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/databases/%s' % database_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
            "label"    : "データベース?",
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
        self.assertEqual(result['uuid'], database_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['dbms'], expected_result['dbms'])
        self.assertEqual(result['hostname'], expected_result['hostname'])
        self.assertEqual(result['port'], expected_result['port'])
        self.assertEqual(result['database'], expected_result['database'])
        self.assertEqual(result['userId'], expected_result['userId'])
        self.assertEqual(result['password'], expected_result['password'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

    def test_delete_database(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root.uuid,
            "label"    : "データベース?",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)
        database_uuid = result['uuid']

        # Databaseを削除する
        result = self.delete_uri(f'/api/v0/databases/{database_uuid}', self.USER1)

        # ゴミ箱のUUID
        trash_folder_uuid = self.factory.data.load_trash_folder().uuid

        # 期待するAPIの戻り値
        expected_result = {
            "label"    : "データベース?",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : "",
            'type'     : 'database',
            'creator'  : 'ユーザー管理者'
        }

        # PUT /databases apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['uuid'], database_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['dbms'], expected_result['dbms'])
        self.assertEqual(result['hostname'], expected_result['hostname'])
        self.assertEqual(result['port'], expected_result['port'])
        self.assertEqual(result['database'], expected_result['database'])
        self.assertEqual(result['userId'], expected_result['userId'])
        self.assertEqual(result['password'], expected_result['password'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], trash_folder_uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

    def test_duplicate_database(self):
        """
        データベースを複製できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root.uuid,
            "label"    : "データベース?",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)
        database_uuid = result['uuid']

        # Databaseを複製する(POST /databases)
        result = self.post_uri(f'/api/v0/databases', {'source':database_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
            "label"    : "データベース? のコピー",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : "",
            'type'     : 'database',
            'creator'  : 'ユーザー管理者'
        }

        # POST /databases apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertNotEqual(result['uuid'], database_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['dbms'], expected_result['dbms'])
        self.assertEqual(result['hostname'], expected_result['hostname'])
        self.assertEqual(result['port'], expected_result['port'])
        self.assertEqual(result['database'], expected_result['database'])
        self.assertEqual(result['userId'], expected_result['userId'])
        self.assertEqual(result['password'], expected_result['password'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['folderPath'], '/ライブラリ')
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # Databaseを削除する
        result = self.delete_uri(f'/api/v0/databases/{result["uuid"]}', self.USER1)
        result = self.delete_uri(f'/api/v0/databases/{database_uuid}', self.USER1)
