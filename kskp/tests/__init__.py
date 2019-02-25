import unittest
from flask import template_rendered
from kskp import app

class HtmlTestCase(unittest.TestCase):
    def setUp(self):
        app.testing = True
        self.client = app.test_client()
        with self.client.session_transaction() as session:
            session['user_id'] = 'user_id'


    def assertRenderTemplate(self, path, file_name):
        templates = []
        with captured_templates(app, templates):
            response = self.client.get(path)
            template, context = templates[0]
        self.assertEqual(template.name, file_name)


    def test_root(self):
        """
        ルートから正しくリダイレクトされるかどうかのテスト
        """

        result = app.test_client().get('/')
        self.assertEqual(result.status_code, 302)

        from urllib.parse import urlparse
        url = urlparse(result.headers['Location'])
        self.assertEqual(url.path, '/projects')


    def test_projects(self):
        """
        プロジェクト一覧表示画面を表示するテスト
        """

        self.assertRenderTemplate('/projects', 'projects.html')


    def test_flows(self):
        """
        フロ一覧表示画面を表示するテスト
        """

        self.assertRenderTemplate('/flows', 'flows.html')


    def test_flow_designer(self):
        """
        フローデザイナが正しく返されるかどうかのテスト
        """

        self.assertRenderTemplate('/flows/RRRRRRRR-RRRR-4RRR-rRRR-RRRRRRRRRRRR', 'flow_designer.html')


def captured_templates(app, recorded, **extra):
    def record(sender, template, context):
        recorded.append((template, context))
    return template_rendered.connected_to(record, app)
