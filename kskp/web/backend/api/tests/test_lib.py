import unittest
import os
import json
import pprint
from pathlib import Path

from kskp.web.backend import app
from kskp.store import ss
from kskp.store import StoreModel as Store
from kskp.store import Datum, Mountable, Frame, AwsS3, Database, RemoteFolder, STORE_DIR
from kskp.web.backend.api.tests.test_case_base import TestCaseBase

class DataStoreTestCase(TestCaseBase):

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
        ss.add(store1)
        ss.add(store2)
        ss.commit()

        # GET /stores
        result = self.get_uri('/api/v0/stores', self.USER_ID)

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
        self.delete_uri('/api/v0/stores/%s' % expected_result[0]['id'], self.USER_ID)
        self.delete_uri('/api/v0/stores/%s' % expected_result[1]['id'], self.USER_ID)

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
        result = self.post_uri('/api/v0/stores', data, self.USER_ID)

        # POST /stores　apiが正常終了することを検証する
        expected_result = data
        self.assertEqual(result['data'], expected_result)

        # GET /stores
        result = self.get_uri('/api/v0/stores/%s' % expected_result['id'], self.USER_ID)

        # POST /storesした値をGET /stores apiで取得できることを検証する
        self.assertEqual(result['data'], data)

        # DELETE /stores
        result = self.delete_uri('/api/v0/stores/%s' % expected_result['id'], self.USER_ID)

        # GET /stores
        with self.assertRaises(AssertionError) as e:
            result = self.get_uri('/api/v0/stores/%s' % expected_result['id'], self.USER_ID)

