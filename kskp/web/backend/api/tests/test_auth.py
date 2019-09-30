import unittest
import tempfile
import os
from flask import template_rendered
from kskp.web.backend import app
import kskp.web.backend.api.auth as auth
from kskp.store import model

class AuthTestCase(unittest.TestCase):
    def test_password_hash(self):
        self.assertEqual(
            auth.get_password_hash('a', 'password'),
            '962c604d898bb6032131ecaca67ad70118f8c35ce31a505616cace7ea6d64a65'
        )

    def setUp(self):
        self.client = app.test_client()
        self.db_fd, os.environ['SQLITE_PATH'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(os.environ['SQLITE_PATH'])

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
        hashpass = auth.get_password_hash(email, password)

        with self.client.session_transaction() as session:
            model.create_user(email, password, name, '')
            bln = auth.authenticate(model.get_user_id_by_email(email)['id'], password, session)
            self.assertEqual(bln, True)

def captured_templates(app, recorded, **extra):
    def record(sender, template, context):
        recorded.append((template, context))
    return template_rendered.connected_to(record, app)


if __name__ == '__main__':
    unittest.main()
