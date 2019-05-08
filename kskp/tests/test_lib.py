import unittest
import os
import json
import pprint
from pathlib import Path
from kskp import app
from kskp.library import db
from kskp.library import Store

class DataStoreTestCase(unittest.TestCase):

    def test_create_fetchall_delete_stores(self):
        """
        fetch_stores APIをテストする
        """
        # storesテーブルへのセット
        store1 = Store.create('Directory',
                              '1.0.0',
                              'ディレクトリ',
                              '',
                              '',
                              [{'name':'filePath', 'type':'string', 'label':'CSVファイル格納パス名'}],
                              1)
        store2 = Store.create('PostgreSQL',
                              '1.0.0',
                              'PostgreSQLへの接続設定(ODBC)',
                              '',
                              '',
                              [{'name':'connectionString', 'type':'string', 'label':'postgreSQLへの接続文字列'}],
                              1)
        db.session.add(store1)
        db.session.add(store2)
        db.session.commit()

        # GET /stores
        with app.test_client() as client:
            response = client.get('/api/v0/stores')
            result = json.loads(response.get_data())

        # 期待するAPIの戻り値
        expected_result = [
            {
                'id'     : 'Directory',
                'version': '1.0.0',
                'label'  : 'ディレクトリ',
                'description'  : '',
                'url'   : '',
                'params': [{
                        'name' : 'filePath',
                        'type' : 'string',
                        'label': 'CSVファイル格納パス名'
                        }]
            },
            {
                'id'     : 'PostgreSQL',
                'version': '1.0.0',
                'label'  : 'PostgreSQLへの接続設定(ODBC)',
                'description'  : '',
                'url'   : '',
                'params': [{
                        'name' : 'connectionString',
                        'type' : 'string',
                        'label': 'postgreSQLへの接続文字列'
                        }]
            }
        ]

        # storesテーブルに設定した値をGET /stores apiで取得できることを検証する
        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], expected_result)

        # DELETE /stores
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.delete('/api/v0/stores/%s' % expected_result[0]['id'])
            response = client.delete('/api/v0/stores/%s' % expected_result[1]['id'])
            result = json.loads(response.get_data())

    def test_create_fetch_delete_store(self):
        """
        create_store APIをテストする
        """
        # POSTするデータ
        data = {
                'id'       : 'Directory',
                'version'  : '1.0.1',
                'label'    : 'ディレクトリ',
                'description': 'ディレクトリ以下のファイルをデータソースとする',
                'url'      : 'http://',
                'params'   :
                    [
                        {'name' : 'directoryPath',
                         'type' : 'string',
                         'label': 'ディレクトリパス'},
                        {'name' : 'dummy',
                         'type' : 'int',
                         'label': 'テスト用ダミー'}                         
                    ]
               }

        # POST /stores
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.post('/api/v0/stores',
                                    content_type='application/json',
                                    data=json.dumps(data))
            result = json.loads(response.get_data())

        # POST /stores　apiが正常終了することを検証する
        expected_result = data
        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], expected_result)

        # GET /stores
        with app.test_client() as client:
            response = client.get('/api/v0/stores/%s' % expected_result['id'])
            result = json.loads(response.get_data())

        # POST /storesした値をGET /stores apiで取得できることを検証する
        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], data)

        # DELETE /stores
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.delete('/api/v0/stores/%s' % expected_result['id'])
            result = json.loads(response.get_data())
        
        # DELETE /stores apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # GET /stores
        with app.test_client() as client:
            response = client.get('/api/v0/stores/%s' % expected_result['id'])
            result = json.loads(response.get_data())

        # DELETE /storesした値をGET /stores apiで取得できないことを検証する
        self.assertEqual(result['success'], False)
        self.assertEqual(result['code'], -1)
        self.assertEqual(result['message'], 'No store is found by designated store id')


