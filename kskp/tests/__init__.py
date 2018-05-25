import unittest
from kskp import app

class HtmlTestCase(unittest.TestCase):
    def setUp(self):
        app.testing = True
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'user_id'

    def test_root(self):
        """
        ルートから正しくリダイレクトされるかどうかのテスト
        """

        with app.test_client() as client:
            result = client.get('/')
            self.assertEqual(result.status_code, 302)

            from urllib.parse import urlparse
            url = urlparse(result.headers['Location'])
            self.assertEqual(url.path, '/projects')
            
