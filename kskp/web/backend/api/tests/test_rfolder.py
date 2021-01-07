import unittest
import pprint
from .api_test_case_base import ApiTestCaseBase

# 
# テスト実行時にmountコマンドの実行に必要なPasswordが聞かれます
# 
@unittest.skip
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
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
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
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
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
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
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