class LibraryTestCase(TestCaseBase):
    def test_get_root(self):
        """
        ルートフォルダがある場合にGET /libraryを実行した場合
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER_ID)

        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER_ID)
        root_uuid = result['data']['uuid']

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir(STORE_DIR.parent))

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER_ID)

    def test_get_root2(self):
        """
        ルートフォルダが無い場合にGET /libraryを実行した場合
        (無い場合はルートフォルダを自動作成することを確認する)
        """
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER_ID)
        root_uuid = result['data']['uuid']

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir(STORE_DIR.parent))

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER_ID)

    def test_get_folder(self):
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER_ID)
        root_uuid = result['data']['uuid']
        
        # ルートフォルダを取得する(GET /folders)
        result = self.get_uri('/api/v0/folders/' + root_uuid, self.USER_ID)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], root_uuid)
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER_ID)

    def test_get_no_folder(self):
        # 存在しないフォルダを取得しようとして失敗する(GET /folders)
        with self.assertRaises(AssertionError) as e:
            self.get_uri('/api/v0/folders/' + '00000000-0000-0000-0000-000000000000', self.USER_ID)

    def test_update_folder(self):
        # フォルダを作成する(POST /folders)
        root = Datum.find_root()

        # フォルダを作成する(POST /folders)
        result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": root.uuid}, self.USER_ID)
        folder_uuid = result['data']['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        result = self.put_uri('/api/v0/folders/' + folder_uuid, {'label' : ' NEW FOLDER '}, self.USER_ID)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' NEW FOLDER '
            ,'type'     : 'folder'
            ,'creator'  : '管理者'
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
        self.assertTrue(os.path.isdir((STORE_DIR.parent / root.path / ' NEW FOLDER ').as_posix()))

        # フォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER_ID)

    def test_move_folder(self):
        # ルートを取得する
        root = Datum.find_root()

        # 移動元フォルダを作成する(POST /folders)
        folder_src = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1", "parent": root.uuid}, self.USER_ID)
        folder_src_uuid = folder_src['data']['uuid']

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ2", "parent": root.uuid}, self.USER_ID)
        folder_dst_uuid = folder_dst['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/folders/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER_ID)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'folder'
            ,'creator'  : '管理者'
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
        self.assertTrue(os.path.isdir((STORE_DIR.parent / root.path / '新しいフォルダ2' / '新しいフォルダ1').as_posix()))

    def test_move_folder2(self):
        # ルートを取得する
        root = Datum.find_root()

        # 移動元フォルダを作成する(POST /folders)
        folder_src = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1", "parent": root.uuid}, self.USER_ID)
        folder_src_uuid = folder_src['data']['uuid']

        # 移動元フォルダ内にフォルダを作成する
        folder_src_1 = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1_1", "parent": folder_src_uuid}, self.USER_ID)
        folder_src_uuid_1 = folder_src_1['data']['uuid']

        # 上記フォルダ内にフレームを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder_src_uuid_1, f, self.USER_ID)
        frame_uuid_1= result['data']['uuid']

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ2a", "parent": root.uuid}, self.USER_ID)
        folder_dst_uuid = folder_dst['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/folders/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER_ID)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'folder'
            ,'creator'  : '管理者'
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
        dst_folder_path = STORE_DIR.parent /root.path / '新しいフォルダ2a'
        self.assertTrue(os.path.isdir(dst_folder_path / '新しいフォルダ1'))
        self.assertTrue(os.path.isdir(dst_folder_path / '新しいフォルダ1' / '新しいフォルダ1_1'))
        self.assertTrue(os.path.isfile(dst_folder_path/ '新しいフォルダ1' / '新しいフォルダ1_1' / 'フレームファイル_1'))

    def test_create_get_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER_ID)
        # folder_uuid = result['data']['uuid']
        root = Datum.find_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"xyzxyzxyzxyz"), 'foo.csv')

        # フレームを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル?', root.uuid, f, self.USER_ID)
        frame_uuid = result['data']['uuid']

        # フレームに対応するファイルが存在することを検証する
        self.assertTrue(os.path.isfile((STORE_DIR.parent / root.path / '新しいフレームファイル?').as_posix()))

        # フレームを取得する(GET /frames)
        self.get_uri('/api/v0/frames/' + frame_uuid, self.USER_ID)
            
        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER_ID)

        # フォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER_ID)

    def test_create_delete_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER_ID)
        # folder_uuid = result['data']['uuid']
        folder_uuid = Datum.find_root().uuid

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル!', folder_uuid, f, self.USER_ID)
        frame_uuid = result['data']['uuid']

        # Post /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        
        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフレームファイル!'
            ,'type'     : 'frame'
            ,'creator'  : '管理者'
        }

        # Post /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])

        # 中のファイルごとフォルダを削除しようとする(DELETE /folders)
        with self.assertRaises(AssertionError) as e:
            self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER_ID)

        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER_ID)

        # フォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER_ID)

    def test_update_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER_ID)
        # folder_uuid = result['data']['uuid']
        root = Datum.find_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = (io.BytesIO(b"thisisaframefile"), 'aaa.csv')

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイルAA', root.uuid, f, self.USER_ID)
        frame_uuid = result['data']['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        result = self.put_uri('/api/v0/frames/' + frame_uuid, {'label' : ' F L A M E-F I L E '}, self.USER_ID)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' F L A M E-F I L E '
            ,'type'     : 'frame'
            ,'creator'  : '管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['data']['uuid'], None)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フレームに対応するファイルが存在することを検証する
        self.assertTrue(os.path.isfile((STORE_DIR.parent / root.path / ' F L A M E-F I L E ').as_posix()))

        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER_ID)

        # フォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER_ID)

    def test_move_frame(self):
        # ルートを取得する
        root = Datum.find_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1B", "parent": root.uuid}, self.USER_ID)
        folder_dst_uuid = folder_dst['data']['uuid']

        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyB.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1B', root.uuid, f, self.USER_ID)
        frame_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/frames/%s' % frame_uuid, {"parent": folder_dst_uuid}, self.USER_ID)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フレームファイル_1B'
            ,'type'     : 'frame'
            ,'creator'  : '管理者'
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
        self.assertTrue(os.path.isfile((STORE_DIR.parent / root.path / '新しいフォルダ1B' / 'フレームファイル_1B').as_posix()))

class AwsS3TestCase(TestCaseBase):
    def test_create_get_awss3(self):
        root = Datum.find_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Amazonに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER_ID)

        # POST /awss3sの戻り値が正しいことを検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], 'Amazonに感謝')
        self.assertEqual(result['data']['bucket'], 'kskp-test')
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        awss3_uuid = result['data']['uuid']
        awss3 = AwsS3.find_by_uuid(awss3_uuid)

        # S3マウント用フォルダが作成されていることを検証する
        self.assertTrue(os.path.isdir((STORE_DIR.parent / awss3.path).as_posix()))

        # S3フォルダを取得する(GET /awss3s)
        result = self.get_uri('/api/v0/awss3s/' + awss3_uuid, self.USER_ID)

        # GET /awss3sの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], awss3_uuid)
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], 'Amazonに感謝')
        self.assertEqual(result['data']['bucket'], 'kskp-test')
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertIsNotNone(result['data']['children'])
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ROOT_FOLDER')
        self.assertEqual(result['data']['folderPath'][1]['uuid'], awss3_uuid)
        self.assertEqual(result['data']['folderPath'][1]['label'], 'Amazonに感謝')

        # S3フォルダがマウントされていることを検証する
        self.assertTrue(Mountable.is_mount(STORE_DIR.parent / awss3.path))

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (STORE_DIR.parent / awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER_ID)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_update_awss3(self):
        root = Datum.find_root()
        root_uuid = root.uuid
        root_path = root.path
        
        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Appleに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER_ID)

        awss3_uuid = result['data']['uuid']
        awss3 = AwsS3.find_by_uuid(awss3_uuid)

        # S3フォルダのラベルを更新する(PUT /awss3s)
        update_data = {
            'label' : '大根の卸金が欲しい',
            'bucket': 'abc'
        }
        result = self.put_uri('/api/v0/awss3s/' + awss3_uuid, update_data, self.USER_ID)

        # PUT /awss3sの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], awss3_uuid)
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], '大根の卸金が欲しい')
        self.assertEqual(result['data']['bucket'], 'abc')
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (STORE_DIR.parent / awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER_ID)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_remount_awss3(self):
        root = Datum.find_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Googleに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER_ID)

        awss3_uuid = result['data']['uuid']
        awss3 = AwsS3.find_by_uuid(awss3_uuid)

        # KSKPの外部からUnmountをする
        import shlex
        import subprocess
        import time
        time.sleep(1)
        awss3_abs_path = (STORE_DIR.parent / root_path / 'Googleに感謝').as_posix()
        ret = subprocess.run(shlex.split(f'/sbin/umount {awss3_abs_path}'), 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE)
        # umountコマンドの正常終了を確認する
        self.assertEqual(ret.returncode, 0)

        # AwsS3.pathプロパティへのアクセスでremount処理が走る
        tmp_var = awss3.path

        # S3フォルダがマウントされていることを検証する
        self.assertTrue(Mountable.is_mount(STORE_DIR.parent / awss3.path))

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (STORE_DIR.parent / awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER_ID)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_mount_under_mount_awss3(self):
        root = Datum.find_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Facebookに感謝',
            'bucket': 'kskp-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER_ID)
        awss3_uuid = result['data']['uuid']
        awss3 = AwsS3.find_by_uuid(awss3_uuid)

        # AWS S3フォルダの下にAWS S3フォルダを作成しようとする(POST /awss3s)
        data = {
            'parent': awss3_uuid,
            'label' : 'Microsoftにさようなら',
            'bucket': 'kskp-test'
        }
        # S3フォルダの下にS3フォルダを作成することはできない
        with self.assertRaises(AssertionError) as e:
            result = self.post_uri('/api/v0/awss3s', data, self.USER_ID)

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (STORE_DIR.parent / awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER_ID)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))



class DatabaseTestCase(TestCaseBase):
    def test_create_get_database(self):
        root = Datum.find_root()
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
        result = self.post_uri('/api/v0/databases', data, self.USER_ID)

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
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        database_uuid = result['data']['uuid']
        database = Database.find_by_uuid(database_uuid)

        # Databaseを取得する(GET /databases)
        result = self.get_uri('/api/v0/databases/' + database_uuid, self.USER_ID)

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
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER_ID)

    def test_update_database(self):
        root = Datum.find_root()
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
        result = self.post_uri('/api/v0/databases', data, self.USER_ID)

        database_uuid = result['data']['uuid']
        database = Database.find_by_uuid(database_uuid)

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
        result = self.put_uri('/api/v0/databases/' + database_uuid, update_data, self.USER_ID)

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
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # Databaseを削除(unmount)する(DELETE /databases)
        self.delete_uri('/api/v0/databases/' + database_uuid, self.USER_ID)

    def test_move_database(self):
        # ルートを取得する
        root = Datum.find_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1B", "parent": root.uuid}, self.USER_ID)
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
        result = self.post_uri('/api/v0/databases', data, self.USER_ID)
        database_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/databases/%s' % database_uuid, {"parent": folder_dst_uuid}, self.USER_ID)

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
            'creator'  : '管理者'
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

class RemoteFolderTestCase(TestCaseBase):

    def test_create_get_folders(self):
        root = Datum.find_root()
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
        result = self.post_uri('/api/v0/remote-folders', data, self.USER_ID)

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
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        folder_uuid = result['data']['uuid']
        folder = RemoteFolder.find_by_uuid(folder_uuid)

        # RemoteFolderを取得する(GET /remote-folders)
        result = self.get_uri('/api/v0/remote-folders/' + folder_uuid, self.USER_ID)

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
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # RemoteFolderを削除(unmount)する(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER_ID)

    def test_update_folders(self):
        root = Datum.find_root()
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
        result = self.post_uri('/api/v0/remote-folders', data, self.USER_ID)

        folder_uuid = result['data']['uuid']
        folder = RemoteFolder.find_by_uuid(folder_uuid)

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
        result = self.put_uri('/api/v0/remote-folders/' + folder_uuid, update_data, self.USER_ID)

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
        self.assertEqual(result['data']['creator'], '管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # RemoteFolderを削除(unmount)する(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER_ID)

    @unittest.skip
    def test_move_folders(self):
        # ルートを取得する
        root = Datum.find_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1C", "parent": root.uuid}, self.USER_ID)
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
        result = self.post_uri('/api/v0/remote-folders', data, self.USER_ID)
        folder_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/remote-folders/%s' % folder_uuid, {"parent": folder_dst_uuid}, self.USER_ID)

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

@unittest.skip
class ExecuteTestCase(TestCaseBase):
    def test_execute_flow(self):
        """
        フローの実行結果がライブラリに登録されることを検証する
        """
        input_frame_uuid = 'aca1c51f-ee97-43ca-bc6e-cd151220c518'
        input_frame_uuid2 = '1ac6c925-391c-40cf-97fb-54ce59a1a151'
        subflow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'


        from kskp.web.backend.api.lib import get_library

        # ルートストアフォルダを取得する(無ければ作成する)
        root = get_library(self.USER_ID)

        # 入力フレームをライブラリに登録する
        self.save_frame_to_library(input_frame_uuid, 'kskp/tests/frames/test_frame1.csv')
        self.save_frame_to_library(input_frame_uuid2, 'kskp/tests/frames/test_frame2.csv')

        # テスト用フローをライブラリに保存する
        from kskp.store import Flow
        # フローJSONファイルからフローデータを取得する
        flow_path = Path(app.root_path) / 'api/tests/flows/168d23c2-f835-4392-ba0e-76e94a08b719.json'
        flow_data = json.loads(flow_path.read_text(encoding='utf-8'))
        # フローオブジェクトを作成する
        test_flow = Flow(root.uuid, 'テストフロー', flow_data, self.USER_ID)
        # フローをライブラリに保存する
        test_flow.save()

        if not Flow.exists(subflow_uuid):
            # テスト用フローから呼ばれるサブフローをライブラリに保存する
            subflow_path = Path(app.root_path) / 'api/tests/flows/833fdb62-2bb6-4a77-a0e1-77941ad951a3.json'
            subflow_data = json.loads(subflow_path.read_text(encoding='utf-8'))
            # サブフローオブジェクトを作成する
            test_subflow = Flow(root.uuid, 'テストサブフロー', subflow_data, self.USER_ID)
            # サブフローをライブラリに保存する
            test_subflow.uuid = subflow_uuid
            test_subflow.save()

        # 実行
        result = self.get_uri('/api/v0/frames?from=%s' % test_flow.uuid, self.USER_ID)

        # 出力結果がライブラリに登録されることを検証する
        frame_uuid_d1 = result['name'][0]['uuid']
        frame_uuid_d3 = result['name'][1]['uuid']
        self.assertTrue(Frame.exists(frame_uuid_d1))
        self.assertTrue(Frame.exists(frame_uuid_d3))
        
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
