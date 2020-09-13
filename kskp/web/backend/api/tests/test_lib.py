import unittest
import os
import json
import pprint
from pathlib import Path

from kskp.web.backend import app
from kskp.store import Mountable
from .api_test_case_base import ApiTestCaseBase

class DataStoreTestCase(ApiTestCaseBase):

    def test_create_fetchall_delete_stores(self):
        """
        fetch_stores APIをテストする
        """
        # storesテーブルへのセット
        store1 = self.factory0.store.create(
                            'Directory',
                            '1.0.0',
                            'ディレクトリ',
                            '',
                            '',
                            [{'name':'filePath', 'type':'string', 'label':'CSVファイル格納パス名'}])
        store2 = self.factory0.store.create(
                            'PostgreSQL',
                            '1.0.0',
                            'PostgreSQLへの接続設定(ODBC)',
                            '',
                            '',
                            [{'name':'connectionString', 'type':'string', 'label':'postgreSQLへの接続文字列'}])
        self.factory0._session.add(store1)
        self.factory0._session.add(store2)
        self.factory0._session.commit()

        # GET /stores
        result = self.get_uri('/api/v0/stores', self.USER0)

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
        self.assertEqual(result['data'], expected_result)

        # DELETE /stores
        self.delete_uri('/api/v0/stores/%s' % expected_result[0]['id'], self.USER0)
        self.delete_uri('/api/v0/stores/%s' % expected_result[1]['id'], self.USER0)

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
        result = self.post_uri('/api/v0/stores', data, self.USER0)

        # POST /stores　apiが正常終了することを検証する
        expected_result = data
        self.assertEqual(result['data'], expected_result)

        # GET /stores
        result = self.get_uri('/api/v0/stores/%s' % expected_result['id'], self.USER0)

        # POST /storesした値をGET /stores apiで取得できることを検証する
        self.assertEqual(result['data'], data)

        # DELETE /stores
        result = self.delete_uri('/api/v0/stores/%s' % expected_result['id'], self.USER0)

        # GET /stores
        with self.assertRaises(AssertionError) as e:
            result = self.get_uri('/api/v0/stores/%s' % expected_result['id'], self.USER0)

