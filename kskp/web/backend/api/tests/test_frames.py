import unittest
import json
import os
import tempfile
from pathlib import Path
from kskp.web.backend import app
from kskp.store import (
    Library,
    STORE_DIR,
    FLOW_PATH
)

root = Library.load_root()

class FrameApoTestCase(unittest.TestCase):
    """
    実行以外のFramesAPIのテストを行う
    """

    def setUp(self):
        app.config['SECRET_KEY'] = 'sekrit!'
        self.client = app.test_client()

    def tearDown(self):
        pass

    @classmethod
    def tearDownClass(cls):
        """
        rootFolderを削除する
        """
        root.delete()

    @unittest.skip
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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.get('/api/v0/frames/%s' % frame_uuid)
        result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        # 中身をテストしてもいいけど面倒臭いので、Noneじゃないことだけテストする
        self.assertIsNotNone(result['data'].get('contents'))
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['lastModifiedAt'], now)

        Library.delete_frame(frame_uuid)

    @unittest.skip
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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.get('/api/v0/frames/%s?no_contents=1' % frame_uuid)
        result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        # no_contentsをつけているのでNoneのはず
        self.assertIsNone(result['data'].get('contents'))
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['lastModifiedAt'], now)

        Library.delete_frame(frame_uuid)

    @unittest.skip
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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.get('/api/v0/frames/%s?offset=2&limit=1' % frame_uuid)
        result = json.loads(response.get_data())

        correct = {'顧客': ['B'], '数量': ['1'], '金額\n': ['30\n']}

        self.assertEqual(result['success'], True)
        # no_contentsをつけているのでNoneのはず
        self.assertEqual(result['data']['contents'], correct)
        self.assertEqual(result['data']['fileSize'], 56)
        self.assertEqual(result['data']['lastModifiedAt'], now)

        Library.delete_frame(frame_uuid)

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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user1'
            response = client.get('/api/v0/frames/%s?header_only=1' % frame_uuid)
        result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], ['顧客', '数量', '金額'])

        Library.delete_frame(frame_uuid)

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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        with app.test_client() as client:
            data = {
                'label': '変更後'
            }
            with client.session_transaction() as session:
                session['user_id'] = 100
            response = client.put('/api/v0/frames/%s' % frame_uuid,
                                  content_type = 'application/json',
                                  data = json.dumps(data))

        result = json.loads(response.get_data())
        self.assertEqual(result['success'], True)
        frame = Library.load_frame(frame_uuid)
        # data列にラベルがあるらしい、requestのjsonがそのまま入っているのでjson.loadsする
        self.assertEqual(json.loads(frame.data), data)
        self.assertEqual(frame.modifier, 100)

        Library.delete_frame(frame_uuid)

    @unittest.skip
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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 100
            response = client.delete('/api/v0/frames/%s' % frame_uuid)

        result = json.loads(response.get_data())
        self.assertEqual(result['success'], True)
        # 消えているかのテスト
        self.assertIsNone(Library.load_frame(frame_uuid))

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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
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
        flow = Library.save_flow(root.uuid, 'test', json.dumps(flow_json))

        # フローを実行する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'

            # apiを投げる
            response = client.get(f'/api/v0/frames?from={flow.uuid}')
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
            delete_flow(flow.uuid)
            Library.delete_frame(frame_uuid)
            Library.delete_frame(lasts[0]['uuid'])

    # @unittest.skip
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
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
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
        flow = Library.save_flow(root.uuid, 'test', json.dumps(flow_json))

        # フローの実行
        with app.test_client() as client:
            with client.session_transaction() as session:
                # まだ使っていない（login_required_apiを使っていないので）
                session['user_id'] = '1'

            # apiを投げる
            # プレビュー実行なのでfrom=flowuuid.datum_idの形式で投げている
            response = client.get(f'/api/v0/frames?from={flow.uuid}.d1')
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
            delete_flow(flow.uuid)
            Library.delete_frame(frame_uuid)
            Library.delete_frame(lasts[0]['uuid'])

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
        flow = Library.save_flow(root.uuid, 'test', json.dumps(flow_json))

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
        frame_uuid = create_data(frame_path, csv_data)

        # フローの実行
        with app.test_client() as client:
            with client.session_transaction() as session:
                # まだ使っていない（login_required_apiを使っていないので）
                session['user_id'] = '1'

            # apiを投げる
            data = {
                'args': {},
                'flow_uuid':flow.uuid,
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
            delete_flow(flow.uuid)
            Library.delete_frame(frame_uuid)
            Library.delete_frame(lasts[0]['uuid'])

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
        flow = Library.save_flow(root.uuid, 'test', json.dumps(flow_json))

        # テストフレーム作成
        csv_data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_path = STORE_DIR / 'frames/csv/test_data.csv'
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
                'flow_uuid': flow.uuid,
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
            delete_flow(flow.uuid)
            Library.delete_frame(frame_uuid)
            Library.delete_frame(lasts[0]['uuid'])

def create_data(file_path_obj, data=None):
    """
    テストデータ作成用
    frameのuuidが返る
    """
    import nysol.mcmd as nm
    import uuid

    if data is not None:
        nm.mread(i=data, o=file_path_obj.as_posix()).run()
    frame = Library.save_frame(root.uuid, str(uuid.uuid4()), file_path_obj)
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
