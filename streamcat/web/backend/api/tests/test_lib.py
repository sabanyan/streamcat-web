import os
import pprint
from .api_test_case_base import ApiTestCaseBase

class LibraryTest(ApiTestCaseBase):
    def test_get_root(self):
        """
        ルートフォルダがある場合にGET /libraryを実行した場合
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER1)

        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['uuid']

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['type'], 'folder')
        self.assertEqual(result['label'], 'ライブラリ')
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        from streamcat.core import SavableDatum
        self.assertTrue(os.path.isdir(SavableDatum.STORE_DIR))

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER1)

    def test_get_root2(self):
        """
        ルートフォルダが無い場合にGET /libraryを実行した場合
        (無い場合はルートフォルダを自動作成することを確認する)
        """
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['uuid']

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['type'], 'folder')
        self.assertEqual(result['label'], 'ライブラリ')
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')

        # 作成したフォルダに対応するディレクトリが存在することを検証する
        from streamcat.core import SavableDatum
        self.assertTrue(os.path.isdir(SavableDatum.STORE_DIR))

        # ルートフォルダを削除する(DELETE /folders)
        # self.delete_uri('/api/v0/folders/' + root_uuid, self.USER1)

    def test_get_folder(self):
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['uuid']
        
        # ルートフォルダを取得する(GET /folders)
        result = self.get_uri('/api/v0/folders/' + root_uuid, self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['uuid'], root_uuid)
        self.assertEqual(result['type'], 'folder')
        self.assertEqual(result['label'], 'ライブラリ')
        self.assertEqual(result['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['folderPath'][0]['label'], 'ライブラリ')

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
        folder_uuid = result['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        result = self.put_uri('/api/v0/folders/' + folder_uuid, {'label' : ' NEW FOLDER '}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' NEW FOLDER '
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /folders apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['uuid'], None)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

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
        folder_src_uuid = folder_src['uuid']

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ2", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/folders/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['uuid'], folder_src_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir((root.path / '新しいフォルダ2' / '新しいフォルダ1').as_posix()))

    def test_move_folder2(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動元フォルダを作成する(POST /folders)
        folder_src = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1", "parent": root.uuid}, self.USER1)
        folder_src_uuid = folder_src['uuid']

        # 移動元フォルダ内にフォルダを作成する
        folder_src_1 = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1_1", "parent": folder_src_uuid}, self.USER1)
        folder_src_uuid_1 = folder_src_1['uuid']

        # 上記フォルダ内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder_src_uuid_1, f, self.USER1)
        frame_uuid_1= result['uuid']

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ2a", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/folders/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['uuid'], folder_src_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        dst_folder_path = root.path / '新しいフォルダ2a'
        self.assertTrue(os.path.isdir(dst_folder_path / '新しいフォルダ1'))
        self.assertTrue(os.path.isdir(dst_folder_path / '新しいフォルダ1' / '新しいフォルダ1_1'))
        self.assertTrue(os.path.isfile(dst_folder_path/ '新しいフォルダ1' / '新しいフォルダ1_1' / 'フレームファイル_1'))

    def test_delete_folder(self):
        # フォルダを作成する(POST /folders)
        root = self.factory.data.load_root()

        # フォルダを作成する(POST /folders)
        result = self.post_uri('/api/v0/folders', {"label" : "私の新しいフォルダ", "parent": root.uuid}, self.USER1)
        folder_uuid = result['uuid']

        # フォルダを削除する(DELETE /folders)
        result = self.delete_uri('/api/v0/folders/' + folder_uuid, self.USER1)

        # ゴミ箱のUUID
        trash_folder_uuid = self.factory.data.load_trash_folder().uuid

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '私の新しいフォルダ'
            ,'type'     : 'folder'
            ,'creator'  : 'ユーザー管理者'
        }

        # DELETE /folders apiの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], folder_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['folderUuid'], trash_folder_uuid)
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # フォルダはゴミ箱に移動していること
        trash_folder = self.factory.data.load_trash_folder()
        trashed = trash_folder.find_children()
        self.assertEqual(len(trashed), 1)
        self.assertEqual(trashed[0].label, '私の新しいフォルダ')

    def test_duplicate_folder(self):
        """
        フォルダを複製できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダを作成する(POST /folders)
        result = self.post_uri('/api/v0/folders', {"label" : "私の新しいフォルダ", "parent": root.uuid}, self.USER1)
        folder_uuid = result['uuid']

        # フォルダの下にフローを作成する
        data = {
            'parent': folder_uuid,
            'label': 'my-flow',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)
        flow_uuid = result['uuid']

        # フォルダを複製する(POST /folders)
        result = self.post_uri(f'/api/v0/folders', {'source':folder_uuid}, self.USER1)
        duplicated_folder_uuid = result['uuid']

        # POST /folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertNotEqual(result['uuid'], folder_uuid)
        self.assertEqual(result['label'], '私の新しいフォルダ のコピー')
        self.assertEqual(result['type'], 'folder')
        self.assertEqual(result['folderPath'], '/ライブラリ')
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], self.USER1.name)
        self.assertNotEqual(result['createdAt'], None)
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertTrue(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertTrue(result['allowlist']['createFolder'])
        self.assertTrue(result['allowlist']['createFile'])
        self.assertTrue(result['allowlist']['upload'])
        self.assertTrue(result['allowlist']['import'])

        # 複製したフォルダの下にフローも複製されること
        result = self.get_uri(f'/api/v0/folders/{duplicated_folder_uuid}', self.USER1)
        self.assertEqual(len(result['children']), 1)
        duplicated_flow = result['children'][0]
        self.assertNotEqual(duplicated_flow['uuid'], flow_uuid)
        self.assertEqual(duplicated_flow['label'], 'my-flow')
        self.assertEqual(duplicated_flow['type'], 'flow')
        self.assertIsNone(duplicated_flow['folderPath'])
        self.assertEqual(duplicated_flow['folderUuid'], duplicated_folder_uuid)
        self.assertIsNone(duplicated_flow['prevFolderPath'])
        self.assertEqual(duplicated_flow['creator'], self.USER1.name)
        self.assertNotEqual(duplicated_flow['createdAt'], None)
        self.assertTrue(duplicated_flow['allowlist']['read'])
        self.assertTrue(duplicated_flow['allowlist']['update'])
        self.assertTrue(duplicated_flow['allowlist']['delete'])
        self.assertTrue(duplicated_flow['allowlist']['execute'])
        self.assertTrue(duplicated_flow['allowlist']['download'])
        self.assertTrue(duplicated_flow['allowlist']['export'])
        self.assertTrue(duplicated_flow['allowlist']['copy'])
        self.assertTrue(duplicated_flow['allowlist']['move'])
        self.assertTrue(duplicated_flow['allowlist']['lock'])
        self.assertFalse(duplicated_flow['allowlist']['findMember'])
        self.assertFalse(duplicated_flow['allowlist']['updateMember'])

        # フォルダを削除する(DELETE /folders)
        self.delete_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)
        self.delete_uri(f'/api/v0/folders/{duplicated_folder_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_create_get_frame(self):
        # フォルダを作成する(POST /folders)
        # result = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ", "parent": None}, self.USER1)
        # folder_uuid = result['uuid']
        root = self.factory.data.load_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"xyzxyzxyzxyz")

        # フレームを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル?', root.uuid, f, self.USER1)
        frame_uuid = result['uuid']

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
        # folder_uuid = result['uuid']
        folder_uuid = self.factory.data.load_root().uuid

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"abcdef")

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル!', folder_uuid, f, self.USER1)
        frame_uuid = result['uuid']

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフレームファイル!'
            ,'type'     : 'frame'
            ,'creator'  : 'ユーザー管理者'
        }

        # Post /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])

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
        # folder_uuid = result['uuid']
        root = self.factory.data.load_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"thisisaframefile")

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイルAA', root.uuid, f, self.USER1)
        frame_uuid = result['uuid']

        # フレームのラベル名を変更する(PUT /frames)
        result = self.put_uri('/api/v0/frames/' + frame_uuid, {'label' : ' F L A M E-F I L E '}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' F L A M E-F I L E '
            ,'type'     : 'frame'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['uuid'], None)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

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
        f = io.BytesIO(b"thisisaframefile")

        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイルAA2', root.uuid, f, self.USER1)
        frame_uuid = result['uuid']

        # フレームの文字コードを変更する(PUT /frames)
        result = self.put_uri('/api/v0/frames/' + frame_uuid, {'encoding':'UTF-8', 'newline':'LF'}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フレームファイルAA2'
            ,'type'     : 'frame'
            ,'encoding' : 'UTF-8'
            ,'newline'  : 'LF'
            ,'fileSize' : 16
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['uuid'], None)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['encoding'], expected_result['encoding'])
        self.assertEqual(result['newline'], expected_result['newline'])
        self.assertEqual(result['fileSize'], expected_result['fileSize'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # 中のファイルを削除する(DELETE /frames)
        self.delete_uri('/api/v0/frames/' + frame_uuid, self.USER1)

    def test_move_frame(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1B", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['uuid']

        # フレームを作成する(POST /frames)
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1B', root.uuid, f, self.USER1)
        frame_uuid = result['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/frames/%s' % frame_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フレームファイル_1B'
            ,'type'     : 'frame'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['uuid'], frame_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isfile((root.path / '新しいフォルダ1B' / 'フレームファイル_1B').as_posix()))

    def test_escape_path(self):
        """
        Datum.pathに%や_が含まれる値を格納できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        result = self.post_uri('/api/v0/folders', {'label': r'F O L \% E % R', 'parent': root.uuid}, self.USER1)
        folder1_uuid = result['uuid']

        # フォルダ2を作成する(POST /folders)
        result = self.post_uri('/api/v0/folders', {'label': 'f o l d e r', 'parent': folder1_uuid}, self.USER1)
        folder2_uuid = result['uuid']

        # フレームを作成する(POST /frames)
        import io
        f = io.BytesIO(b"thisisaframefile")
        result = self.post_frames('フレームファイルAA', folder2_uuid, f, self.USER1)

        # フォルダ1のラベル名を変更する(PUT /folders)
        result = self.put_uri(f'/api/v0/folders/{folder1_uuid}', {'label': r'F O L \% E % R 2'}, self.USER1)

        # フォルダ2を削除する
        self.delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

        # フォルダ1を削除する
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
