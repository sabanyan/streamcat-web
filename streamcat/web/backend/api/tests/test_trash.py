import unittest
import pprint

from .api_test_case_base import ApiTestCaseBase

class TrashTestCase(ApiTestCaseBase):
  
    def get_flow_with_source(self, source_frame_uuid):
        from streamcat.store import FlowData
        return FlowData(
            {
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
        )

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
        folder1_uuid = folder1['uuid']

        # フォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": root.uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', root.uuid, f, self.USER1)
        frame_uuid_1= result['uuid'] 

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
            "creator"  : 'ユーザー管理者'
        }
        expected_child1 = {
            "type"     : "folder",
            "label"    : "フォルダですよ1",
            "creator"  : 'ユーザー管理者'
        }
        expected_child2 = {
            "type"     : "folder",
            "label"    : "フォルダですよ2",
            "creator"  : 'ユーザー管理者'
        }
        expected_child3 = {
            "type"     : "frame",
            "label"    : "フレームファイル_1",
            "creator"  : 'ユーザー管理者'
        }
        folder_path1 = {
            "type"     : "folder",
            "label"    : "ライブラリ"
        }
        folder_path2 = {
            "type"     : "trash",
            "label"    : "ゴミ箱"
        }

        # GET /trashes apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['label'], expected_result['label'])
        # テストではLibrary._init_library_folders()でゴミ箱を作成しているのでcreator=None
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertNotEqual(result['createdAt'], None)
        # フォルダ2
        # (ゴミ箱内のフォルダは新規作成するのでUUIDは新規取得される)
        self.assertIsNotNone(result['children'][0]['uuid'])
        self.assertEqual(result['children'][0]['type'], expected_child2['type'])
        self.assertEqual(result['children'][0]['label'], expected_child2['label'])
        self.assertEqual(result['children'][0]['creator'], expected_child2['creator'])
        self.assertNotEqual(result['children'][0]['createdAt'], None)
        # フォルダ1
        # (ゴミ箱内のフォルダは新規作成するのでUUIDは新規取得される)
        self.assertIsNotNone(result['children'][1]['uuid'])
        self.assertEqual(result['children'][1]['type'], expected_child1['type'])
        self.assertEqual(result['children'][1]['label'], expected_child1['label'])
        self.assertEqual(result['children'][1]['creator'], expected_child1['creator'])
        self.assertNotEqual(result['children'][1]['createdAt'], None)
        # フレーム1
        self.assertEqual(result['children'][2]['uuid'], frame_uuid_1)
        self.assertEqual(result['children'][2]['type'], expected_child3['type'])
        self.assertEqual(result['children'][2]['label'], expected_child3['label'])
        self.assertEqual(result['children'][2]['creator'], expected_child3['creator'])
        self.assertNotEqual(result['children'][2]['createdAt'], None)
        # ROOT (folderPath)
        self.assertEqual(result['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['folderPath'][0]['type'], folder_path1['type'])
        self.assertEqual(result['folderPath'][0]['label'], folder_path1['label'])
        # ゴミ箱 (folderPath)
        self.assertIsNotNone(result['folderPath'][1]['uuid'])
        self.assertEqual(result['folderPath'][1]['type'], folder_path2['type'])
        self.assertEqual(result['folderPath'][1]['label'], folder_path2['label'])

    def test_get_trashes_offset_limit(self):
        """
        GET /trashes?offset=&limit=
        """
        # offsetとlimitを指定してGET /trashesでゴミ箱の中を確認する
        result = self.get_uri('/api/v0/trashes?offset=3&limit=2', self.USER1)

        # GET /trashes apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'trash')
        self.assertEqual(result['label'], 'ゴミ箱')
        # テストではLibrary._init_library_folders()でゴミ箱を作成しているのでcreator=None
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertNotEqual(result['createdAt'], None)

    def test_maintain_folder_hierarchy(self):
        """
        ゴミ箱に捨ててもフォルダ階層は維持される
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ1!", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1= result['uuid']

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ!2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1= result['uuid']

        # フローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # 作成を確定する
        self.factory.end()

        # フォルダ1をほかすが、中のフレームはフローで使用中なのでエラーになる
        with self.assertRaises(AssertionError) as e:
            self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # フォルダ2内にフレーム2を作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレーム2データを作成する(POST /frames)
        result = self.post_frames('フレームファイル_2', folder2_uuid, f, self.USER1)
        frame_uuid_2= result['uuid']

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

    def test_delete_frame_refered(self):
        """
        フローから参照されているフレームはゴミ箱に捨てられないこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {"label" : "フォルダやで!1", "parent": root.uuid}, self.USER1)
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダやで!2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフォルダ3を作成する
        folder3 = self.post_uri('/api/v0/folders', {"label" : "フォルダやで!3", "parent": folder2_uuid}, self.USER1)
        folder3_uuid = folder3['uuid']

        # フォルダ3内にフレームを作成する
        import io
        f = io.BytesIO(b'abcABC')
        result = self.post_frames('フレームファイル', folder3_uuid, f, self.USER1)
        frame_uuid= result['uuid']

        # フォルダ1内にフローを作成する
        data_source = {
            "id": "i",
            "type": "frame",
            "dataSource": "csv",
            "uuid": frame_uuid,
            "label": "test"
        }
        data = {
            'parent': folder1_uuid,
            'label': 'フロー',
            'flow': {'nodes':[data_source]}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)

        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        if result['children'][0]['uuid'] == folder2_uuid:
            flow_uuid = result['children'][1]['uuid']
        else:
            flow_uuid = result['children'][0]['uuid']

        # 参照するフレームはほかせないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/frames/{frame_uuid}', self.USER1)

        # フォルダ2内にはフローが参照するフレームがあるのでほかせないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1)

        # フローをロックする
        result = self.post_uri('/api/v0/locks', {'target' : flow_uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローはほかせること
        result = self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}', {'lock':lock_uuid}, self.USER1)
                                            
        # フローをほかしたあとはフレームをほかせること
        # (ゴミ箱内のフローから参照されているフレームはゴミ箱に捨てられること)
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # 編集者は、フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_delete_folder_has_refered_file(self):
        """
        フローと参照されているフレームが同じフォルダに存在する場合
        そのフォルダを削除できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクト1を作成する(POST /folders)
        project1 = self.post_uri('/api/v0/projects', {"label" : "プロジェクトどす!1", "parent": root.uuid}, self.USER1)
        project1_uuid = project1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダどす!2", "parent": project1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフォルダ3を作成する
        folder3 = self.post_uri('/api/v0/folders', {"label" : "フォルダどす!3", "parent": folder2_uuid}, self.USER1)
        folder3_uuid = folder3['uuid']

        # フォルダ3内にフレームを作成する
        import io
        f = io.BytesIO(b'abcABC')
        result = self.post_frames('フレームファイル', folder3_uuid, f, self.USER1)
        frame_uuid= result['uuid']

        # フォルダ3内にフローを作成する
        data_source = {
            "id": "i",
            "type": "frame",
            "dataSource": "csv",
            "uuid": frame_uuid,
            "label": "test"
        }
        data = {
            'parent': folder3_uuid,
            'label': 'フロー',
            'flow': {'nodes':[data_source]}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)

        # フローのUUIDを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/folders/{folder3_uuid}', self.USER1)
        if result['children'][0]['uuid'] == folder2_uuid:
            flow_uuid = result['children'][1]['uuid']
        else:
            flow_uuid = result['children'][0]['uuid']

        # 参照するフレームはほかせないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/frames/{frame_uuid}', self.USER1)

        # プロジェクトを丸ごとほかせること
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)
                         
        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_delete_root_folder(self):
        """
        ルートフォルダは削除できない
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フレーム1を作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_AA', root.uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # ルートフォルダをほかせない
        with self.assertRaises(Exception):
            self.delete_uri(f'/api/v0/folders/{root.uuid}', self.USER1)

        # フレーム1はゴミ箱にないこと
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.find_parent().uuid, root.uuid)

    def test_delete_remote_folder(self):
        """
        マウント状態のリモートフォルダをゴミ箱に捨てるとマウントが解除されること
        """
        # ルートを取得する
        root = self.factory3.data.load_root()

        # ルートの下にプロジェクトを作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'私のプロジェクトですよ'}, self.USER1)
        project1_uuid = project1['uuid']

        # プロジェクトの下にリモートフォルダを作成する(POST /remote-folders)
        data = {
            'parent'   : project1_uuid,
            'label'    : '私のリモートフォルダ',
            'protocol' : 'smb',
            'hostname' : '18.178.64.116',
            'domain'   : 'WORKGROUP',
            'directory': 'share',
            'userId'   : 'samba',
            'password' : 'kskanalytics'
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)
        remote_folder_uuid = result['uuid']

        # ゴミ箱を取得する
        trashcan = self.factory3.data.find_trashcan()

        # リモートフォルダをほかす
        result = self.delete_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER1)
        # リモートフォルダはゴミ箱にほかされていること
        self.assertEqual(result['uuid'], remote_folder_uuid)
        self.assertEqual(result['folderUuid'], trashcan.uuid)
        self.assertEqual(result['type'], 'rfolder')

        # リモートフォルダをゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{remote_folder_uuid}', {}, self.USER1)

        # リモートフォルダはゴミ箱にないこと
        trashed = trashcan.find_children()
        self.assertNotIn(remote_folder_uuid, [t.uuid for t in trashed])

        # リモートフォルダは元の場所に戻っていること
        result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER1)
        self.assertEqual(result['uuid'], remote_folder_uuid)
        self.assertEqual(result['folderUuid'], project1_uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['type'], 'rfolder')
        
        # プロジェクトごとゴミ箱にほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_return_trashes(self):
        """
        ゴミを捨てる前の場所に戻す
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {"label" : "プロジェクトですよ1!!", "parent": root.uuid}, self.USER1)
        project1_uuid = project1['uuid']

        # プロジェクト1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": project1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1= result['uuid']

        # 移動したことのないフォルダは戻せない
        with self.assertRaises(AssertionError):
            self.put_uri(f'/api/v0/trashes/{project1_uuid}', {}, self.USER1)

        # プロジェクト1をほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)

        # プロジェクト1を戻す
        self.put_uri(f'/api/v0/trashes/{project1_uuid}', {}, self.USER1)

        # プロジェクト1はゴミ箱にないこと
        trash_can = self.factory.data.load_trash_folder()
        trashed1 = trash_can.find_children()
        self.assertNotIn(project1_uuid, [t.uuid for t in trashed1])

        # プロジェクト1は元の場所に戻っていること
        data = root.find_children()
        self.assertIn(project1_uuid, [d.uuid for d in data])

        # フォルダ2は変更されていないこと
        folder2 = self.factory.data.find_by_uuid(folder2_uuid)
        self.assertEqual(folder2.modified_at, folder2.modified_at)

        # フレームは変更されていないこと
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.modified_at, frame.modified_at)

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # フレーム1をほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # フォルダ2内に同じラベル名でフレームを作成する
        f = io.BytesIO(b"abcdef")
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['uuid']
        self.assertEqual(result['label'], 'フレームファイル_1')

        # フレーム1を戻す
        result = self.put_uri(f'/api/v0/trashes/{frame_uuid_1}', {}, self.USER1)

        # フレーム2と同じ場所に戻るのでラベルがリネームされる
        self.assertEqual(result[0]['label'], 'フレームファイル_2')

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレーム1を作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # フォルダ2内にフレーム2を作成する
        f = io.BytesIO(b"abcdef")
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['uuid']
        self.assertEqual(result['label'], 'フレームファイル_1')

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # 作成を確定する
        self.factory.end()

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレーム1を作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # フォルダ2内にフレーム2を作成する
        f = io.BytesIO(b"abcdef")
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['uuid']
        self.assertEqual(result['label'], 'フレームファイル_1')

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # フレーム2を参照するフローを作成する
        flow2 = root.create_flow('フロー2', self.get_flow_with_source(frame_uuid_2))
        flow2.save()

        # 作成を確定する
        self.factory.end()

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ1内にフレーム1を作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder1_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        flow.save()

        # 作成を確定する
        self.factory.end()

        # フォルダ2内にフレーム2を作成する
        f = io.BytesIO(b"abcdef")
        result = self.post_frames('フレームファイル_2', folder2_uuid, f, self.USER1)
        frame_uuid_2 = result['uuid']
        self.assertEqual(result['label'], 'フレームファイル_2')

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
        # (factoryには上でキャッシュされてるのでGET /foldersを使う)
        result = self.get_uri(f'/api/v0/folders/{folder1.uuid}', self.USER1)
        self.assertEqual(len(result['children']), 2)
        self.assertEqual(result['children'][0]['uuid'], folder2_uuid)

        # フレーム2は元の場所に戻っていること
        # (factoryには上でキャッシュされてるのでGET /foldersを使う)
        result = self.get_uri(f'/api/v0/folders/{folder2.uuid}', self.USER1)
        self.assertEqual(len(result['children']), 1)
        self.assertEqual(result['children'][0]['uuid'], frame_uuid_2)

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

        # 作成を確定する
        self.factory.end()

        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', FLOW_FOLDER_UUID, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # フローフォルダをほかす
        self.delete_uri(f'/api/v0/folders/{FLOW_FOLDER_UUID}', self.USER1)

        # フローフォルダはほかされていないこと
        flow_folder = self.factory.data.find_by_uuid(FLOW_FOLDER_UUID)
        self.assertEqual(flow_folder.find_parent().uuid, root.uuid)

        # ゴミ箱に形代が作成されていること
        trash_can = self.factory.data.load_trash_folder()
        trashes = trash_can.find_children()
        self.assertNotEqual(trashes[0], flow_folder)
        self.assertEqual(trashes[0].label, FLOW_FOLDER_LABEL)

        # フレーム1は形代フォルダ内にあること
        frame = self.factory.data.find_by_uuid(frame_uuid_1)
        self.assertEqual(frame.find_parent().uuid, trashes[0].uuid)

        # フローフォルダの形代を戻す
        self.put_uri(f'/api/v0/trashes/{frame.find_parent().uuid}', {}, self.USER1)

        # フレーム1は元の場所に戻っていること
        # (factoryには上でキャッシュされてるのでGET /foldersを使う)
        result = self.get_uri(f'/api/v0/folders/{FLOW_FOLDER_UUID}', self.USER1)
        self.assertEqual(len(result['children']), 1)
        self.assertEqual(result['children'][0]['uuid'], frame_uuid_1)

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
        folder1_uuid = folder1['uuid']

        # フォルダ1内にフォルダ2を作成する
        folder2 = self.post_uri('/api/v0/folders', {"label" : "フォルダですよ2", "parent": folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ2内にフレームを作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1', folder2_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

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

        # プロジェクトを作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {"label" : "I am project", "parent": root.uuid}, self.USER1)
        project1_uuid = project1['uuid']

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : project1_uuid,
            "label"    : "リモートフォルダ1",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER1)
        database_uuid = result['uuid']

        # ゴミ箱へほかす
        self.delete_uri(f'/api/v0/databases/{database_uuid}', self.USER1)

        # ラベル名を変更する
        data = {
            "label"    : "リモートフォルダ2",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "streamcat",
            'userId'  : "postgres",
            "password" : ""
        }
        self.put_uri(f'/api/v0/databases/{database_uuid}', data, self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{database_uuid}', {}, self.USER1)

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_then_return_flow(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {"label" : "I am project!", "parent": root.uuid}, self.USER1)
        project1_uuid = project1['uuid']
        project1 = self.factory.data.find_by_uuid(project1_uuid)

        # 参照先フレームを作成する
        import io
        frame1 = root.create_frame('CSV1', io.BytesIO(b''))
        frame1.save()

        # フローを作成する
        flow = project1.create_flow('サブフロー1', self.get_flow_with_source(frame1.uuid))
        flow.save()
        flow = self.factory.data.find_by_uuid(flow.uuid)

        # 作成を確定する
        self.factory.end()

        # 削除前にフローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow.uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローをゴミ箱へほかす
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)
            
        # フローを変更する
        data = {
            'flow' : flow.flow_data.to_json(),
            'label': 'フローです',
            'lock' : lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{flow.uuid}', data, self.USER1)

        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{flow.uuid}', {}, self.USER1)

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_then_return_frame(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {"label" : "I am project!!", "parent": root.uuid}, self.USER1)
        project1_uuid = project1['uuid']

        # フレーム1を作成する
        import io
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_AA', project1_uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # ゴミ箱へほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # ラベル名を変更する
        self.put_uri(f'/api/v0/frames/{frame_uuid_1}', {"label": '変更したラベル名'}, self.USER1)

        # ゴミ箱から戻す
        self.put_uri(f'/api/v0/trashes/{frame_uuid_1}', {}, self.USER1)

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_then_return_remote_folder(self):
        """
        ゴミ箱へほかした後にdata列を更新する操作を行っても
        prev_parent_id属性は変更されていこと
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する(POST /projects)
        # ファイルパスに空白が含まれていてもエラーにならないこと
        project1 = self.post_uri('/api/v0/projects', {"label" : "iPhone12 mini", "parent": root.uuid}, self.USER1)
        project1_uuid = project1['uuid']

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : project1_uuid,
            "label"    : "リモートフォルダ1",
            'protocol' : 'smb',
            'hostname' : "18.178.64.116",
            'domain'   : "WORKGROUP",
            'directory': "share",
            'userId'  : "samba",
            'password' : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)
        folder_uuid = result['uuid']

        # ゴミ箱へほかす
        self.delete_uri(f'/api/v0/remote-folders/{folder_uuid}', self.USER1)

        # リモートフォルダを変更する
        data = {
            "label"    : "リモートフォルダ2",
            'protocol' : 'smb',
            'hostname' : "18.178.64.116",
            'domain'   : "WORKGROUP",
            'directory': "share",
            'userId'  : "samba",
            'password' : "kskanalytics"
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
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root.uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # フレーム1をほかす
        self.delete_uri(f'/api/v0/frames/{frame_uuid_1}', self.USER1)

        # フレーム1を参照するフローを作成する
        flow = root.create_flow('フロー', self.get_flow_with_source(frame_uuid_1))
        with self.assertRaises(Exception):
            flow.save()

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
        f = io.BytesIO(b"abcdef")
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root.uuid, f, self.USER1)
        frame_uuid_1 = result['uuid']

        # サブフローを作成する
        subflow = root.create_flow('サブフロー', self.get_flow_with_source(frame_uuid_1))
        subflow.save()

        # 作成を確定する
        self.factory.end()

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':subflow.uuid}, self.USER1)
        lock_uuid = result['uuid']

        # サブフローをほかす
        self.delete_uri_with_json(f'/api/v0/flows/{subflow.uuid}', {'lock':lock_uuid}, self.USER1)
            
        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

        # サブフローを参照するフローを作成する
        from streamcat.store import FlowData
        flow = root.create_flow('フロー', FlowData(self.get_flow_with_subflow(subflow.uuid)))
        with self.assertRaises(Exception):
            flow.save()

        # ゴミ箱を空にする
        trash_can = self.factory.data.load_trash_folder()
        self.delete_uri('/api/v0/trashes', self.USER1)
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)     
