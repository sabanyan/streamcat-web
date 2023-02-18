import unittest
from flask import template_rendered
from streamcat.web.backend import app
from streamcat.core import SavableDatum
from ...api.utils import make_access_token
from ...api.tests.api_test_case_base import ApiTestCaseBase

class HtmlTestCase(ApiTestCaseBase):
    def setUp(self):
        super().setUp()
        app.testing = True
        self.client = app.test_client()
        # ログインするとCookieにトークンが格納される
        token = make_access_token(self.USER0.uuid)
        self.client.set_cookie(None, 'S', token)

    def assertRenderTemplate(self, path, file_name):
        templates = []
        with HtmlTestCase.captured_templates(app, templates):
            response = self.client.get(path)
            template, context = templates[0]
        self.assertEqual(template.name, file_name)

    @staticmethod
    def captured_templates(app, recorded, **extra):
        def record(sender, template, context):
            recorded.append((template, context))
        return template_rendered.connected_to(record, app)

    def test_root(self):
        """
        ルートから正しくリダイレクトされること
        """
        result = app.test_client().get('/')
        self.assertEqual(result.status_code, 302)

        from urllib.parse import urlparse
        url = urlparse(result.headers['Location'])
        self.assertEqual(url.path, '/library')

    def test_library(self):
        """
        ライブラリ画面を表示できること
        """
        self.assertRenderTemplate('/library', 'library.html')

    def test_projects(self):
        """
        プロジェクトを表示できること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()
        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'にゃお〜ん😽'}, self.USER0)
        project_uuid = result['uuid']
        # 画面が表示できること
        self.assertRenderTemplate(f'/projects/{project_uuid}', 'library.html')

    def test_cache_folders(self):
        """
        キャッシュフォルダを表示できること
        """
        self.assertRenderTemplate(f'/folders/{SavableDatum.CACHE_FOLDER_UUID}', 'library.html')

    def test_activity_folders(self):
        """
        アクティビティフォルダを表示できること
        """
        self.assertRenderTemplate(f'/folders/{SavableDatum.ACTIVITY_FOLDER_UUID}', 'library.html')

    def test_trashcans(self):
        """
        ゴミ箱を表示できること
        """
        self.assertRenderTemplate(f'/trashes', 'library.html')

    def test_flow_designer(self):
        """
        フローデザイナ画面が表示できること
        """
        self.assertRenderTemplate('/flows/RRRRRRRR-RRRR-4RRR-rRRR-RRRRRRRRRRRR', 'flow_designer.html')

    def test_preview(self):
        """
        プレビュー画面が表示できること
        """
        self.assertRenderTemplate(f'/preview', 'preview.html')
