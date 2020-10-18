import unittest
from flask import template_rendered
from kskp.web.backend import app
from .api_test_case_base import ApiTestCaseBase

class AuthTestCase(ApiTestCaseBase):
    def test_password_hash(self):
        user = self.factory.user.create('a', 'test', 'password0123')
        self.assertEqual(
            user._get_password_hash('a', 'password'),
            '962c604d898bb6032131ecaca67ad70118f8c35ce31a505616cace7ea6d64a65'
        )

    def setUp(self):
        self.client = app.test_client()
        app.testing = True


    # TODO: viewsの/projectsを追加したらコメントアウトしてテストする
    # def test_login_required_DO_LOGGING_IN(self):
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = 'me'
    #         templates = []
    #         with captured_templates(app, templates):
    #             result = client.get('/projects')
    #             template, context = templates[0]
    #             self.assertEqual(template.name, 'projects.html')
    #
    # def test_login_required_NOT_LOGGING_IN(self):
    #     with app.test_client() as client:
    #         templates = []
    #         with captured_templates(app, templates):
    #             result = client.get('/projects')
    #             template, context = templates[0]
    #             self.assertEqual(template.name, 'login.html')

    def test_authenticate(self):
        """
        ユーザ認証のテスト
        """
        email = 'dev@kskp.io'
        name = '開発者'
        password = '1bdae10ff4532d6bd4c23d54cae62fa4f636b19cf5e3e8f83432a90aea99f33f'

        with self.client.session_transaction() as session:
            user = self.factory.user.create(email, name, password)
            bln = user.authenticate(password)
            self.assertEqual(bln, True)

def captured_templates(app, recorded, **extra):
    def record(sender, template, context):
        recorded.append((template, context))
    return template_rendered.connected_to(record, app)


if __name__ == '__main__':
    unittest.main()
