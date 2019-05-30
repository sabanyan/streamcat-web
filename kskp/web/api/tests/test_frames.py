import unittest
import json
from pathlib import Path
from kskp.web import app
from kskp.store import (
    Library,
    FRAME_FOLDER_UUID,
    CACHE_FOLDER_UUID
)

class ApiExecuteTestCase(unittest.TestCase):

    # テスト用のフロー
    flow_json = {
      "label": "テストフロ",
      "params": [],
      "description": "",
      "ports": [
        [],
        []
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

    def setUp(self):
        app.config['SECRET_KEY'] = 'sekrit!'
        self.client = app.test_client()

    def tearDown(self):
        pass

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
        frame_path = Path('kskp/data') / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # テストフローの作成
        input_node = {
          "id": "i",
          "type": "frame",
          "label": "テストデータ",
          "uuid": frame_uuid,
          "dataSource": "csv"
        }

        flow_json = json.loads(json.dumps(self.flow_json))
        flow_json['nodes'].append(input_node)
        flow_path = Path('kskp/data/flows/test.json')
        flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローを実行する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'

            # apiを投げる
            response = client.get('/api/v0/frames?from=test')
            result = json.loads(response.get_data())
            lasts = result['lasts']

            # テスト
            self.assertEqual(result['success'], True)

            # DBにframeデータが生成されているか
            self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

            # ラベルとIDチェック
            self.assertEqual(lasts[0]['id'], 'd1')
            self.assertEqual(lasts[0]['label'], '出力結果')

            # 後片付け
            Library.delete_frame(lasts[0]['uuid'])

        flow_path.unlink()
        frame_path.unlink()

    def test_flow_preview(self):
        """
        フローをプレビュー実行する
                        　↓プレビュー
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
        frame_path = Path('kskp/data') / 'test_data.csv'
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

        flow_json = json.loads(json.dumps(self.flow_json))
        flow_json['nodes'].append(input_node)
        flow_json['nodes'].append(add_cmd)
        flow_json['nodes'].append(add_datum)
        flow_path = Path('kskp/data/flows/test.json')
        flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        with app.test_client() as client:
            with client.session_transaction() as session:
                # まだ使っていない（login_required_apiを使っていないので）
                session['user_id'] = '1'

            # apiを投げる
            # プレビュー実行なのでfrom=flowuuid.datum_idの形式で投げている
            response = client.get('/api/v0/frames?from=test.d1')
            result = json.loads(response.get_data())
            lasts = result['lasts']

            # テスト
            self.assertEqual(result['success'], True)

            # DBにframeデータが生成されているか
            self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

            # ラベルとIDチェック
            self.assertEqual(lasts[0]['id'], 'd1')
            self.assertEqual(lasts[0]['label'], '出力結果')

            # 後片付け
            Library.delete_frame(lasts[0]['uuid'])

        flow_path.unlink()
        frame_path.unlink()

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

        flow_json = json.loads(json.dumps(self.flow_json))
        flow_json['ports'][0].append(input_port)
        flow_json['ports'][1].append(output_port)
        flow_json['nodes'].append(input_node)
        flow_path = Path('kskp/data/flows/test.json')
        flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = Path('kskp/data') / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # フローの実行
        with app.test_client() as client:
            with client.session_transaction() as session:
                # まだ使っていない（login_required_apiを使っていないので）
                session['user_id'] = '1'

            # apiを投げる
            data = {
                'args': {},
                'flow_uuid':'test',
                'i': frame_uuid
            }

            response = client.post('/api/v0/frames',
                                   content_type='application/json',
                                   data = json.dumps(data)
                                   )

            result = json.loads(response.get_data())
            lasts = result['lasts']

            # テスト
            self.assertEqual(result['success'], True)

            # DBにframeデータが生成されているか
            self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

            # ラベルとIDチェック
            self.assertEqual(lasts[0]['id'], 'd1')
            self.assertEqual(lasts[0]['label'], '出力結果')

            # 後片付け
            Library.delete_frame(lasts[0]['uuid'])

        flow_path.unlink()
        frame_path.unlink()

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

        flow_json = json.loads(json.dumps(self.flow_json))
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

        flow_path = Path('kskp/data/flows/test.json')
        flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = Path('kskp/data') / 'test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        args = {
            'param':'0,1'
        }

        # フローの実行
        with app.test_client() as client:
            with client.session_transaction() as session:
                # まだ使っていない（login_required_apiを使っていないので）
                session['user_id'] = '1'

            # apiを投げる
            data = {
                'args': json.dumps(args),
                'flow_uuid':'test',
                'i': frame_uuid
            }

            response = client.post('/api/v0/frames',
                                   content_type='application/json',
                                   data = json.dumps(data)
                                   )

            print(response.get_data())
            result = json.loads(response.get_data())
            lasts = result['lasts']

            # テスト
            self.assertEqual(result['success'], True)

            # DBにframeデータが生成されているか
            self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

            # ラベルとIDチェック
            self.assertEqual(lasts[0]['id'], 'd1')
            self.assertEqual(lasts[0]['label'], '出力結果')

            # 後片付け
            Library.delete_frame(lasts[0]['uuid'])

        flow_path.unlink()
        frame_path.unlink()

def create_data(file_path_obj, data=None):
    """
    テストデータ作成用
    frameのuuidが返る
    """
    import nysol.mcmd as nm
    import uuid

    if data is not None:
        nm.mread(i=data, o=file_path_obj.as_posix()).run()
    frame = Library.save_frame(FRAME_FOLDER_UUID, str(uuid.uuid4()), file_path_obj)
    return frame.uuid