class LibraryTestCase(ApiTestCaseBase):
    def test_get_root(self):
        """
        ルートフォルダがある場合にGET /libraryを実行した場合
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER1)

        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        from kskp.store import Datum
        self.assertTrue(os.path.isdir(Datum.STORE_DIR))

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER1)

    def test_get_root2(self):
        """
        ルートフォルダが無い場合にGET /libraryを実行した場合
        (無い場合はルートフォルダを自動作成することを確認する)
        """
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        from kskp.store import Datum
        self.assertTrue(os.path.isdir(Datum.STORE_DIR))

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER1)

    def test_get_folder(self):
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']
        
        # ルートフォルダを取得する(GET /folders)
        result = self.get_uri('/api/v0/folders/' + root_uuid, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], root_uuid)
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER1)

    def test_get_no_folder(self):
        # 存在しないフォルダを取得しようとして失敗する(GET /folders)
        with self.assertRaises(Exception) as e:
            self.get_uri('/api/v0/folders/' + '00000000-0000-0000-0000-000000000000', self.USER1)

    def test_update_folder(self):
        # フォルダを作成する(POST /folders)
        root = self.factory.data.load_root()

        # フォルダを作成する(POST /folders)
        result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": root.uuid}, self.USER1)
        folder_uuid = result['data']['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        result = self.put_uri('/api/v0/folders/' + folder_uuid, {'label' : ' NEW FOLDER '}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' NEW FOLDER '
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザ管理者'
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
        self.assertTrue(os.path.isdir((root.path / ' NEW FOLDER ').as_posix()))

        # フォルダを削除する(DELETE /folders)
        self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER1)

        # フォルダはゴミ箱に移動していること
        trash_folder = self.factory.data.load_trash_folder()
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 1)
        self.assertEqual(trashed[0].label, ' NEW FOLDER ')

    def test_move_folder(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動元フォルダを作成する(POST /folders)
        folder_src = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1", "parent": root.uuid}, self.USER1)
        folder_src_uuid = folder_src['data']['uuid']

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ2", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/folders/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザ管理者'
        }

        # PUT /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], folder_src_uuid)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir((root.path / '新しいフォルダ2' / '新しいフォルダ1').as_posix()))


    def test_move_folder2(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動元フォルダを作成する(POST /folders)
        folder_src = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1", "parent": root.uuid}, self.USER1)
        folder_src_uuid = folder_src['data']['uuid']

        # 移動元フォルダ内にフォルダを作成する
        folder_src_1 = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1_1", "parent": folder_src_uuid}, self.USER1)
        folder_src_uuid_1 = folder_src_1['data']['uuid']

        # 上記フォルダ内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder_src_uuid_1, f, self.USER1)
        frame_uuid_1= result['data']['uuid']

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ2a", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/folders/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザ管理者'
        }

        # PUT /folders apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], folder_src_uuid)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        dst_folder_path = root.path / '新しいフォルダ2a'
        self.assertTrue(os.path.isdir(dst_folder_path / '新しいフォルダ1'))
        self.assertTrue(os.path.isdir(dst_folder_path / '新しいフォルダ1' / '新しいフォルダ1_1'))
        self.assertTrue(os.path.isfile(dst_folder_path/ '新しいフォルダ1' / '新しいフォルダ1_1' / 'フレームファイル_1'))

    def test_create_get_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER1)
        # folder_uuid = result['data']['uuid']
        root = self.factory.data.load_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"xyzxyzxyzxyz"), 'foo.csv')

        # フレームを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル?', root.uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # フレームに対応するファイルが存在することを検証する
        self.assertTrue(os.path.isfile((root.path / '新しいフレームファイル?').as_posix()))

        # フレームを取得する(GET /frames)
        self.get_uri('/api/v0/frames/' + frame_uuid, self.USER1)
            
        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER1)

        # ゴミ箱を空にする
        trash_folder = self.factory.data.load_trash_folder()
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 0)

        # フォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER1)

    def test_create_delete_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER1)
        # folder_uuid = result['data']['uuid']
        folder_uuid = self.factory.data.load_root().uuid

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル!', folder_uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # Post /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        
        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフレームファイル!'
            ,'type'     : 'frame'
            ,'creator'  : 'ユーザ管理者'
        }

        # Post /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])

        # ルートフォルダは削除できない(DELETE /folders)
        with self.assertRaises(AssertionError) as e:
            self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER1)

        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER1)

        # ゴミ箱を空にする
        trash_folder = self.factory.data.load_trash_folder()
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 0)

        # フォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER1)

    def test_update_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER1)
        # folder_uuid = result['data']['uuid']
        root = self.factory.data.load_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"thisisaframefile"), 'aaa.csv')

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイルAA', root.uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        result = self.put_uri('/api/v0/frames/' + frame_uuid, {'label' : ' F L A M E-F I L E '}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' F L A M E-F I L E '
            ,'type'     : 'frame'
            ,'creator'  : 'ユーザ管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['data']['uuid'], None)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フレームに対応するファイルが存在することを検証する
        self.assertTrue(os.path.isfile((root.path / ' F L A M E-F I L E ').as_posix()))

        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER1)

        # ゴミ箱を空にする
        trash_folder = self.factory.data.load_trash_folder()
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 0)

    def test_update_frame_encoding(self):
        root = self.factory.data.load_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"thisisaframefile"), 'aaa2.csv')

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイルAA2', root.uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # フレームの文字コードを変更する(PUT /frames)
        result = self.put_uri('/api/v0/frames/' + frame_uuid, {'encoding':'UTF-8', 'newline':'LF'}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フレームファイルAA2'
            ,'type'     : 'frame'
            ,'encoding' : 'UTF-8'
            ,'newline'  : 'LF'
            ,'creator'  : 'ユーザ管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['data']['uuid'], None)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['encoding'], expected_result['encoding'])
        self.assertEqual(result['data']['newline'], expected_result['newline'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER1)

    def test_move_frame(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1B", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyB.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1B', root.uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/frames/%s' % frame_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フレームファイル_1B'
            ,'type'     : 'frame'
            ,'creator'  : 'ユーザ管理者'
        }

        # PUT /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /frames apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], frame_uuid)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isfile((root.path / '新しいフォルダ1B' / 'フレームファイル_1B').as_posix()))

@unittest.skip('ASW S3のIDとアカウントが必要')
class AwsS3TestCase(ApiTestCaseBase):
    def test_create_get_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Amazonに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        # POST /awss3sの戻り値が正しいことを検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], 'Amazonに感謝')
        self.assertEqual(result['data']['bucket'], 'kskp-test')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # S3マウント用フォルダが作成されていることを検証する
        self.assertTrue(os.path.isdir((awss3.path).as_posix()))

        # S3フォルダを取得する(GET /awss3s)
        result = self.get_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # GET /awss3sの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], awss3_uuid)
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], 'Amazonに感謝')
        self.assertEqual(result['data']['bucket'], 'kskp-test')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertIsNotNone(result['data']['children'])
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][1]['uuid'], awss3_uuid)
        self.assertEqual(result['data']['folderPath'][1]['label'], 'Amazonに感謝')

        # S3フォルダがマウントされていることを検証する
        self.assertTrue(Mountable.is_mount(awss3.path))

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_update_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path
        
        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Appleに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # S3フォルダのラベルを更新する(PUT /awss3s)
        update_data = {
            'label' : '大根の卸金が欲しい',
            'bucket': 'abc'
        }
        result = self.put_uri('/api/v0/awss3s/' + awss3_uuid, update_data, self.USER1)

        # PUT /awss3sの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], awss3_uuid)
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], '大根の卸金が欲しい')
        self.assertEqual(result['data']['bucket'], 'abc')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_remount_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Googleに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # KSKPの外部からUnmountをする
        import shlex
        import subprocess
        import time
        time.sleep(1)
        awss3_abs_path = (root_path / 'Googleに感謝').as_posix()
        ret = subprocess.run(shlex.split(f'/sbin/umount {awss3_abs_path}'), 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE)
        # umountコマンドの正常終了を確認する
        self.assertEqual(ret.returncode, 0)

        # AwsS3.pathプロパティへのアクセスでremount処理が走る
        tmp_var = awss3.path

        # S3フォルダがマウントされていることを検証する
        self.assertTrue(Mountable.is_mount(awss3.path))

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_mount_under_mount_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Facebookに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)
        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # AWS S3フォルダの下にAWS S3フォルダを作成しようとする(POST /awss3s)
        data = {
            'parent': awss3_uuid,
            'label' : 'Microsoftにさようなら',
            'bucket': 'kskp-test'
        }
        # S3フォルダの下にS3フォルダを作成することはできない
        with self.assertRaises(AssertionError) as e:
            result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

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
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
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
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
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
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
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
            'creator'  : 'ユーザ管理者'
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

# 
# テスト実行時にmountコマンドの実行に必要なPasswordが聞かれます
# 
class RemoteFolderTestCase(ApiTestCaseBase):

    def test_create_get_folders(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "kskds-HP-Workstation-z620.local",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "ksk-ds",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)

        # POST /remote-foldersの戻り値が正しいことを検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'rfolder')
        self.assertEqual(result['data']['label'], 'リモートフォルダ')
        self.assertEqual(result['data']['protocol'], 'smb')
        self.assertEqual(result['data']['hostname'], 'kskds-HP-Workstation-z620.local')
        self.assertEqual(result['data']['domain'], 'WORKGROUP')
        self.assertEqual(result['data']['directory'], 'share')
        self.assertEqual(result['data']['user_id'], 'ksk-ds')
        self.assertEqual(result['data']['password'], 'kskanalytics')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        folder_uuid = result['data']['uuid']

        # RemoteFolderを取得する(GET /remote-folders)
        result = self.get_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # GET /remote-foldersの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], folder_uuid)
        self.assertEqual(result['data']['type'], 'rfolder')
        self.assertEqual(result['data']['label'], 'リモートフォルダ')
        self.assertEqual(result['data']['protocol'], 'smb')
        self.assertEqual(result['data']['hostname'], 'kskds-HP-Workstation-z620.local')
        self.assertEqual(result['data']['domain'], 'WORKGROUP')
        self.assertEqual(result['data']['directory'], 'share')
        self.assertEqual(result['data']['user_id'], 'ksk-ds')
        self.assertEqual(result['data']['password'], 'kskanalytics')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # RemoteFolderをほかす(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # フォルダはゴミ箱に移動していること
        folder = self.factory.data.find_by_uuid(folder_uuid)
        self.assertEqual(folder.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

        # RemoteFolderを削除(unmount)する
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_folders(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path
        
        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ!",
            "protocol" : "smb",
            "hostname" : "kskds-HP-Workstation-z620.local",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "ksk-ds",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)

        folder_uuid = result['data']['uuid']

        # RemoteFolderのラベルを更新する(PUT /remote-folders)
        update_data = {
            "label"    : "リモートフォルダ!?",
            "protocol" : "smb",
            "hostname" : "192.168.0.5",
            "domain"   : "MyDomain2",
            "directory": "share2",
            "user_id"  : "user2",
            "password" : ""
        }
        result = self.put_uri('/api/v0/remote-folders/' + folder_uuid, update_data, self.USER1)

        # PUT /remote-foldersの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], folder_uuid)
        self.assertEqual(result['data']['type'], 'rfolder')
        self.assertEqual(result['data']['label'], 'リモートフォルダ!?')
        self.assertEqual(result['data']['protocol'], 'smb')
        self.assertEqual(result['data']['hostname'], '192.168.0.5')
        self.assertEqual(result['data']['domain'], 'MyDomain2')
        self.assertEqual(result['data']['directory'], 'share2')
        self.assertEqual(result['data']['user_id'], 'user2')
        self.assertEqual(result['data']['password'], '')
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # RemoteFolderをほかす(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # フォルダはゴミ箱に移動していること
        folder = self.factory.data.find_by_uuid(folder_uuid)
        self.assertEqual(folder.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

        # RemoteFolderを削除(unmount)する
        self.delete_uri('/api/v0/trashes', self.USER1)

    @unittest.skip('moveするにはpoth列とlabel列の名称を一致させるという縛りを破るしかない。縛りを破る予定だが今はテストをスキップ')
    def test_move_folders(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1C", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root.uuid,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "kskds-HP-Workstation-z620.local",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "ksk-ds",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)
        folder_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/remote-folders/%s' % folder_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "192.168.0.3",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "user1",
            "password" : "pass",
            "type"     : "rfolder"
        }

        # PUT /remote-folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], folder_uuid)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['protocol'], expected_result['protocol'])
        self.assertEqual(result['data']['hostname'], expected_result['hostname'])
        self.assertEqual(result['data']['domain'], expected_result['domain'])
        self.assertEqual(result['data']['directory'], expected_result['directory'])
        self.assertEqual(result['data']['user_id'], expected_result['user_id'])
        self.assertEqual(result['data']['password'], expected_result['password'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)


class TrashTestCase(ApiTestCaseBase):
  
    def get_flow_with_source(self, source_frame_uuid):
        return {
            "label": "q", 
            "nodes": [
            {
                "id": "d", 
                "type": "frame", 
                "uuid": source_frame_uuid,
                "label": "testData", 
                "makeCache": False, 
                "dataSource": "csv", 
                "cacheCreatedAt": None
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
                "a": "add,add1", 
                "c": "1,2", 
                "precision": 10
                }, 
                "dsts": {
                "o": "d1"
                }, 
                "size": {
                "width": 38, 
                "height": 38
                }, 
                "srcs": {
                "i": "d"
                }, 
                "type": "command", 
                "label": "計算", 
                "commandId": "mcal", 
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
                "label": "testData", 
                "nodeId": "d"
                }
            ]
            ], 
            "params": [], 
            "creator": "開発用", 
            "createdAt": "2019-12-04 13:54:46", 
            "projectId": None, 
            "description": ""
        }

    def get_flow_with_subflow(self, subflow_uuid):
        return {
            "label": "zzz", 
            "nodes": [
            {
                "id": "d", 
                "type": "frame", 
                "uuid": None, 
                "label": "d", 
                "makeCache": False, 
                "dataSource": "csv", 
                "cacheCreatedAt": None
            }, 
            {
                "id": "f", 
                "args": {}, 
                "dsts": {
                "d": "d"
                }, 
                "srcs": {}, 
                "type": "flow", 
                "uuid": subflow_uuid, 
                "label": "f", 
                "srcsOrder": []
            }
            ], 
            "ports": [
            [], 
            []
            ], 
            "params": [], 
            "creator": "開発用", 
            "createdAt": "2020-02-17 18:49:49", 
            "projectId": None, 
            "description": ""
        }

    def test_get_trashes(self):
        """
        GET /trashes
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": root.uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', root.uuid, f, self.USER1)
        frame_uuid_1= result['data']['uuid'] 

        # フォルダ1、フォルダ2、フレームをほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        self.delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1)
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # GET /trashesでゴミ箱の中を確認する
        result = self.get_uri('/api/v0/trashes', self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
            "type"     : "trash",
            "label"    : "ゴミ箱",
            "creator"  : 'ユーザ管理者'
        }
        expected_child1 = {
            "type"     : "folder",
            "label"    : "フォルダですよ1",
            "creator"  : 'ユーザ管理者'
        }
        expected_child2 = {
            "type"     : "folder",
            "label"    : "フォルダですよ2",
            "creator"  : 'ユーザ管理者'
        }
        expected_child3 = {
            "type"     : "frame",
            "label"    : "フレームファイル_1",
            "creator"  : 'ユーザ管理者'
        }
        folder_path1 = {
            "type"     : "folder",
            "label"    : "ライブラリ"
        }
        folder_path2 = {
            "type"     : "trash",
            "label"    : "ゴミ箱"
        }

        # PUT /trashes apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['label'], expected_result['label'])
        # テストではLibrary._init_library_folders()でゴミ箱を作成しているのでcreator=None
        self.assertEqual(result['data']['creator'], 'ユーザ管理者')
        self.assertNotEqual(result['data']['createdAt'], None)
        # フォルダ2
        # (ゴミ箱内のフォルダは新規作成するのでUUIDは新規取得される)
        self.assertIsNotNone(result['data']['children'][0]['uuid'])
        self.assertEqual(result['data']['children'][0]['type'], expected_child2['type'])
        self.assertEqual(result['data']['children'][0]['label'], expected_child2['label'])
        self.assertEqual(result['data']['children'][0]['creator'], expected_child2['creator'])
        self.assertNotEqual(result['data']['children'][0]['createdAt'], None)
        # フォルダ1
        # (ゴミ箱内のフォルダは新規作成するのでUUIDは新規取得される)
        self.assertIsNotNone(result['data']['children'][1]['uuid'])
        self.assertEqual(result['data']['children'][1]['type'], expected_child1['type'])
        self.assertEqual(result['data']['children'][1]['label'], expected_child1['label'])
        self.assertEqual(result['data']['children'][1]['creator'], expected_child1['creator'])
        self.assertNotEqual(result['data']['children'][1]['createdAt'], None)
        # フレーム1
        self.assertEqual(result['data']['children'][2]['uuid'], frame_uuid_1)
        self.assertEqual(result['data']['children'][2]['type'], expected_child3['type'])
        self.assertEqual(result['data']['children'][2]['label'], expected_child3['label'])
        self.assertEqual(result['data']['children'][2]['creator'], expected_child3['creator'])
        self.assertNotEqual(result['data']['children'][2]['createdAt'], None)
        # ROOT (folderPath)
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['data']['folderPath'][0]['type'], folder_path1['type'])
        self.assertEqual(result['data']['folderPath'][0]['label'], folder_path1['label'])
        # ゴミ箱 (folderPath)
        self.assertIsNotNone(result['data']['folderPath'][1]['uuid'])
        self.assertEqual(result['data']['folderPath'][1]['type'], folder_path2['type'])
        self.assertEqual(result['data']['folderPath'][1]['label'], folder_path2['label'])

    def test_maintain_folder_hierarchy(self):
        """
        ゴミ箱に捨ててもフォルダ階層は維持される
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1= result['data']['uuid']

        # フォルダ1をほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        
        # フォルダ1はゴミ箱に移動していること
        trash_folder = self.factory.data.load_trash_folder()
        trashed1 = trash_folder.find_children()
        self.assertEqual(trashed1[0].uuid, folder1_uuid)
        self.assertEqual(trashed1[0].label, 'フォルダですよ1!')

        # フォルダ2はゴミ箱に移動していること
        trashed2 = trashed1[0].find_children()
        self.assertEqual(trashed2[0].uuid, folder2_uuid)
        self.assertEqual(trashed2[0].label, 'フォルダですよ2')

        # フレームはゴミ箱に移動していること
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.uuid, frame_uuid_1)
        self.assertEqual(frame.find_parent().uuid, trashed2[0].uuid)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 0)

    def test_delete_limitation(self):
        """
        フローから参照されているフレームはゴミ箱に捨てられないこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ!1", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ!2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1= result['data']['uuid']

        # フローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # フォルダ1をほかすが、中のフレームはフローで使用中なのでエラーになる
        with self.assertRaises(AssertionError) as e:
            self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # フォルダ2内にフレーム2を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy2.csv')
        # フレーム2データを作成する(POST /frames)
        result = self.post_frames('フレームファイル_2', folder2_uuid, f, self.USER1)
        frame_uuid_2= result['data']['uuid']

        # フォルダ1をほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # フォルダ1は放されずに残っている
        folder1 = self.factory.data.find_by_uuid(folder1_uuid)
        self.assertEqual(folder1.find_parent().uuid, root.uuid)

        # フォルダ2は放されずに残っている
        folder2 = self.factory.data.find_by_uuid(folder2_uuid)
        self.assertEqual(folder2.find_parent().uuid, folder1_uuid)

        # ゴミ箱へはフォルダの階層構造を維持しつつ、フレーム2が捨てられている
        trash_folder = self.factory.data.load_trash_folder()
        trashed1 = trash_folder.find_children()
        self.assertEqual(trashed1[0].label, 'フォルダですよ!1')

        trashed2 = trashed1[0].find_children()
        self.assertEqual(trashed2[0].label, 'フォルダですよ!2')

        frame = self.factory.data.find_by_uuid(frame_uuid_2)
        self.assertEqual(frame.find_parent().uuid, trashed2[0].uuid)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 0)


    def test_delete_root_folder(self):
        """
        ルートフォルダは削除できない
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_AA', root.uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # ルートフォルダをほかせない
        with self.assertRaises(Exception):
            self.delete_uri(f'/api/v0/folders/{root.uuid}', self.USER1)

        # フレーム1はゴミ箱にないこと
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.find_parent().uuid, root.uuid)

    def test_return_trashes(self):
        """
        ゴミを捨てる前の場所に戻す
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1= result['data']['uuid']

        # 移動したことのないフォルダは戻せない
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/trashes/{folder1_uuid}', {}, self.USER1)

        # フォルダ1をほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        
        # フォルダ1を戻す
        self.put_uri(f'/api/v0/trashes/{folder1_uuid}', {}, self.USER1)

        # フォルダ1はゴミ箱にないこと
        trash_can = self.factory.data.load_trash_folder()
        trashed1 = trash_can.find_children()
        self.assertNotIn(folder1_uuid, [t.uuid for t in trashed1])

        # フォルダ1は元の場所に戻っていること
        data = root.find_children()
        self.assertIn(folder1_uuid, [d.uuid for d in data])

        # フォルダ2は変更されていないこと
        folder2 = self.factory.data.find_by_uuid(folder2_uuid)
        self.assertEqual(folder2.modified_at, folder2.modified_at)

        # フレームは変更されていないこと
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.modified_at, frame.modified_at)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_return_failure(self):
        """
        ゴミを捨てる前の場所に戻そうとして失敗する場合の検証
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フォルダ2をほかす
        self.delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1)

        # もう一回フォルダ2をほかす
        self.delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1)
        
        # フォルダ1を物理削除する
        folder1 = self.factory.data.find_by_uuid(folder1_uuid)
        folder1.delete()

        # フォルダ2を戻そうとする
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/trashes/{folder2_uuid}', {}, self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trash_can = self.factory.data.load_trash_folder()
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_return_same_label(self):
        """
        ゴミを捨てる前の場所に重複するラベル名が存在する場合はリネームして戻す
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フレーム1をほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # フォルダ2内に同じラベル名でフレームを作成する
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['data']['uuid']
        self.assertEqual(result['data']['label'], 'フレームファイル_1')

        # フレーム1を戻す
        result = self.put_uri(f'/api/v0/trashes/{frame_uuid_1}', {}, self.USER1)

        # フレーム2と同じ場所に戻るのでラベルがリネームされる
        self.assertEqual(result['data'][0]['label'], 'フレームファイル_2')

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trash_can = self.factory.data.load_trash_folder()
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_partial_return(self):
        """
        フォルダ内の一部のファイルが戻される場合
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!!!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フォルダ2内にフレーム2を作成する
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['data']['uuid']
        self.assertEqual(result['data']['label'], 'フレームファイル_1')

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # フォルダ1をほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        
        # フォルダ1はほかされずに残っている
        folder1 = self.factory.data.find_by_uuid(folder1_uuid)
        self.assertEqual(folder1.find_parent().uuid, root.uuid)

        # フォルダ2はほかされずに残っている
        folder2 = self.factory.data.find_by_uuid(folder2_uuid)
        self.assertEqual(folder2.find_parent().uuid, folder1_uuid)

        # フレーム1はほかされずに残っている
        frame1 = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame1.find_parent().uuid, folder2_uuid)

        # フレーム2はゴミ箱にほかされている
        frame2 = self.factory.data.find_by_uuid(frame_uuid_2)
        self.assertNotEqual(frame2.find_parent().uuid, folder2_uuid)
        frame2_parent = self.factory.data.find_by_uuid(frame2.find_parent().uuid)
        self.assertEqual(frame2_parent.label, 'フォルダですよ2')

        self.assertNotEqual(frame2_parent.find_parent().uuid, folder1_uuid)
        frame2_parent_parent = self.factory.data.find_by_uuid(frame2_parent.find_parent().uuid)
        self.assertEqual(frame2_parent_parent.label, 'フォルダですよ1!!!!')

        trash_can = self.factory.data.load_trash_folder()
        self.assertEqual(frame2_parent_parent.find_parent().uuid, trash_can.uuid)

        # フォルダ1の形代を戻す
        self.put_uri(f'/api/v0/trashes/{frame2_parent_parent.uuid}', {}, self.USER1)

        # フレーム1は元の場所に戻っていること
        frame1 = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame1.find_parent().uuid, folder2.uuid)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_nothing_return(self):
        """
        フォルダ内の全てのファイルが戻せない場合
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!!!!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フォルダ2内にフレーム2を作成する
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['data']['uuid']
        self.assertEqual(result['data']['label'], 'フレームファイル_1')

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # フレーム2を参照するフローを作成する
        flow2 = root.create_flow('フロー2', self.get_flow_with_source(frame_uuid_2))
        flow2.save()

        # フォルダ1をほかすが、中のフレームは全てフローで使用中なのでエラーになる
        with self.assertRaises(AssertionError) as e:
            self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        
        # フォルダ1はほかされずに残っている
        folder1 = self.factory.data.find_by_uuid(folder1_uuid)
        self.assertEqual(folder1.find_parent().uuid, root.uuid)

        # フォルダ2はほかされずに残っている
        folder2 = self.factory.data.find_by_uuid(folder2_uuid)
        self.assertEqual(folder2.find_parent().uuid, folder1_uuid)

        # フレーム1はほかされずに残っている
        frame1 = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame1.find_parent().uuid, folder2_uuid)

        # フレーム2はほかされずに残っている
        frame1 = self.factory.data.find_by_uuid(frame_uuid_2)
        self.assertEqual(frame1.find_parent().uuid, folder2_uuid)

        # ゴミ箱にフォルダが作成されていないこと
        trash_can = self.factory.data.load_trash_folder()
        trashes = trash_can.find_children()
        self.assertEqual(len(trashes), 0)

    def test_return_sub_folder(self):
        """
        フォルダ1/フォルダ2/ファイル でフォルダ2だけprev_parentが設定されてる場合
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!!!?", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ1内にフレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder1_uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # フォルダ2内にフレーム2を作成する
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        result = self.post_frames('フレームファイル_2', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['data']['uuid']
        self.assertEqual(result['data']['label'], 'フレームファイル_2')

        # フォルダ1をほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # フォルダ1はほかされずに残っている
        folder1 = self.factory.data.find_by_uuid(folder1_uuid)
        self.assertEqual(folder1.find_parent().uuid, root.uuid)

        # フォルダ2はほかされている
        folder2 = self.factory.data.find_by_uuid(folder2_uuid)
        self.assertNotEqual(folder2.find_parent().uuid, folder1_uuid)

        # フォルダ2はゴミ箱へ移動していること
        frame2 = self.factory.data.find_by_uuid(frame_uuid_2)
        frame2_parent = self.factory.data.find_by_uuid(frame2.find_parent().uuid)
        self.assertEqual(frame2.find_parent().uuid, folder2_uuid)
        self.assertEqual(frame2_parent.label, 'フォルダですよ2')

        # フォルダ1は同じラベル名のフォルダが所定の位置に作成されていること
        self.assertNotEqual(frame2_parent.find_parent().uuid, folder1_uuid)
        frame2_parent_parent = self.factory.data.find_by_uuid(frame2_parent.find_parent().uuid)
        self.assertEqual(frame2_parent_parent.label, 'フォルダですよ1!!!!?')
        trash_can = self.factory.data.load_trash_folder()
        self.assertEqual(frame2_parent_parent.find_parent().uuid, trash_can.uuid)

        # フォルダ1の形代を戻す
        self.put_uri(f'/api/v0/trashes/{frame2_parent_parent.uuid}', {}, self.USER1)

        # フォルダ2は元の場所に戻っていること
        folder2 = self.factory2.data.find_by_uuid(folder2_uuid)
        self.assertEqual(folder2.find_parent().uuid, folder1.uuid)

        # フレーム2は元の場所に戻っていること
        frame2 = self.factory2.data.find_by_uuid(frame_uuid_2)
        self.assertEqual(frame2.find_parent().uuid, folder2.uuid)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_return_system_folder(self):
        """
        システムフォルダをゴミ箱に捨てると、その形代がゴミ箱に捨てられる
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フローフォルダ内にフレーム1を作成する
        import io
        FLOW_FOLDER_UUID = self.factory.data.load_flow_folder().uuid
        FLOW_FOLDER_LABEL = self.factory.data.load_flow_folder().label

        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', FLOW_FOLDER_UUID, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フローフォルダをほかす
        self.delete_uri(f'/api/v0/folders/{FLOW_FOLDER_UUID}', self.USER1)

        # フローフォルダはほかされていないこと
        flow_folder = self.factory.data.find_by_uuid(FLOW_FOLDER_UUID)
        self.assertEqual(flow_folder.find_parent().uuid, root.uuid)

        # ゴミ箱に形代が作成されていること
        trash_can = self.factory.data.load_trash_folder()
        trashes = trash_can.find_children()
        self.assertNotEqual(trashes[0].uuid, flow_folder)
        self.assertEqual(trashes[0].label, FLOW_FOLDER_LABEL)

        # フレーム1は形代フォルダ内にあること
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.find_parent().uuid, trashes[0].uuid)

        # フローフォルダの形代を戻す
        self.put_uri(f'/api/v0/trashes/{frame.find_parent().uuid}', {}, self.USER1)

        # フレーム1は元の場所に戻っていること
        # (factoryには上でキャッシュされてるのでfactory2を使う)
        frame = self.factory2.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.find_parent().uuid, FLOW_FOLDER_UUID)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_return_to_trashcan(self):
        """
        ゴミの戻し先がゴミ箱内の場合はエラーにする
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!!!Q", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['data']['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['data']['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フレームをほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # フォルダ1をほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # フレームを戻そうとする
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/trashes/{frame_uuid_1}', {}, self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        trash_can = self.factory.data.load_trash_folder()
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_update_then_return_database(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : root.uuid,
            "label"    : "リモートフォルダ1",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            "user_id"  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)
        database_uuid = result['data']['uuid']

        # ゴミ箱へほかす
        self.delete_uri(f'/api/v0/databases/{database_uuid}', self.USER1)

        # ラベル名を変更する
        data = {
            "label"    : "リモートフォルダ2",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            "user_id"  : "postgres",
            "password" : ""
        }
        self.put_uri(f'/api/v0/databases/{database_uuid}', data, self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{database_uuid}', {}, self.USER1)

    def test_update_then_return_flow(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フローを作成する
        import uuid
        flow = root.create_flow('サブフロー1', self.get_flow_with_source(str(uuid.uuid4())))
        flow.save()
        flow = self.factory.data.find_by_uuid(flow.uuid)

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow.uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # フローをゴミ箱へほかす
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)
            
        # フローを変更する
        data = {
            'flow' : flow.flow_data,
            'label': 'フローです',
            'lock' : lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{flow.uuid}', data, self.USER1)

        # ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{flow.uuid}', {}, self.USER1)

    def test_update_then_return_frame(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_AA', root.uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # ゴミ箱へほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # ラベル名を変更する
        self.put_uri(f'/api/v0/frames/{frame_uuid_1}', {"label": '変更したラベル名'}, self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{frame_uuid_1}', {}, self.USER1)

    def test_update_then_return_remote_folder(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root.uuid,
            "label"    : "リモートフォルダ1",
            "protocol" : "smb",
            "hostname" : "kskds-HP-Workstation-z620.local",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "ksk-ds",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)
        folder_uuid = result['data']['uuid']

        # ゴミ箱へほかす
        self.delete_uri(f'/api/v0/remote-folders/{folder_uuid}', self.USER1)

        # リモートフォルダを変更する
        data = {
            "label"    : "リモートフォルダ2",
            "protocol" : "smb",
            "hostname" : "kskds-HP-Workstation-z620.local",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "ksk-ds",
            "password" : "kskanalytics"
        }
        self.put_uri(f'/api/v0/remote-folders/{folder_uuid}', data, self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{folder_uuid}', {}, self.USER1)

        # 再びゴミ箱へほかす
        self.delete_uri(f'/api/v0/remote-folders/{folder_uuid}', self.USER1)

        # RemoteFolderを削除(unmount)する
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_use_frame_in_trashcan(self):
        """
        ゴミフレームを使おうとしたらエラーにする
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root.uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # フレーム1をほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # フレーム1を参照するフローを作成する
        with self.assertRaises(Exception):
            flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))

        # ゴミ箱を空にする
        trash_can = self.factory.data.load_trash_folder()
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_use_subflowin_trashcan(self):
        """
        ゴミフローを使おうとしたらエラーにする
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フレーム1を作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root.uuid, f, self.USER1)
        frame_uuid_1 = result['data']['uuid']

        # サブフローを作成する
        subflow = root.create_flow('サブフロー', self.get_flow_with_source(frame_uuid_1))
        subflow.save()

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':subflow.uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # サブフローをほかす
        self.delete_uri_with_json(f'/api/v0/flows/{subflow.uuid}', {'lock':lock_uuid}, self.USER1)
            
        # ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

        # サブフローを参照するフローを作成する
        with self.assertRaises(Exception):
            flow = root.create_flow(root.uuid, 'フロー', self.get_flow_with_subflow(subflow.uuid))

        # ゴミ箱を空にする
        trash_can = self.factory.data.load_trash_folder()
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)     


@unittest.skip
class ExecuteTestCase(ApiTestCaseBase):
    def test_execute_flow(self):
        """
        フローの実行結果がライブラリに登録されることを検証する
        """
        input_frame_uuid = 'aca1c51f-ee97-43ca-bc6e-cd151220c518'
        input_frame_uuid2 = '1ac6c925-391c-40cf-97fb-54ce59a1a151'
        subflow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'


        from kskp.web.backend.api.lib import get_library

        # ルートストアフォルダを取得する(無ければ作成する)
        root = get_library(self.USER1)

        # 入力フレームをライブラリに登録する
        self.save_frame_to_library(input_frame_uuid, 'kskp/tests/frames/test_frame1.csv')
        self.save_frame_to_library(input_frame_uuid2, 'kskp/tests/frames/test_frame2.csv')

        # テスト用フローをライブラリに保存する
        from kskp.store import Flow
        # フローJSONファイルからフローデータを取得する
        flow_path = Path(app.root_path) / 'api/tests/flows/168d23c2-f835-4392-ba0e-76e94a08b719.json'
        flow_data = json.loads(flow_path.read_text(encoding='utf-8'))
        # フローオブジェクトを作成する
        test_flow = root.create_flow('テストフロー', flow_data)
        # フローをライブラリに保存する
        test_flow.save()

        if not self.factory.data.exists(subflow_uuid):
            # テスト用フローから呼ばれるサブフローをライブラリに保存する
            subflow_path = Path(app.root_path) / 'api/tests/flows/833fdb62-2bb6-4a77-a0e1-77941ad951a3.json'
            subflow_data = json.loads(subflow_path.read_text(encoding='utf-8'))
            # サブフローオブジェクトを作成する
            test_subflow = root.create_flow('テストサブフロー', subflow_data)
            # サブフローをライブラリに保存する
            test_subflow.uuid = subflow_uuid
            test_subflow.save()

        # 実行
        result = self.get_uri('/api/v0/frames?from=%s' % test_flow.uuid, self.USER1)

        # 出力結果がライブラリに登録されることを検証する
        frame_uuid_d1 = result['name'][0]['uuid']
        frame_uuid_d3 = result['name'][1]['uuid']
        self.assertTrue(self.factory.data.exists(frame_uuid_d1))
        self.assertTrue(self.factory.data.exists(frame_uuid_d3))
        
        # 削除
        # このテストで作成したjobsだけ削除する
        from .test_api import ExecApiTestCase
        apiTestCase = ExecApiTestCase("test_execute_flow")
        apiTestCase.remove_job_file_and_frame(test_flow.uuid)
        # フレームを削除する -> sqlalchemy.orm.exc.DetachedInstanceErrorがでてしまう
        # input_frame.delete()
        # サブフローを削除する -> sqlalchemy.orm.exc.DetachedInstanceErrorがでてしまう
        # test_subflow.delete()
        # フローを削除する
        test_flow.delete()

    def test_execute_flow_using_frame_on_s3(self):
        pass

if __name__ == '__main__':
    unittest.main()