class LibraryTestCase(unittest.TestCase):
    def test_get_root(self):
        """
        ルートフォルダがある場合にGET /libraryを実行した場合
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            # ルートフォルダを作成する
            response = client.get('/api/v0/library')
            result = json.loads(response.get_data())

            # ルートフォルダを取得する(GET /library)
            response = client.get('/api/v0/library')
            result = json.loads(response.get_data())
            root_uuid = result['data']['uuid']

        # POST /library apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir('kskp/data/library'))

        # ルートフォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + root_uuid)
            result = json.loads(response.get_data())
             
        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

    def test_get_root2(self):
        """
        ルートフォルダが無い場合にGET /libraryを実行した場合
        (無い場合はルートフォルダを自動作成することを確認する)
        """
        # ルートフォルダを取得する(GET /library)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.get('/api/v0/library')
            result = json.loads(response.get_data())
            root_uuid = result['data']['uuid']

        # POST /library apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir('kskp/data/library'))

        # ルートフォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + root_uuid)
            result = json.loads(response.get_data())
             
        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        
    def test_get_folder(self):
        # ルートフォルダを取得する(GET /library)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.get('/api/v0/library')
            result = json.loads(response.get_data())
            root_uuid = result['data']['uuid']

            # POST /library apiが正常終了することを検証する
            self.assertEqual(result['success'], True)

            # ルートフォルダを取得する(GET /folders)
            response = client.get('/api/v0/folders/' + root_uuid)
            result = json.loads(response.get_data())

        # POST /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], root_uuid)
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')

        # ルートフォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + root_uuid)
            result = json.loads(response.get_data())
             
        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

    def test_get_no_folder(self):
        # 存在しないフォルダを取得しようとして失敗する(GET /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.get('/api/v0/folders/' + '00000000-0000-0000-0000-000000000000')
            result = json.loads(response.get_data())

        # POST /folders apiが異常終了することを検証する
        self.assertEqual(result['success'], False)
        self.assertEqual(result['code'], -1)
        self.assertEqual(result['message'], 'no folder is found by designated id.')

    def test_update_folder(self):
        # フォルダを作成する(POST /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/folders',
                                    content_type='application/json',
                                    data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
            result = json.loads(response.get_data())
            folder_uuid = result['data']['uuid']

            # POST /folders apiが正常終了することを検証する
            self.assertEqual(result['success'], True)

            # 親フォルダがない場合はデフォルトパスとする
            self.assertTrue(os.path.isdir('kskp/data/library'))

            # フレームのラベル名を変更する(PUT /frames)
            response = client.put('/api/v0/folders/' + folder_uuid,
                content_type='application/json',
                data=json.dumps({'label' : ' NEW FOLDER '})
            )
            result = json.loads(response.get_data())

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' NEW FOLDER '
            ,'type'     : 'folder'
            ,'creator'  : '開発用'
        }

        # PUT /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /folders apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['data']['uuid'], None)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir('kskp/data/ NEW FOLDER '))

        # フォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + folder_uuid)
            result = json.loads(response.get_data())

        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)


    def test_create_get_frame(self):
        # フォルダを作成する(POST /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/folders',
                                    content_type='application/json',
                                    data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
            result = json.loads(response.get_data())
            folder_uuid = result['data']['uuid']

        # POST /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"xyzxyzxyzxyz"), 'foo.csv')

        # フレームを作成する(POST /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/frames',
                content_type='multipart/form-data',
                data={
                    'label' : '新しいフレームファイル?',
                    'parent': folder_uuid,
                    'file'  : f
                }
            )
            result = json.loads(response.get_data())
            frame_uuid = result['data']['uuid']

        # POST /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # フレームに対応するファイルが存在することを検証する
        self.assertTrue(os.path.isfile('kskp/data/library/新しいフレームファイル?'))

        # フレームを取得する(GET /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.get('/api/v0/frames/' + frame_uuid)
            result = json.loads(response.get_data())
        
        # GET /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
            
        # 中のファイルを削除する(DELETE /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/frames/' + frame_uuid)
            result = json.loads(response.get_data())

        # Delete /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # フォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + folder_uuid)
            result = json.loads(response.get_data())

        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

    def test_create_delete_frame(self):
        # フォルダを作成する(POST /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/folders',
                                    content_type='application/json',
                                    data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
            result = json.loads(response.get_data())
            folder_uuid = result['data']['uuid']

        # POST /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')

        # フレームデータを作成する(POST /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/frames',
                content_type='multipart/form-data',
                data={
                    'label' : '新しいフレームファイル!',
                    'parent': folder_uuid,
                    'file'  : f
                }
            )
            result = json.loads(response.get_data())
            frame_uuid = result['data']['uuid']

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフレームファイル!'
            ,'type'     : 'frame'
            ,'creator'  : '開発用'
        }

        # Post /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # Post /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])

        # 中のファイルごとフォルダを削除しようとする(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + folder_uuid)
            result = json.loads(response.get_data())

        # 削除しようとすると異常終了することを検証する
        self.assertEqual(result['success'], False)

        # 中のファイルを削除する(DELETE /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/frames/' + frame_uuid)
            result = json.loads(response.get_data())

        # Delete /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # フォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + folder_uuid)
            result = json.loads(response.get_data())

        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

    def test_update_frame(self):
        # フォルダを作成する(POST /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/folders',
                                    content_type='application/json',
                                    data=json.dumps({"label" : "新しいフォルダ", "parent": None}))
            result = json.loads(response.get_data())
            folder_uuid = result['data']['uuid']

        # POST /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"thisisaframefile"), 'aaa.csv')

        # フレームデータを作成する(POST /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.post('/api/v0/frames',
                content_type='multipart/form-data',
                data={
                    'label' : 'フレームファイルAA',
                    'parent': folder_uuid,
                    'file'  : f
                }
            )
            result = json.loads(response.get_data())
            frame_uuid = result['data']['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.put('/api/v0/frames/' + frame_uuid,
                content_type='application/json',
                data=json.dumps({'label' : ' F L A M E-F I L E '})
            )
            result = json.loads(response.get_data())

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' F L A M E-F I L E '
            ,'type'     : 'frame'
            ,'creator'  : '開発用'
        }

        # PUT /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['data']['uuid'], None)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フレームに対応するファイルが存在することを検証する
        self.assertTrue(os.path.isfile('kskp/data/library/ F L A M E-F I L E '))

        # 中のファイルを削除する(DELETE /frames)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/frames/' + frame_uuid)
            result = json.loads(response.get_data())

        # Delete /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)

        # フォルダを削除する(DELETE /folders)
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'
            response = client.delete('/api/v0/folders/' + folder_uuid)
            result = json.loads(response.get_data())

        # Delete /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)


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

class ExecuteTestCase(unittest.TestCase):
    def test_execute_flow(self):
        """
        フローの実行結果がライブラリに登録されることを検証する
        """
        input_frame_uuid = '1ac6c925-391c-40cf-97fb-54ce59a1a151'
        flow_uuid = '168d23c2-f835-4392-ba0e-76e94a08b719'

        # 入力フレームをライブラリに登録する
        from ..library import Frame as FrameModel
        if not FrameModel.exists(input_frame_uuid):
            root = FrameModel.find_root()
            input_frame = FrameModel(root.uuid, 'test_frame.csv', None, 1)
            input_frame.uuid = input_frame_uuid
            input_frame.regist(os.path.join(app.root_path + '/data/library'))

        # 実行
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 1
            response = client.get('/api/v0/frames?from=%s' % flow_uuid)
            result = json.loads(response.get_data())

        # フローの実行が正常終了することを検証する
        self.assertEqual(result['success'], True)

        # 出力結果がライブラリに登録されることを検証する
        frame_uuid_d1 = result['name'][0]['uuid']
        frame_uuid_d3 = result['name'][1]['uuid']
        self.assertTrue(FrameModel.exists(frame_uuid_d1))
        self.assertTrue(FrameModel.exists(frame_uuid_d3))
        
        # 削除
        # このテストで作成したjobsだけ削除する
        from .test_api import ApiTestCase
        apiTestCase = ApiTestCase("test_new_project")
        apiTestCase.remove_job_file_and_frame(flow_uuid)

if __name__ == '__main__':
    unittest.main()
