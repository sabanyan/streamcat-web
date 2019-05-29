import unittest
import json
from pathlib import Path
from kskp.web import app

class ApiTestCase(unittest.TestCase):

    def setUp(self):
        app.config['SECRET_KEY'] = 'sekrit!'
        self.client = app.test_client()

    def tearDown(self):
        pass

    def test_flow_execute(self):
        """
        フロー一覧取得のテスト
        """
        # APIを投げる
        with app.test_client() as client:
            with client.session_transaction() as session:
                # まだ使っていない（login_required_apiを使っていないので）
                session['user_id'] = '1'

            # apiを投げる
            response = client.get('/api/v0/commands')
            result = json.loads(response.get_data())
            lasts = result['data']

            # テスト
            self.assertEqual(result['success'], True)
