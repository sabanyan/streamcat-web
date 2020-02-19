import unittest
import copy
import json
import os
import tempfile
from pathlib import Path
from kskp.web.backend import app
from kskp.store import (
    Datum,
    Frame,
    Library,
    TrashCan,
    STORE_DIR
)
from kskp.web.backend.api.tests.test_case_base import TestCaseBase

root = Library.load_root()
root_path = root.path

class FrameApiTestCase(TestCaseBase):
    """
    実行以外のFramesAPIのテストを行う
    """

    # def setUp(self):
    #     app.config['SECRET_KEY'] = 'sekrit!'
    #     self.client = app.test_client()

    # def tearDown(self):
    #     pass

    # @classmethod
    # def tearDownClass(cls):
    #     """
    #     rootFolderを削除する
    #     """
    #     from kskp.store import FLOW_FOLDER_UUID
    #     Library.delete_folder(FLOW_FOLDER_UUID)
    #     root.delete()

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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        result = self.get_uri('/api/v0/frames/%s' % frame_uuid, self.USER_ID)

        self.assertEqual(result['success'], True)
        # 中身をテストしてもいいけど面倒臭いので、Noneじゃないことだけテストする
        self.assertIsNotNone(result['data'].get('contents'))
        self.assertEqual(result['data']['fileSize'], 56)
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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        result = self.get_uri('/api/v0/frames/%s?no_contents=1' % frame_uuid, self.USER_ID)

        self.assertEqual(result['success'], True)
        # no_contentsをつけているのでNoneのはず
        self.assertIsNone(result['data'].get('contents'))
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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        result = self.get_uri('/api/v0/frames/%s?offset=2&limit=1' % frame_uuid, self.USER_ID)

        correct = {'顧客': ['B'], '数量': ['1'], '金額\n': ['30\n']}

        self.assertEqual(result['success'], True)
        # no_contentsをつけているのでNoneのはず
        self.assertEqual(result['data']['contents'], correct)
        self.assertEqual(result['data']['fileSize'], 56)
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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        result = self.get_uri('/api/v0/frames/%s?header_only=1' % frame_uuid, self.USER_ID)

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], ['顧客', '数量', '金額'])


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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        data = {
            'label': '変更後'
        }
        self.put_uri('/api/v0/frames/%s' % frame_uuid, data, 100)

        frame = Library.load_frame(frame_uuid)
        # data列にラベルがあるらしい、requestのjsonがそのまま入っているのでjson.loadsする
        self.assertEqual(frame.label, '変更後')
        self.assertEqual(frame.modifier, 100)


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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        result = self.delete_uri('/api/v0/frames/%s' % frame_uuid, self.USER_ID)

        self.assertEqual(result['success'], True)

        # ゴミ箱に移動しているかのテスト
        frame = Frame.find_by_uuid(frame_uuid)
        trash = TrashCan.find()
        self.assertEqual(frame.parent_uuid, trash.uuid)

    # ここからフローの実行テスト
    """
    実行のFramesAPIをテストする
    """
    # テスト用のフロー
    flow_json = {
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
        }
      ]
    }

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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ",
          "uuid": frame_uuid,
          "dataSource": "csv"
        }

        flow_json = self.flow_json
        flow_json['nodes'].append(input_node)
        flow = Library.save_flow(root.uuid, 'test', flow_json)

        # フローの実行
        result = self.get_uri(f'/api/v0/frames?from={flow.uuid}', self.USER_ID)
        lasts = result['lasts']

        # DBにframeデータが生成されているか
        self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

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
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ",
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
        flow = Library.save_flow(root.uuid, 'test', flow_json)
        
        # フローの実行
        vis_args = { "d1" : 
                        {"args" :
                            {"visualizer" : "csvtohtmltable",
                             "offset" : 0,
                             "limit"  : 100
                            }
                        }
                    }
        result = self.post_uri(f'/api/v0/vizs?from={flow.uuid}', vis_args, self.USER_ID)
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
          "label": "テストデータ",
          "dataSource": "csv",
          "uuid": None
        }

        input_port = {
            'label': '入力1',
            'nodeId': input_node_id,
            'type':'frame'
        }

        # outputも一応設定しておく（結果は変わらないけど）
        output_port = {
            'label': '出力1',
            'nodeId': 'd1',
            'type':'frame'
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['ports'][0].append(input_port)
        flow_json['ports'][1].append(output_port)
        flow_json['nodes'].append(input_node)
        flow = Library.save_flow(root.uuid, 'test', flow_json)

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # フローの実行
        data = {
            'args': {},
            'flow_uuid':flow.uuid,
            'i': frame_uuid
        }
        result = self.post_uri('/api/v0/frames', data, self.USER_ID)
        lasts = result['lasts']

        # DBにframeデータが生成されているか
        self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

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
          "label": "テストデータ",
          "dataSource": "csv",
          "uuid": None
        }

        input_port = {
            'label': '入力1',
            'nodeId': input_node_id,
            'type':'frame'
        }

        # outputも一応設定しておく（結果は変わらないけど）
        output_port = {
            'label': '出力1',
            'nodeId': 'd1',
            'type':'frame'
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['ports'][0].append(input_port)
        flow_json['ports'][1].append(output_port)
        flow_json['nodes'].append(input_node)

        # フロー変数を使うようにする
        arg_for_param = 'param'
        flow_json['params'].append({'name':arg_for_param, 'type':'string'})
        for node in flow_json['nodes']:
            if node['id'] == 'c1':
                node['args']['f'] = f'@[{arg_for_param}]'
                break
        flow = Library.save_flow(root.uuid, 'test', flow_json)

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = STORE_DIR / root_path / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        args = {
            'param':'0,1'
        }

        # フローの実行
        data = {
            'args': args,
            'flow_uuid': flow.uuid,
            'i': frame_uuid
        }
        result = self.post_uri('/api/v0/frames', data, self.USER_ID)
        lasts = result['lasts']

        # DBにframeデータが生成されているか
        self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['label'], '出力結果')

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
        frame_path = STORE_DIR / root_path / 'test_data_3.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ",
          "uuid": frame_uuid,
          "dataSource": "csv"
        }

        flow_json = copy.deepcopy(self.flow_json)
        flow_json['nodes'].append(input_node)
        flow = Library.save_flow(root.uuid, 'test', flow_json)
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
        result = self.post_uri(f'/api/v0/vizs?from={flow.uuid}', data, self.USER_ID)
        lasts = result['lasts']

        # ラベルとIDチェック
        self.assertEqual(lasts[0]['id'], 'd1')
        self.assertEqual(lasts[0]['args']['column_names'], ['顧客', '数量'])
        self.assertIsNotNone(lasts[0].get('contents'))

def create_data(file_path_obj, data=None):
    """
    テストデータ作成用
    frameのuuidが返る
    """
    import nysol.mcmd as nm
    import uuid

    if data is not None:
        nm.mread(i=data, o=file_path_obj.as_posix()).run()
    
    frame = Library.save_frame(root.uuid,
                               str(uuid.uuid4()),
                               Path(Datum._to_rel_path(file_path_obj.as_posix())))
    return frame.uuid

def delete_flow(uuid):
    """
    TODO: flowをdbに保存するようになったらそのように変更すること！
    """
    try:
        flow = Library.load_flow(uuid)
        flow.delete()
    except Exception as e:
        print(e)
        return False
    return True
