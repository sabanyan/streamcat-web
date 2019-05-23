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
    def setUp(self):
        app.config['SECRET_KEY'] = 'sekrit!'
        self.client = app.test_client()

    def tearDown(self):
        pass

    def test_flow_execute(self):
        """
        フロー実行のテスト
        """
        # テストフローの作成
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
              "id": "i",
              "type": "frame",
              "label": "テストデータ",
              "value": [["顧客", "数量", "金額"],
                  ["A", 1, 10],
                  ["A", 2, 20],
                  ["B", 1, 30],
                  ["B", 3, 40],
                  ["B", 1, 50]],
              "dataSource": "csv"
            },
            {
              "type": "frame",
              "id": "d1",
              "label": "d1",
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

        path = Path('kskp/web/flows/test.json')
        path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'

            response = client.get('/api/v0/frames?from=test')
            result = json.loads(response.get_data())
            lasts = result['lasts']

            self.assertEqual(result['success'], True)
            self.assertEqual(lasts[0]['id'], 'd1')

            # DBにframeデータが生成されているか
            frame = Library.load_frame(lasts[0]['uuid'])
            self.assertIsNotNone(Library.load_frame(lasts[0]['uuid']))

            # ラベルチェック
            # self.assertEqual(result[0]['label'], correct['label'])

            # 後片付け
            Library.delete_frame(lasts[0]['uuid'])

        path.unlink()

    def test_flow_preview(self):
        pass

    def test_subflow_execute(self):
        pass
