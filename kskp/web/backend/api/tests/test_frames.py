import copy
import unittest
from kskp.core import Datum
from kskp.store import DatabaseConn
from .api_test_case_base import ApiTestCaseBase

class FrameTestCase(ApiTestCaseBase):
    """
    実行以外のFramesAPIのテストを行う
    """
    conn_json = {
      'dbms'     : "postgresql",
      'hostname' : "db", 
      'port'     : 5432, 
      'database' : "kskp", 
      'user_id'  : "kskp", 
      'password' : 'ZQZtVgL6G32Vy6p6WJtG3C3K84yuJ4zz'
    }
    database_conn = DatabaseConn(conn_json)

    def setUp(self):
        self.root = self.factory.data.load_root()
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
                        "d": 'd1'
                    },
                    "dsts": {}, 
                    "uuid": self.data_dst.uuid
                }
            ]
        }
    
    def save_flow(self, parent, label, flow_json):
        from kskp.store import FlowData
        new_flow = parent.create_flow(label, FlowData(flow_json))
        new_flow.save()
        # save()によりreadable=Noneになるため再取得する
        return new_flow.reload()

    # @unittest.skip
    def test_fetch_frame(self):
        """
        fetch_frame APIをテストする
        """
        from datetime import datetime
        now = datetime.now().strftime('%Y/%m/%d %H:%M')

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

        result = self.get_uri('/api/v0/frames/%s' % frame_uuid, self.USER1)

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['encoding'], 'UTF-8')
        self.assertEqual(result['data']['newline'], 'LF')
        self.assertEqual(result['data']['lastModifiedAt'], now)


    # @unittest.skip
    def test_fetch_frame_no_contents(self):
        """
        fetch_frame APIをテストする
        no_contentsをつける
        """
        from datetime import datetime
        now = datetime.now().strftime('%Y/%m/%d %H:%M')

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

        result = self.get_uri('/api/v0/frames/%s?no_contents=1' % frame_uuid, self.USER1)

        self.assertEqual(result['success'], True)
        # no_contentsをつけているのでNoneのはず
        self.assertIsNone(result['data'].get('contents'))
        self.assertEqual(result['data']['encoding'], 'UTF-8')
        self.assertEqual(result['data']['newline'], 'LF')
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['lastModifiedAt'], now)


    # @unittest.skip
    def test_fetch_frame_offset_and_limit(self):
        """
        fetch_frame APIをテストする
        offsetとlimitをつける
        """
        from datetime import datetime
        now = datetime.now().strftime('%Y/%m/%d %H:%M')

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

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['encoding'], 'UTF-8')
        self.assertEqual(result['data']['newline'], 'LF')
        self.assertEqual(result['data']['lastModifiedAt'], now)


    # @unittest.skip
    def test_fetch_frame_header_only(self):
        """
        fetch_frame APIをテストする
        header_onlyをつける
        """
        from datetime import datetime
        now = datetime.now().strftime('%Y/%m/%d %H:%M')

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

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['encoding'], 'UTF-8')
        self.assertEqual(result['data']['newline'], 'LF')
        self.assertEqual(result['data']['lastModifiedAt'], now)


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

        frame = self.factory.data.find_by_uuid(frame_uuid)
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

        result = self.delete_uri('/api/v0/frames/%s' % frame_uuid, self.USER1)

        self.assertEqual(result['success'], True)

        # ゴミ箱に移動しているかのテスト
        frame = self.factory.data.find_by_uuid(frame_uuid)
        self.assertEqual(frame.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

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
        result = self.get_uri(f'/api/v0/frames?from={flow.uuid}', self.USER1)
        lasts = result['lasts']

        # DBにframeデータが生成されているか
        self.assertIsNotNone(self.factory.data.find_by_uuid(lasts[0]['uuid']))

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['label'], '出力結果')


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
        vis_args = { "d1" : 
                        {"args" :
                            {"visualizer" : "csvtohtmltable",
                             "offset" : 0,
                             "limit"  : 100
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/vizs?from={flow.uuid}', vis_args, self.USER1)
        lasts = result['lasts']

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['args']['column_names'], ['顧客', '数量'])


    # @unittest.skip
    def test_flow_executea_add_inputs(self):
        """
        フロー一覧から実行のような、inputsやargsを外部から与えて実行するテスト
        inputsを与えて実行

        フロー：i -> c1 -> d1
        """
        input_node_id = 'i'

        # テストフローの作成
        input_node = {
          "id": input_node_id,
          "type": "frame",
          "label": "テストデータ3",
          "dataSource": "csv",
          "uuid": None
        }

        input_port = {
            'label': '入力1',
            'nodeId': input_node_id,
            'type':'frame'
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['ports'][0].append(input_port)
        flow_json['nodes'].append(input_node)
        flow = self.save_flow(self.root, 'test', flow_json)

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

        # フローの実行
        data = {
            'args': {},
            'flow_uuid':flow.uuid,
            'i': frame_uuid
        }
        result = self.post_uri('/api/v0/frames', data, self.USER1)
        lasts = result['lasts']

        # DBにframeデータが生成されているか
        self.assertIsNotNone(self.factory.data.find_by_uuid(lasts[0]['uuid']))

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['label'], '出力結果')


    # @unittest.skip
    def test_flow_executea_add_inputs_and_args(self):
        """
        フロー一覧から実行のような、inputsやargsを外部から与えて実行するテスト
        inputsとargsを与えて実行

        フロー：i -> c1 -> d1
        """
        input_node_id = 'i'

        # テストフローの作成
        input_node = {
          "id": input_node_id,
          "type": "frame",
          "label": "テストデータ4",
          "dataSource": "csv",
          "uuid": None
        }

        input_port = {
            'label': '入力1',
            'nodeId': input_node_id,
            'type':'frame'
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['ports'][0].append(input_port)
        flow_json['nodes'].append(input_node)

        # フロー変数を使うようにする
        arg_for_param = 'param'
        flow_json['params'].append({'name':arg_for_param, 'type':'string'})
        for node in flow_json['nodes']:
            if node['id'] == 'c1':
                node['args']['f'] = f'@[{arg_for_param}]'
                break
        flow = self.save_flow(self.root, 'test', flow_json)

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

        args = {
            'param':'0,1'
        }

        # フローの実行
        data = {
            'args': args,
            'flow_uuid': flow.uuid,
            'i': frame_uuid
        }
        result = self.post_uri('/api/v0/frames', data, self.USER1)
        lasts = result['lasts']

        # DBにframeデータが生成されているか
        self.assertIsNotNone(self.factory.data.find_by_uuid(lasts[0]['uuid']))

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['label'], '出力結果')

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
        data = {
			"d1" : {
                "args" : {
                    "visualizer" : "csvtohtmltable",
                    "offset" : 0,
                    "limit"  : 0
                }
			}
        }

        # Visの取得
        result = self.post_uri(f'/api/v0/vizs?from={flow.uuid}', data, self.USER1)
        lasts = result['lasts']

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['args']['column_names'], ['顧客', '数量'])
        self.assertIsNotNone(lasts[0].get('contents'))

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

        # Visデータのポイント引数の作成
        data = {
            "args" : {
                "visualizer" : "csvtohtmltable",
                "offset" : 0,
                "limit"  : 5
            }
        }

        # Visの取得
        result = self.post_uri(f'/api/v0/vizs/{frame_uuid}', data, self.USER1)
        lasts = result['lasts']

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd')
        self.assertEqual(lasts[0]['args']['column_names'], ['顧客','','顧客'])
        self.assertIsNotNone(lasts[0].get('contents'))

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
        lasts = self.post_uri(f'/api/v0/activities', {'flow':flow_json,'args':args}, self.USER1)
        data = lasts['data']

        # POST /activitiesの結果を検証する
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], 'd')
        self.assertEqual(data[0]['label'], 'd')
        self.assertIsNotNone(data[0]['uuid'])
        self.assertIsNone(data[0]['parent'])
        self.assertEqual(data[0]['args']['column_names'], ['id'])
        self.assertIsNotNone(data[0].get('contents'))

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
        lasts = self.post_uri(f'/api/v0/activities', {'uuid':flow.uuid,'args':args}, self.USER1)
        data = lasts['data']

        # POST /activitiesの結果を検証する
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], 'd')
        self.assertEqual(data[0]['label'], 'd')
        self.assertIsNotNone(data[0]['uuid'])
        self.assertIsNone(data[0]['parent'])
        self.assertEqual(data[0]['args']['column_names'], ['id'])
        self.assertIsNotNone(data[0].get('contents'))

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow.uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)

        # フローのロックを解除する
        result = self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

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
        lock_uuid = result['data']['uuid']

        # フロー実行前のキャッシュファイル数を数えておく
        results = self.get_uri(f'/api/v0/folders/{Datum.CACHE_FOLDER_UUID}', self.USER1)
        len_caches1 = len(results['data']['children'])

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
        lasts = self.post_uri(f'/api/v0/activities', {'uuid':flow.uuid,'args':args,'lock':lock_uuid}, self.USER1)
        data = lasts['data']

        # POST /activitiesの結果を検証する
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], 'd2')
        self.assertEqual(data[0]['label'], 'd2')
        self.assertIsNotNone(data[0]['uuid'])
        self.assertIsNone(data[0]['parent'])
        self.assertEqual(data[0]['args']['column_names'], ['id%0n','amount','seq'])
        self.assertIsNotNone(data[0].get('contents'))

        # キャッシュが作成されていること
        results = self.get_uri(f'/api/v0/folders/{Datum.CACHE_FOLDER_UUID}', self.USER1)
        len_caches2 = len(results['data']['children'])
        self.assertGreater(len_caches2, len_caches1, msg='キャッシュファイルが作成されませんでした')

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)

        # フローのロックを解除する
        result = self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

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

        from kskp.engine.tests.make_flow_json import postgre_src, postgre_dst

        literal_flow_json = {
            "nodes": [
                {
                    "id": "f", 
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
                    "id": "f", 
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
                    "id": "f", 
                    "type": "flow",
                    "flow": postgre_dst, 
                    "srcs": {
                        "d1": "d1"
                    }
                }
            ]
        }

        # POST /activitiesを発行する
        lasts = self.post_uri(f'/api/v0/activities', {'flow':literal_flow_json}, self.USER1)
        data = lasts['data']

        # POST /activitiesの結果を検証する
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], 'f_d2')
        self.assertEqual(data[0]['label'], '')
        self.assertIsNotNone(data[0]['uuid'])
        self.assertIsNotNone(data[0]['parent'])
        self.assertEqual(data[0]['args'], {})
        self.assertIsNone(data[0].get('contents'))
