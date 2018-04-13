import unittest

from flask import template_rendered

import kskp
import kskp.auth as auth

class AuthTestCase(unittest.TestCase):
    def test_password_hash(self):
        self.assertEqual(
            auth.get_password_hash('a', 'password'),
            '962c604d898bb6032131ecaca67ad70118f8c35ce31a505616cace7ea6d64a65'
        )

    def setUp(self):
        self.client = kskp.app.test_client()

    def test_login_required_DO_LOGGING_IN(self):
        with kskp.app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = 'me'
            templates = []
            with captured_templates(kskp.app, templates):
                result = client.get('/projects')
                template, context = templates[0]
                self.assertEqual(template.name, 'projects.html')

    def test_login_required_NOT_LOGGING_IN(self):
        with kskp.app.test_client() as client:
            templates = []
            with captured_templates(kskp.app, templates):
                result = client.get('/projects')
                template, context = templates[0]
                self.assertEqual(template.name, 'login.html')


def captured_templates(app, recorded, **extra):
    def record(sender, template, context):
        recorded.append((template, context))
    return template_rendered.connected_to(record, app)


if __name__ == '__main__':
    unittest.main()
