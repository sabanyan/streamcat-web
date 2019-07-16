import unittest
import json
from pathlib import Path
from kskp.web import app
from kskp.store import (
    Library,
    FRAME_FOLDER_UUID
)

class ApiVisualizersTestCase(unittest.TestCase):
    """
    ビジュアライズのエンドポイントのテスト
    """

    def setUp(self):
        app.config['SECRET_KEY'] = 'sekrit!'
        self.client = app.test_client()

    def test_execute_table_command(self):
        """
        テーブル出力を実行する
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

        # フローを実行する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = '1'

            # apiを投げる
            data = {
                'args': {
                    'limit': 3,
                    'offset': 0
                },
                'inputs': {
                    'i': frame_path.as_posix()
                }
            }

            response = client.post('/visualizers?from=csvtohtmltable',
                                   content_type='application/json',
                                   data = json.dumps(data)
                                   )

            # テスト
            # FIXIT?: render_templateのテスト方法がいまいちわからないので、
            # とりあえず200番が帰ってきていることをテストしている
            self.assertEqual(200, response.status_code)

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
