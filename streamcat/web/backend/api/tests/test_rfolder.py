import unittest
import pprint
from .api_test_case_base import ApiTestCaseBase

class RemoteFolderTestCase(ApiTestCaseBase):

    def test_create_get_folders(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            'userId'  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)

        # POST /remote-foldersの戻り値が正しいことを検証する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'rfolder')
        self.assertEqual(result['label'], 'リモートフォルダ')
        self.assertEqual(result['protocol'], 'smb')
        self.assertEqual(result['hostname'], '18.178.64.116')
        self.assertEqual(result['domain'], 'WORKGROUP')
        self.assertEqual(result['directory'], 'share')
        self.assertEqual(result['userId'], 'samba')
        self.assertEqual(result['password'], 'kskanalytics')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        folder_uuid = result['uuid']

        # RemoteFolderを取得する(GET /remote-folders)
        result = self.get_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # GET /remote-foldersの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], folder_uuid)
        self.assertEqual(result['type'], 'rfolder')
        self.assertEqual(result['label'], 'リモートフォルダ')
        self.assertEqual(result['protocol'], 'smb')
        self.assertEqual(result['hostname'], '18.178.64.116')
        self.assertEqual(result['domain'], 'WORKGROUP')
        self.assertEqual(result['directory'], 'share')
        self.assertEqual(result['userId'], 'samba')
        self.assertEqual(result['password'], 'kskanalytics')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # RemoteFolderをほかす(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # フォルダはゴミ箱に移動していること
        folder = self.factory.data.find_by_uuid(folder_uuid)
        self.assertEqual(folder.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

        # RemoteFolderを削除(unmount)する
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_label(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        
        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ!",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            'userId'  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)

        folder_uuid = result['uuid']

        # RemoteFolderのラベルを更新する(PUT /remote-folders)
        update_data = {
            "label"    : "リモートフォルダ!?"
        }
        result = self.put_uri('/api/v0/remote-folders/' + folder_uuid, update_data, self.USER1)

        # PUT /remote-foldersの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], folder_uuid)
        self.assertEqual(result['type'], 'rfolder')
        self.assertEqual(result['label'], 'リモートフォルダ!?')
        self.assertEqual(result['protocol'], 'smb')
        self.assertEqual(result['hostname'], '18.178.64.116')
        self.assertEqual(result['domain'], 'WORKGROUP')
        self.assertEqual(result['directory'], 'share')
        self.assertEqual(result['userId'], 'samba')
        self.assertEqual(result['password'], 'kskanalytics')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

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
        
        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root_uuid,
            "label"    : "リモートフォルダ!",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            'userId'  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)

        folder_uuid = result['uuid']

        # RemoteFolderのラベルを更新する(PUT /remote-folders)
        update_data = {
            "label"    : "リモートフォルダ!?",
            "protocol" : "smb",
            "hostname" : "192.168.0.5",
            "domain"   : "MyDomain2",
            "directory": "share2",
            'userId'  : "user2",
            "password" : ""
        }
        result = self.put_uri('/api/v0/remote-folders/' + folder_uuid, update_data, self.USER1)

        # PUT /remote-foldersの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], folder_uuid)
        self.assertEqual(result['type'], 'rfolder')
        self.assertEqual(result['label'], 'リモートフォルダ!?')
        self.assertEqual(result['protocol'], 'smb')
        self.assertEqual(result['hostname'], '192.168.0.5')
        self.assertEqual(result['domain'], 'MyDomain2')
        self.assertEqual(result['directory'], 'share2')
        self.assertEqual(result['userId'], 'user2')
        self.assertEqual(result['password'], '')
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

        # RemoteFolderをほかす(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # フォルダはゴミ箱に移動していること
        folder = self.factory.data.find_by_uuid(folder_uuid)
        self.assertEqual(folder.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

        # RemoteFolderを削除(unmount)する
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_move_folders(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1C", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['uuid']

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : root.uuid,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            'userId'  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)
        folder_uuid = result['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri(f'/api/v0/remote-folders/{folder_uuid}', {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            'userId'  : "samba",
            "password" : "kskanalytics",
            "type"     : "rfolder"
        }

        # PUT /remote-folders apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['uuid'], folder_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['protocol'], expected_result['protocol'])
        self.assertEqual(result['hostname'], expected_result['hostname'])
        self.assertEqual(result['domain'], expected_result['domain'])
        self.assertEqual(result['directory'], expected_result['directory'])
        self.assertEqual(result['userId'], expected_result['userId'])
        self.assertEqual(result['password'], expected_result['password'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], self.USER1.name)
        self.assertNotEqual(result['createdAt'], None)

        # RemoteFolderをほかす(DELETE /remote-folders)
        self.delete_uri('/api/v0/remote-folders/' + folder_uuid, self.USER1)

        # フォルダはゴミ箱に移動していること
        folder = self.factory.data.find_by_uuid(folder_uuid)
        self.assertEqual(folder.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

        # RemoteFolderを削除(unmount)する
        self.delete_uri('/api/v0/trashes', self.USER1)
