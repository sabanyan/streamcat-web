from .api_test_case_base import ApiTestCaseBase

class DatasrcsTest(ApiTestCaseBase):

    def test_datasrcs(self):
        """
        データソース一覧取得のテスト
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['data']['uuid']

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : project_uuid,
            "label"    : "データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            "user_id"  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER2)
        database_uuid = result['data']['uuid']

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : project_uuid,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER2)
        rfolder_uuid = result['data']['uuid']

        # データソースの一覧を取得する
        results = self.get_uri('/api/v0/datasrcs', self.USER2)

        # ライブラリデータソースを検証する
        expected_params = [
            {
                "name": "uuid",
                "type": "frame",
                "label": "ファイルを指定する",
                "optional": False
            }
        ]
        expected_ports = [
            [],
            [
                {
                    "label": "o",
                    "nodeId": "d",
                    "type": "frame"
                }
            ]
        ]
        expected_nodes = [
            {
                "id": "s",
                "label": "ライブラリ",
                "type": "store",
                "uuid": root.uuid
            },
            {
                "id": "c1",
                "label": "c1",
                "type": "command",
                "commandId": "loader",
                "args": {
                    "uuid": "@[uuid]"
                },
                "srcs": {
                    "folder": "s"
                },
                "dsts": {
                    "o": "d"
                }
            },
            {
                "id": "d",
                "label": "d",
                "type": "frame",
                "dataSource": "csv"
            }
        ]
        self.assertEqual(results['data'][0]['label'], 'ライブラリ')
        self.assertListEqual(results['data'][0]['params'], expected_params)
        self.assertListEqual(results['data'][0]['ports'], expected_ports)
        self.assertEqual(results['data'][0]['flow']['label'], 'ライブラリ')
        self.assertListEqual(results['data'][0]['flow']['params'], expected_params)
        self.assertListEqual(results['data'][0]['flow']['ports'], expected_ports)
        self.assertListEqual(results['data'][0]['flow']['nodes'], expected_nodes)

        # DBデータソースを検証する
        expected_params = [
            {
                "name": "schema",
                "type": "string",
                "label": "スキーマ名を指定する",
                "optional": True
            },
            {
                "name": "table",
                "type": "string",
                "label": "テーブル名を指定する",
                "optional": False
            }
        ]
        expected_ports = [
            [],
            [
                {
                    "label": "o",
                    "nodeId": "d",
                    "type": "frame"
                }
            ]
        ]
        expected_nodes = [
            {
                "id": "s",
                "label": "データベース",
                "type": "store",
                "uuid": database_uuid
            },
            {
                "id": "c1",
                "label": "c1",
                "type": "command",
                "commandId": "db_loader",
                "args": {
                    "schema": "@[schema]",
                    "table": "@[table]"
                },
                "srcs": {
                    "i": "s"
                },
                "dsts": {
                    "o": "d"
                }
            },
            {
                "id": "d",
                "label": "d",
                "type": "frame",
                "dataSource": "csv"
            }
        ]
        self.assertEqual(results['data'][1]['label'], 'データベース')
        self.assertListEqual(results['data'][1]['params'], expected_params)
        self.assertListEqual(results['data'][1]['ports'], expected_ports)
        self.assertEqual(results['data'][1]['flow']['label'], 'データベース')
        self.assertListEqual(results['data'][1]['flow']['params'], expected_params)
        self.assertListEqual(results['data'][1]['flow']['ports'], expected_ports)
        self.assertListEqual(results['data'][1]['flow']['nodes'], expected_nodes)

        # リモートフォルダデータソースを検証する
        expected_params = [
            {
                "name": "filePath",
                "type": "string",
                "label": "ファイルパスを指定する",
                "optional": False
            }
        ]
        expected_ports = [
            [],
            [
                {
                    "label": "o",
                    "nodeId": "d",
                    "type": "frame"
                }
            ]
        ]
        expected_nodes = [
            {
                "id": "s",
                "label": "リモートフォルダ",
                "type": "store",
                "uuid": rfolder_uuid
            },
            {
                "id": "c1",
                "label": "c1",
                "type": "command",
                "commandId": "remotefolder_loader",
                "args": {
                    "file_path": "@[filePath]"
                },
                "srcs": {
                    "i": "s"
                },
                "dsts": {
                    "o": "d"
                }
            },
            {
                "id": "d",
                "label": "d",
                "type": "frame",
                "dataSource": "csv"
            }
        ]
        self.assertEqual(results['data'][2]['label'], 'リモートフォルダ')
        self.assertListEqual(results['data'][2]['params'], expected_params)
        self.assertListEqual(results['data'][2]['ports'], expected_ports)
        self.assertEqual(results['data'][2]['flow']['label'], 'リモートフォルダ')
        self.assertListEqual(results['data'][2]['flow']['params'], expected_params)
        self.assertListEqual(results['data'][2]['flow']['ports'], expected_ports)
        self.assertListEqual(results['data'][2]['flow']['nodes'], expected_nodes)

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        # (RemoteFolderを削除(unmount)する)
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_datadsts(self):
        """
        データデスト一覧取得のテスト
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['data']['uuid']

        # Databaseを作成する(POST /databases)
        data = {
            "parent"   : project_uuid,
            "label"    : "データベース",
            "dbms"     : "postgresql",
            "hostname" : "db",
            "port"     : 5432,
            "database" : "kskp",
            "user_id"  : "postgres",
            "password" : ""
        }
        result = self.post_uri('/api/v0/databases', data, self.USER2)
        database_uuid = result['data']['uuid']

        # RemoteFolderを作成する(POST /remote-folders)
        data = {
            "parent"   : project_uuid,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER2)
        rfolder_uuid = result['data']['uuid']

        # データデストの一覧を取得する
        results = self.get_uri('/api/v0/datadsts', self.USER2)

        # ライブラリデータデストを検証する
        expected_params = []
        expected_ports = [
            [
                {
                    "label": "i",
                    "nodeId": "d",
                    "type": "frame"
                }
            ],
            []
        ]
        expected_nodes = [
            {
                "id": "d",
                "label": "d",
                "type": "frame",
                "dataSource": "csv"
            },
            {
                "id": "s",
                "label": "ライブラリ",
                "type": "store",
                "uuid": root.uuid
            },
            {
                "id": "c1",
                "label": "c1",
                "type": "command",
                "commandId": "saver",
                "args": {},
                "srcs": {
                    "i": "d",
                    "folder": "s"
                },
                "dsts": {
                    "o": "d1"
                }
            },
            {
                "id": "d1",
                "label": "d1",
                "type": "frame",
                "dataSource": "csv"
            }
        ]
        self.assertEqual(results['data'][0]['label'], 'ライブラリ')
        self.assertListEqual(results['data'][0]['params'], expected_params)
        self.assertListEqual(results['data'][0]['ports'], expected_ports)
        self.assertEqual(results['data'][0]['flow']['label'], 'ライブラリ')
        self.assertListEqual(results['data'][0]['flow']['params'], expected_params)
        self.assertListEqual(results['data'][0]['flow']['ports'], expected_ports)
        self.assertListEqual(results['data'][0]['flow']['nodes'], expected_nodes)

        # DBデータデストを検証する
        expected_params = [
            {
                "name": "schema",
                "type": "string",
                "label": "スキーマ名を指定する",
                "optional": True
            },
            {
                "name": "table",
                "type": "string",
                "label": "テーブル名を指定する",
                "optional": False
            }
        ]
        expected_ports = [
            [
                {
                    "label": "i",
                    "nodeId": "d",
                    "type": "frame"
                }
            ],
            []
        ]
        expected_nodes = [
            {
                "id": "d",
                "label": "d",
                "type": "frame",
                "dataSource": "csv"
            },
            {
                "id": "s",
                "label": "データベース",
                "type": "store",
                "uuid": database_uuid
            },
            {
                "id": "c1",
                "label": "c1",
                "type": "command",
                "commandId": "db_saver",
                "args": {
                    "schema": "@[schema]",
                    "table": "@[table]"
                },
                "srcs": {
                    "i": "d",
                    "store": "s"
                },
                "dsts": {
                    "o": "d1"
                }
            },
            {
                "id": "d1",
                "label": "d1",
                "type": "frame",
                "dataSource": "csv"
            }
        ]
        self.assertEqual(results['data'][1]['label'], 'データベース')
        self.assertListEqual(results['data'][1]['params'], expected_params)
        self.assertListEqual(results['data'][1]['ports'], expected_ports)
        self.assertEqual(results['data'][1]['flow']['label'], 'データベース')
        self.assertListEqual(results['data'][1]['flow']['params'], expected_params)
        self.assertListEqual(results['data'][1]['flow']['ports'], expected_ports)
        self.assertListEqual(results['data'][1]['flow']['nodes'], expected_nodes)

        # リモートフォルダデータデストを検証する
        expected_params = [
            {
                "name": "dirPath",
                "type": "string",
                "label": "フォルダパスを指定する",
                "optional": False
            }
        ]
        expected_ports = [
            [
                {
                    "label": "i",
                    "nodeId": "d",
                    "type": "frame"
                }
            ],
            []
        ]
        expected_nodes = [
            {
                "id": "d",
                "label": "d",
                "type": "frame",
                "dataSource": "csv"
            },
            {
                "id": "s",
                "label": "リモートフォルダ",
                "type": "store",
                "uuid": rfolder_uuid
            },
            {
                "id": "c1",
                "label": "c1",
                "type": "command",
                "commandId": "remotefolder_saver",
                "args": {
                    "dir_path": "@[dirPath]"
                },
                "srcs": {
                    "i": "d",
                    "store": "s"
                },
                "dsts": {
                    "o": "d1"
                }
            },
            {
                "id": "d1",
                "label": "d1",
                "type": "frame",
                "dataSource": "csv"
            }
        ]
        self.assertEqual(results['data'][2]['label'], 'リモートフォルダ')
        self.assertListEqual(results['data'][2]['params'], expected_params)
        self.assertListEqual(results['data'][2]['ports'], expected_ports)
        self.assertEqual(results['data'][2]['flow']['label'], 'リモートフォルダ')
        self.assertListEqual(results['data'][2]['flow']['params'], expected_params)
        self.assertListEqual(results['data'][2]['flow']['ports'], expected_ports)
        self.assertListEqual(results['data'][2]['flow']['nodes'], expected_nodes)

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        # (RemoteFolderを削除(unmount)する)
        self.delete_uri('/api/v0/trashes', self.USER1)

