import copy
import unittest
from streamcat.core import SavableDatum
from streamcat.store import DatabaseConn
from .api_test_case_base import ApiTestCaseBase

class FrameTest(ApiTestCaseBase):
    """
    実行以外のFramesAPIのテストを行う
    """
    conn_json = {
      'dbms'     : "postgresql",
      'hostname' : "db", 
      'port'     : 5432, 
      'database' : "streamcat", 
      'userId'  : "streamcat", 
      'password' : 'ZQZtVgL6G32Vy6p6WJtG3C3K84yuJ4zz'
    }
    database_conn = DatabaseConn(conn_json)

    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()
        self.root = self.finder.data.load_root()
        self.root_path = self.root.path
        # テスト用のフロー
        self.flow_json = {
            "label": "テストフロ",
            "params": [],
            "description": "",
            "ports": [
                [],
                [
                    {
                    "type": "frame", 
                    "label": "d1", 
                    "nodeId": "d1"
                    }
                ]
            ],
            "nodes": [
                {
                    "type": "frame",
                    "id": "d1",
                    "label": "出力結果",
                    "uuid": None,
                    "dataSource": "csv"
                },
                {
                    "type": "command",
                    "id": "c1",
                    "label": "c1",
                    "srcs": {
                        "i": "i"
                    },
                    "dsts": {
                        "o": "d1"
                    },
                    "args": {
                        "f": "0,1",
                        "x": True
                    },
                    "commandId": "mcut"
                },
                {
                    "id": 'o0', 
                    "label": "ライブラリ出力🖨", 
                    "type": "flow", 
                    "classification": "data_dest",
                    "srcs": {
                        "i": 'd1'
                    },
                    "dsts": {}, 
                    "uuid": self.data_dst.uuid
                }
            ]
        }
    
    def save_flow(self, parent, label, flow_json):
        from streamcat.store import FlowData
        new_flow = parent.create_flow(label, FlowData(flow_json))
        new_flow.save()
        # 作成を確定する
        self.finder.end()
        # save()によりreadable=Noneになるため再取得する
        return new_flow.reload()

    # @unittest.skip
    def test_fetch_frame(self):
        """
        fetch_frame APIをテストする
        """
        from datetime import datetime

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER1)

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.assertEqual(result['fileSize'], 56)
        self.assertEqual(result['encoding'], 'UTF-8')
        self.assertEqual(result['newline'], 'LF')
        self.assertEqual(result['createdAt'], now)

        # contents引数の指定がないのでargsとcontentsは返されない
        self.assertIsNone(result.get('args'))
        self.assertIsNone(result.get('contents'))

    # @unittest.skip
    def test_fetch_frame_with_contents(self):
        """
        fetch_frame APIをテストする
        contents引数をつける
        """
        from datetime import datetime

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        result = self.get_uri(f'/api/v0/frames/{frame_uuid}?contents=on', self.USER1)

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.assertEqual(result['encoding'], 'UTF-8')
        self.assertEqual(result['newline'], 'LF')
        self.assertEqual(result['fileSize'], 56)
        # contentsを取得する処理にかかる時間により、createdAtとnowは1秒程度の差が出る場合がある
        self.assertLessEqual(result['createdAt'], now)

        self.assertIsNotNone(result.get('args'))
        self.assertIsNotNone(result.get('contents'))
        self.assertEqual(result['args']['column_names'], ['顧客','数量','金額'])
        self.assertTrue(result['contents'].startswith('<!DOCTYPE html>'))

    # @unittest.skip
    def test_fetch_frame_offset_and_limit(self):
        """
        fetch_frame APIをテストする
        offsetとlimitをつける
        """
        from datetime import datetime

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        result = self.get_uri('/api/v0/frames/%s?offset=2&limit=1' % frame_uuid, self.USER1)

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.assertEqual(result['fileSize'], 56)
        self.assertEqual(result['encoding'], 'UTF-8')
        self.assertEqual(result['newline'], 'LF')
        self.assertEqual(result['createdAt'], now)


    # @unittest.skip
    def test_fetch_frame_header_only(self):
        """
        fetch_frame APIをテストする
        header_onlyをつける
        """
        from datetime import datetime

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        result = self.get_uri('/api/v0/frames/%s?header_only=1' % frame_uuid, self.USER1)

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.assertEqual(result['fileSize'], 56)
        self.assertEqual(result['encoding'], 'UTF-8')
        self.assertEqual(result['newline'], 'LF')
        self.assertEqual(result['createdAt'], now)


    # @unittest.skip
    def test_update_frame(self):
        """
        update_frame APIをテストする
        """
        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        data = {
            'label': '変更後'
        }
        self.put_uri('/api/v0/frames/%s' % frame_uuid, data, self.USER1)

        frame = self.finder.data.find_by_uuid(frame_uuid)
        # data列にラベルがあるらしい、requestのjsonがそのまま入っているのでjson.loadsする
        self.assertEqual(frame.label, '変更後')
        self.assertEqual(frame.modifier, self.USER1)


    # @unittest.skip
    def test_delete_frame(self):
        """
        delete_frame APIをテストする
        """
        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)
        frame_label = self.finder.data.find_by_uuid(frame_uuid).label

        result = self.delete_uri('/api/v0/frames/%s' % frame_uuid, self.USER1)

        # ゴミ箱のUUID
        trash_folder_uuid = self.finder.data.load_trash_folder().uuid

        # APIの返り値を検証する
        self.assertEqual(result['uuid'], frame_uuid)
        self.assertEqual(result['type'], 'frame')
        self.assertEqual(result['label'], frame_label)
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], trash_folder_uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['fileSize'], 56)
        self.assertEqual(result['encoding'], 'UTF-8')
        self.assertEqual(result['newline'], 'LF')
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # ゴミ箱に移動しているかのテスト
        frame = self.finder.data.find_by_uuid(frame_uuid)
        self.assertEqual(frame.find_parent().uuid, trash_folder_uuid)

    def test_duplicate_frame(self):
        """
        フレームを複製できること
        """
        # ルートを取得する
        root = self.finder.data.load_root()

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"abcdef")

        # Frameを作成する(POST /frames)
        result = self.post_frames('新しいフレームファイル!', root.uuid, f, self.USER1)
        frame_uuid = result['uuid']

        # Frameを複製する(POST /frames)
        result = self.post_uri(f'/api/v0/frames', {'source':frame_uuid}, self.USER1)

        # APIの返り値を検証する
        self.assertNotEqual(result['uuid'], frame_uuid)
        self.assertEqual(result['type'], 'frame')
        self.assertEqual(result['label'], '新しいフレームファイル! のコピー')
        self.assertEqual(result['folderPath'], '/ライブラリ')
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['fileSize'], 6)
        self.assertEqual(result['encoding'], 'ASCII')
        self.assertEqual(result['newline'], 'UNKNOWN')
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # Frameを削除する
        result = self.delete_uri(f'/api/v0/frames/{result["uuid"]}', self.USER1)
        result = self.delete_uri(f'/api/v0/frames/{frame_uuid}', self.USER1)


    # ここからフローの実行テスト
    """
    実行のFramesAPIをテストする
    """

    # @unittest.skip
    def test_flow_execute(self):
        """
        フロー実行のテスト
        APIを投げてresultがちゃんと意図した要素を含んでいるかのテスト
        生成されたframeの中身は見ていない（実行結果の内容が正しいかはengine側のテストに書いている）

        フロー：i -> c1 -> d1
        """
        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ1",
          "uuid": frame_uuid,
          "dataSource": "csv"
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['nodes'].append(input_node)
        flow = self.save_flow(self.root, 'test', flow_json)

        # フローの実行
        result = self.post_uri('/api/v0/activities', {'uuid':flow.uuid}, self.USER1)
        data = result

        # DBにframeデータが生成されているか
        self.assertIsNotNone(self.finder.data.find_by_uuid(data['outs'][0]['datum']))

        # ラベルとIDチェック
        self.assertEqual(data['outs'][0]['id'], 'd1')
        self.assertEqual(data['outs'][0]['label'], '出力結果')

    def test_empty_flow_execute(self):
        """
        結果を出力しないフローを実行しても例外は送出されないこと
        """
        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':self.root.uuid, 'label':'すっからかん'}, self.USER2)
        project_uuid = result['uuid']

        # プロジェクト下に空のフローを作成する
        result = self.post_uri('/api/v0/flows', {'parent':project_uuid, 'label':'空のフロー', 'flow':{}}, self.USER2)
        flow_uuid = result['uuid']

        # 空のフローを実行する
        result = self.post_uri(f'/api/v0/activities', {'uuid':flow_uuid}, self.USER2)
        outs = result['outs']

        # POST /activitiesの結果を検証する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(len(outs), 0)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

    # @unittest.skip
    def test_flow_vis(self):
        """
        フローをVis実行する
                        　↓Vis
        フロー：i -> c1 -> d1 -> c2 -> d2
        """
        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ2",
          "uuid": frame_uuid,
          "dataSource": "csv"
        }

        add_cmd = {
          "type": "command",
          "id": "c2",
          "label": "c2",
          "srcs": {
            "i": "d1"
          },
          "dsts": {
            "o": "d2"
          },
          "args": {
            "f": "顧客",
            "v": "A"
          },
          "commandId": "mselstr"
        }

        add_datum = {
          "type": "frame",
          "id": "d2",
          "label": "d2",
          "uuid": None,
          "dataSource": "csv"
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['nodes'].append(input_node)
        flow_json['nodes'].append(add_cmd)
        flow_json['nodes'].append(add_datum)
        flow = self.save_flow(self.root, 'test', flow_json)
        
        # フローの実行
        vis_args = {"uuid": flow.uuid,
                    "args": {"use_cache": True,
                             "vis": {
                                "d1": {
                                    "command_id": "csvtohtmltable",
                                    "args": {
                                        "offset": 0,
                                        "limit": 100
                                    }
                                }
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER1)
        outs = result['outs']

        # ラベルとIDチェック
        self.assertEqual(outs[0]['id'], 'd1')
        self.assertEqual(outs[0]['args']['column_names'], ['顧客', '数量'])
        self.assertIsNotNone(outs[0].get('contents'))

    # @unittest.skip
    def test_empty_vizs(self):
        """
        offset=limit=0を指定してヘッダ行だけを取得する
        """
        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data_3.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ5",
          "uuid": frame_uuid,
          "dataSource": "csv"
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['nodes'].append(input_node)
        flow = self.save_flow(self.root, 'test', flow_json)
        # Visデータのポイント引数の作成
        vis_args = {"uuid": flow.uuid,
                    "args": {"use_cache": True,
                             "vis": {
                                "d1": {
                                    "command_id": "csvtohtmltable",
                                    "args": {
                                        "offset": 0,
                                        "limit": 0
                                    }
                                }
                            }
                        }
                    }
        # Visの取得
        result = self.post_uri(f'/api/v0/activities', vis_args, self.USER1)
        outs = result['outs']

        # ラベルとIDチェック
        self.assertEqual(outs[0]['id'], 'd1')
        self.assertEqual(outs[0]['args']['column_names'], ['顧客', '数量'])
        self.assertIsNotNone(outs[0].get('contents'))

    # @unittest.skip
    def test_bad_csv_vizs(self):
        """
        不正なCSVをVis実行する
        """
        # テストフレーム作成
        csv_data = [
            ['顧客', None, '顧客'],
            ['A', 1],
            ['A', 2, 20],
            ['B', 1],
            [ 0, '3', 40],
            ['B', 1, 50]
        ]
        frame_path = self.root_path / 'test_data_4.csv'
        frame_uuid = self.create_data(frame_path, csv_data)

        # Visの取得
        result = self.get_uri(f'/api/v0/frames/{frame_uuid}?contents=on', self.USER1)

        # ラベルとIDチェック
        self.assertIsNotNone(result.get('args'))
        self.assertIsNotNone(result.get('contents'))
        self.assertEqual(result['args']['column_names'], ['顧客','','顧客'])
        self.assertTrue(result['contents'].startswith('<!DOCTYPE html>'))

    def test_get_activity(self):
        """
        GET /activities でActivityを取得できること
        """
        # ROOTを取得する
        root = self.finder.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'☀️'}, self.USER2)
        project_uuid = result['uuid']
        project_modified_at = result['modifiedAt']

        # プロジェクト管理者は、プロジェクト内にフローを作成する
        flow_json = {
            "label": "⛅️", 
            "nodes": [
                {
                    "id": "d", 
                    "type": "frame", 
                    "label": "d", 
                    "dataSource": "csv"
                }, 
                {
                    "id": "c", 
                    "args": {
                        "I": "1", 
                        "S": "1", 
                        "a": "a", 
                        "l": "10"
                    }, 
                    "dsts": {
                        "o": "d"
                    }, 
                    "srcs": {}, 
                    "type": "command", 
                    "label": "c", 
                    "commandId": "mnewnumber"
                }, 
                {
                    "id": "o", 
                    "label": "ライブラリ", 
                    "type": "flow", 
                    "classification": "data_dest",
                    "args": {}, 
                    "srcs": {
                        "i": "d"
                    }, 
                    "dsts": {}, 
                    "flow": {
                        "label": "ライブラリ", 
                        "nodes": [
                            {
                                "id": "d", 
                                "type": "frame", 
                                "label": "d", 
                                "dataSource": "csv"
                            }, 
                            {
                                "id": "s", 
                                "type": "store", 
                                "uuid": project_uuid, 
                                "label": "ライブラリ"
                            }, 
                            {
                                "id": "c1", 
                                "args": {}, 
                                "dsts": {
                                    "o": "d1"
                                }, 
                                "srcs": {
                                    "i": "d", 
                                    "folder": "s"
                                }, 
                                "type": "command", 
                                "label": "c1", 
                                "commandId": "saver"
                            }, 
                            {
                                "id": "d1", 
                                "type": "frame", 
                                "label": "d1", 
                                "dataSource": "csv"
                            }
                        ], 
                        "ports": [
                            [
                                {
                                "type": "frame", 
                                "label": "i", 
                                "nodeId": "d"
                                }
                            ], 
                            []
                        ], 
                        "params": [], 
                        "creator": "", 
                        "createdAt": "2021-09-09 16:26:57",
                        "description": ""
                    }
                }
            ], 
            "ports": [
                [], 
                [
                    {
                        "type": "frame", 
                        "label": "d", 
                        "nodeId": "d"
                    }
                ]
            ], 
            "params": [], 
            "creator": "システム管理者", 
            "createdAt": "2021-09-09 10:31:41",
            "description": ""
        }
        data = {
            'parent': project_uuid,
            'label': '☔️',
            'flow': flow_json
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)
        flow_uuid = result['uuid']

        # USER3をメンバに参加させる
        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Owner'},
                        {'uuid' : self.USER3.uuid, 'type': 'Reader'}],
            'lastModifiedAt' : project_modified_at
        }
        result = self.put_uri(f'/api/v0/projects/{project_uuid}', data, self.USER2)

        # フローを実行する
        result = self.post_uri(f'/api/v0/activities', {'uuid':flow_uuid}, self.USER2)
        activity_uuid = result['uuid']

        # プロジェクトのメンバは、Activityを参照できること
        result = self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER2)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['label'], '☔️')
        self.assertEqual(result['type'], SavableDatum.ACTIVITY_TYPE)
        result = self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER3)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['label'], '☔️')
        self.assertEqual(result['type'], SavableDatum.ACTIVITY_TYPE)

        # ユーザ管理者は、Activityを参照できること
        result = self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER1)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['label'], '☔️')
        self.assertEqual(result['type'], SavableDatum.ACTIVITY_TYPE)

        # プロジェクトのメンバ以外は、Activityを参照できないこと
        with self.assertRaises(AssertionError):
            self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER0)

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

    def test_activity_with_flow(self):
        """
        POST /activities でflow属性にフローリテラルを指定して実行できること
        """
        flow_json = {
            "label": "私のフロー", 
            "nodes": [
                {
                    "id": "d", 
                    "type": "frame", 
                    "label": "d", 
                    "dataSource": "csv"
                }, 
                {
                    "id": "c", 
                    "args": {
                        "I": "1", 
                        "S": "1", 
                        "a": "id", 
                        "l": "10"
                    }, 
                    "dsts": {
                        "o": "d"
                    }, 
                    "srcs": {}, 
                    "type": "command", 
                    "label": "c", 
                    "commandId": "mnewnumber"
                }
            ], 
            "ports": [
                [], 
                [
                    {
                        "type": "frame", 
                        "label": "d", 
                        "nodeId": "d"
                    }
                ]
            ], 
            "params": [], 
            "creator": "ユーザー管理者", 
            "createdAt": "2021-04-28 11:11:05",
            "description": ""
        }

        # 'vis'を指定してプレビュー実行する
        args = {
            "use_cache": True,
            "vis": {
                "d": {
                    "command_id": "csvtohtmltable",
                    "args": {
                        "offset": 0,
                        "limit": 100
                    }
                }
            }
        }

        # POST /activitiesを発行する
        result = self.post_uri(f'/api/v0/activities', {'flow':flow_json,'args':args}, self.USER1)
        outs = result['outs']

        # POST /activitiesの結果を検証する
        self.assertIsNotNone(result['uuid'])
        # self.assertEqual(result['type'], Datum.ACTIVITY_TYPE)
        # self.assertEqual(result['label'], 'FLOW_LITERAL')
        self.assertEqual(len(outs), 1)
        self.assertEqual(outs[0]['id'], 'd')
        self.assertEqual(outs[0]['label'], 'd')
        self.assertIsNotNone(outs[0]['datum'])
        self.assertIsNone(outs[0]['parent'])
        self.assertEqual(outs[0]['args']['column_names'], ['id'])
        self.assertIsNotNone(outs[0].get('contents'))

    def test_activity_with_uuid(self):
        """
        POST /activities でflow属性にフローのUUIDを指定して実行できること
        """
        flow_json = {
            "label": "私のフロー", 
            "nodes": [
                {
                    "id": "d", 
                    "type": "frame", 
                    "label": "d", 
                    "dataSource": "csv"
                }, 
                {
                    "id": "c", 
                    "args": {
                        "I": "1", 
                        "S": "1", 
                        "a": "id", 
                        "l": "10"
                    }, 
                    "dsts": {
                        "o": "d"
                    }, 
                    "srcs": {}, 
                    "type": "command", 
                    "label": "c", 
                    "commandId": "mnewnumber"
                }
            ], 
            "ports": [
                [], 
                [
                    {
                        "type": "frame", 
                        "label": "d", 
                        "nodeId": "d"
                    }
                ]
            ], 
            "params": [], 
            "creator": "ユーザー管理者", 
            "createdAt": "2021-04-28 11:11:05",
            "description": ""
        }

        # フローを作成する
        flow = self.save_flow(self.root, 'それにつけてもおやつはカール', flow_json)

        # 'vis'を指定してプレビュー実行する
        args = {
            "use_cache": True,
            "vis": {
                "d": {
                    "command_id": "csvtohtmltable",
                    "args": {
                        "offset": 0,
                        "limit": 100
                    }
                }
            }
        }

        # POST /activitiesを発行する
        result = self.post_uri(f'/api/v0/activities', {'uuid':flow.uuid,'args':args}, self.USER1)
        outs = result['outs']

        # POST /activitiesの結果を検証する
        self.assertIsNotNone(result['uuid'])
        # self.assertEqual(result['type'], Datum.ACTIVITY_TYPE)
        # self.assertEqual(result['label'], 'それにつけてもおやつはカール')
        self.assertEqual(len(outs), 1)
        self.assertEqual(outs[0]['id'], 'd')
        self.assertEqual(outs[0]['label'], 'd')
        self.assertIsNotNone(outs[0]['datum'])
        self.assertIsNone(outs[0]['parent'])
        self.assertEqual(outs[0]['args']['column_names'], ['id'])
        self.assertIsNotNone(outs[0].get('contents'))

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow.uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)

        # フローのロックを解除する
        result = self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

    def test_activity_with_lock(self):
        """
        POST /activities でlock属性の指定でキャッシュが作成できること
        """
        # キャッシュを出力するフロー
        flow_json = {
            "label": "私のフロー",
            "nodes": [
                {
                    "id": "c",
                    "label": "c",
                    "type": "command",
                    "commandId": "mnewnumber",
                    "args": {
                        "I": "1",
                        "S": "1",
                        "a": "id",
                        "l": "10"
                    },
                    "srcs": {},
                    "dsts": {
                        "o": "d"
                    }
                },
                {
                    "id": "d",
                    "label": "d",
                    "type": "frame",
                    "dataSource": "csv"
                },
                {
                    "id": "c1",
                    "label": "c1",
                    "type": "command",
                    "commandId": "mcal",
                    "args": {
                        "a": "amount",
                        "c": "#{id}+${id}",
                        "precision": 10
                    },
                    "srcs": {
                        "i": "d"
                    },
                    "dsts": {
                        "o": "d1"
                    }
                },
                {
                    "id": "d1",
                    "label": "d1",
                    "type": "frame",
                    "makeCache": True,
                    "dataSource": "csv"
                },
                {
                    "id": "c2",
                    "label": "c2",
                    "type": "command",
                    "commandId": "mnumber",
                    "args": {
                        "I": "1",
                        "S": "1",
                        "a": "seq",
                        "e": "seq",
                        "s": "id%n"
                    },
                    "srcs": {
                        "i": "d1"
                    },
                    "dsts": {
                        "o": "d2"
                    }
                },
                {
                    "id": "d2",
                    "label": "d2",
                    "type": "frame",
                    "dataSource": "csv"
                }
            ],
            "ports": [
                [],
                [
                    {
                        "type": "frame",
                        "label": "d",
                        "nodeId": "d"
                    }
                ]
            ],
            "params": [],
            "creator": "ユーザー管理者",
            "createdAt": "2021-04-28 11:11:05",
            "description": ""
        }

        # フローを作成する
        flow = self.save_flow(self.root, 'Have a KitKat!', flow_json)

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow.uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フロー実行前のキャッシュファイル数を数えておく
        results = self.get_uri(f'/api/v0/folders/{SavableDatum.CACHE_FOLDER_UUID}', self.USER1)
        len_caches1 = len(results['children'])

        # 'vis'を指定してプレビュー実行する
        args = {
            "use_cache": True,
            "vis": {
                "d2": {
                    "command_id": "csvtohtmltable",
                    "args": {
                        "offset": 0,
                        "limit": 100
                    }
                }
            }
        }

        # POST /activitiesを発行する
        result = self.post_uri(f'/api/v0/activities', {'uuid':flow.uuid,'args':args,'lock':lock_uuid}, self.USER1)
        outs = result['outs']

        # POST /activitiesの結果を検証する
        self.assertIsNotNone(result['uuid'])
        # self.assertEqual(result['type'], Datum.ACTIVITY_TYPE)
        # self.assertEqual(result['label'], 'Have a KitKat!')
        self.assertEqual(len(outs), 1)
        self.assertEqual(outs[0]['id'], 'd2')
        self.assertEqual(outs[0]['label'], 'd2')
        self.assertIsNotNone(outs[0]['datum'])
        self.assertIsNone(outs[0]['parent'])
        self.assertEqual(outs[0]['args']['column_names'], ['id%0n','amount','seq'])
        self.assertIsNotNone(outs[0].get('contents'))

        # キャッシュが作成されていること
        results = self.get_uri(f'/api/v0/folders/{SavableDatum.CACHE_FOLDER_UUID}', self.USER1)
        len_caches2 = len(results['children'])
        self.assertGreater(len_caches2, len_caches1, msg='キャッシュファイルが作成されませんでした')

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)

        # フローのロックを解除する
        result = self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

    def test_activity_with_datasrcs_dsts(self):
        """
        POST /activities でデータソース・デストを変更できること
        """
        flow_json = {
            "label": "私のフロー", 
            "nodes": [
                {
                    "id": "d", 
                    "type": "frame", 
                    "label": "d", 
                    "value": [['id'],[0],[1],[2],[3],[4],[5],[6],[7]],
                    "dataSource": "csv"
                }, 
                {
                    "id": "c1", 
                    "args": {
                        "a": "amount", 
                        "c": "#{id}+${id}", 
                        "precision": 10
                    }, 
                    "dsts": {
                        "o": "d1"
                    }, 
                    "srcs": {
                        "i": "d"
                    }, 
                    "type": "command", 
                    "label": "c1", 
                    "commandId": "mcal"
                }, 
                {
                    "id": "d1", 
                    "type": "frame", 
                    "label": "d1", 
                    "dataSource": "csv"
                }, 
                {
                    "id": "c2", 
                    "args": {
                        "I": "1", 
                        "S": "1", 
                        "a": "seq", 
                        "e": "seq", 
                        "s": "id%n"
                    }, 
                    "dsts": {
                        "o": "d2"
                    }, 
                    "srcs": {
                        "i": "d1"
                    }, 
                    "type": "command", 
                    "label": "c2", 
                    "commandId": "mnumber"
                },
                {
                    "id": "d2", 
                    "type": "frame", 
                    "label": "d2", 
                    "dataSource": "csv"
                }
            ], 
            "ports": [
                [
                    {
                        "type": "frame", 
                        "label": "d", 
                        "nodeId": "d"
                    }
                ], 
                [
                    {
                        "type": "frame", 
                        "label": "d2", 
                        "nodeId": "d2"
                    }
                ]
            ], 
            "params": [], 
            "creator": "ユーザー管理者", 
            "createdAt": "2021-04-28 11:11:05", 
            "description": ""
        }

        # フローを作成する
        flow = self.save_flow(self.root, 'まずーい！もう一杯！🥤', flow_json)

        # DBストアの作成
        db = self.root.create_database('postgresql', self.database_conn)
        db.uuid = 'c410cd16-2529-498d-8e7f-490ffa58dc95'
        db.save()

        # 作成を確定する
        self.finder.end()

        from streamcat.engine.tests.make_flow_json import postgre_src, postgre_dst

        literal_flow_json = {
            "nodes": [
                {
                    "id": "f0", 
                    "type": "flow",
                    "flow": postgre_src, 
                    "dsts": {
                        "d1": "d"
                    }
                },
                {
                    "id": "d", 
                    "label": "d", 
                    "type": "frame"
                }, 
                {
                    "id": "f1", 
                    "type": "flow",
                    "uuid": flow.uuid,  
                    "srcs": {
                        "d": "d"
                    }, 
                    "dsts": {
                        "d2": "d1"
                    }
                },
                {
                    "id": "d1", 
                    "label": "d1", 
                    "type": "frame"
                },
                {
                    "id": "f3", 
                    "type": "flow",
                    "flow": postgre_dst, 
                    "srcs": {
                        "d1": "d1"
                    }
                }
            ]
        }

        # POST /activitiesを発行する
        result = self.post_uri(f'/api/v0/activities', {'flow':literal_flow_json}, self.USER1)
        outs = result['outs']

        # POST /activitiesの結果を検証する
        self.assertIsNotNone(result['uuid'])
        # self.assertEqual(result['type'], Datum.ACTIVITY_TYPE)
        # self.assertEqual(result['label'], 'FLOW_LITERAL')
        self.assertEqual(len(outs), 1)
        self.assertEqual(outs[0]['id'], 'f3_d2')
        self.assertEqual(outs[0]['label'], 'f3_d2')
        self.assertIsNotNone(outs[0]['datum'])
        self.assertIsNotNone(outs[0]['parent'])
        self.assertEqual(outs[0]['args'], {})
        self.assertIsNone(outs[0].get('contents'))
