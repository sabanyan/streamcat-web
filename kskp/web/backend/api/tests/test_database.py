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
            "user_id"  : "postgres",
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
        self.assertEqual(result['data']['user_id'], 'postgres')
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
        self.assertEqual(result['data']['user_id'], 'postgres')
        self.assertEqual(result['data']['password'], '')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER1)

        # Databaseはゴミ箱に移動していること
        db = self.factory.data.find_by_uuid(database_uuid)
        self.assertEqual(db.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

    def test_update_database(self):
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
            "user_id"  : "postgres",
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
            "user_id"  : "tiger",
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
        self.assertEqual(result['data']['user_id'], 'tiger')
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
            "user_id"  : "postgres",
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
            "user_id"  : "postgres",
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
        self.assertEqual(result['data']['user_id'], expected_result['user_id'])
        self.assertEqual(result['data']['password'], expected_result['password'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

    # def test_delete_using_frame(self):
    #     from ..library import Frame
    #     input_frame_uuid = '1ac6c925-391c-40cf-97fb-54ce59a1a151'

    #     if not Frame.exists(input_frame_uuid):
    #         # ルートフォルダを取得する(GET /library)
    #         result = self.get_uri('/api/v0/library', 1)
    #         root_uuid = result['data']['uuid']

    #         # test_frame.csvをライブラリに登録する
    #         input_frame = Frame(root_uuid, 'test_frame.csv', None)
    #         input_frame.uuid = input_frame_uuid
    #         input_frame.add_entry_from_path('kskp/data/library/test_frame.csv')

    #     # フレームを削除する(DELETE /frames)
    #     self.delete_uri('/api/v0/frames/' + input_frame_uuid, 1)

    #     # ルートフォルダを削除する(DELETE /folders)
    #     self.delete_uri('/api/v0/folders/' + root_uuid, 1)






    # def test_create_get_document(self):
    #     # フォルダを作成する(POST /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.post('/api/v0/folders',
    #                                 content_type='application/json',
    #                                 data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
    #         result = json.loads(response.get_data())
    #         folder_uuid = result['data']['uuid']

    #     # POST /folders apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # アップロード用に一時ファイルを作成する
    #     import io
    #     f = (io.BytesIO(b"thisIsDocumentFile"), 'foo.csv')

    #     # ドキュメントを作成する(POST /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.post('/api/v0/documents',
    #             content_type='multipart/form-data',
    #             data={
    #                 'label' : '新しい文書ファイル',
    #                 'parent': folder_uuid,
    #                 'file'  : f
    #             }
    #         )
    #         result = json.loads(response.get_data())
    #         doc_uuid = result['data']['uuid']

    #     # POST /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # ドキュメントを取得する(GET /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.get('/api/v0/documents/' + doc_uuid)
    #         result = json.loads(response.get_data())
        
    #     # GET /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # 中のファイルを削除する(DELETE /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/documents/' + doc_uuid)
    #         result = json.loads(response.get_data())

    #     # Delete /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # フォルダを削除する(DELETE /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/folders/' + folder_uuid)
    #         result = json.loads(response.get_data())

    #     # Delete /folders apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    # def test_create_delete_document(self):
    #     # フォルダを作成する(POST /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.post('/api/v0/folders',
    #                                 content_type='application/json',
    #                                 data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
    #         result = json.loads(response.get_data())
    #         folder_uuid = result['data']['uuid']

    #     # POST /folders apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # アップロード用に一時ファイルを作成する
    #     import io
    #     f = (io.BytesIO(b"abcdef"), 'dummy.csv')

    #     # フレームデータを作成する(POST /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.post('/api/v0/documents',
    #             content_type='multipart/form-data',
    #             data={
    #                 'label' : '新しいフレームファイル!',
    #                 'parent': folder_uuid,
    #                 'file'  : f
    #             }
    #         )
    #         result = json.loads(response.get_data())
    #         doc_uuid = result['data']['uuid']

    #     # 期待するAPIの戻り値
    #     expected_result = {
    #          'label'    : '新しいフレームファイル!'
    #         ,'type'     : 'document'
    #         ,'creator'  : '開発用'
    #     }

    #     # Post /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)
    #     # Post /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
    #     self.assertEqual(result['data']['label'], expected_result['label'])
    #     self.assertEqual(result['data']['type'], expected_result['type'])
    #     self.assertEqual(result['data']['creator'], expected_result['creator'])

    #     # 中のファイルごとフォルダを削除しようとする(DELETE /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/folders/' + folder_uuid)
    #         result = json.loads(response.get_data())

    #     # 削除しようとすると異常終了することを検証する
    #     self.assertEqual(result['success'], False)

    #     # 中のファイルを削除する(DELETE /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/documents/' + doc_uuid)
    #         result = json.loads(response.get_data())

    #     # Delete /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # フォルダを削除する(DELETE /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/folders/' + folder_uuid)
    #         result = json.loads(response.get_data())

    #     # Delete /folders apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    # def test_update_document(self):
    #     # フォルダを作成する(POST /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.post('/api/v0/folders',
    #                                 content_type='application/json',
    #                                 data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
    #         result = json.loads(response.get_data())
    #         folder_uuid = result['data']['uuid']

    #     # POST /folders apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # アップロード用に一時ファイルを作成する
    #     import io
    #     f = (io.BytesIO(b"thisisadocfile"), 'aaa.csv')

    #     # フレームデータを作成する(POST /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.post('/api/v0/documents',
    #             content_type='multipart/form-data',
    #             data={
    #                 'label' : 'フレームファイルAA',
    #                 'parent': folder_uuid,
    #                 'file'  : f
    #             }
    #         )
    #         result = json.loads(response.get_data())
    #         doc_uuid = result['data']['uuid']

    #     # フレームのラベル名を変更する(PUT /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.put('/api/v0/documents/' + doc_uuid,
    #             content_type='application/json',
    #             data=json.dumps({'label' : ' DOCUMENT-F I L E '})
    #         )
    #         result = json.loads(response.get_data())

    #     # 期待するAPIの戻り値
    #     expected_result = {
    #          'label'    : ' DOCUMENT-F I L E '
    #         ,'type'     : 'document'
    #         ,'creator'  : '開発用'
    #     }

    #     # PUT /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)
    #     # PUT /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
    #     self.assertNotEqual(result['data']['uuid'], None)
    #     self.assertEqual(result['data']['label'], expected_result['label'])
    #     self.assertEqual(result['data']['type'], expected_result['type'])
    #     self.assertEqual(result['data']['creator'], expected_result['creator'])
    #     self.assertNotEqual(result['data']['createdAt'], None)

    #     # 中のファイルを削除する(DELETE /documents)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/documents/' + doc_uuid)
    #         result = json.loads(response.get_data())

    #     # Delete /documents apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)

    #     # フォルダを削除する(DELETE /folders)
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.delete('/api/v0/folders/' + folder_uuid)
    #         result = json.loads(response.get_data())

    #     # Delete /folders apiが正常終了することを検証する
    #     self.assertEqual(result['success'], True)
