import os
import unittest
import tempfile

from kskp import app
import kskp.model as model

class ModelTestCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

    def test_schema(self):
        with app.app_context():
            conn = model.get_connection()
            sql = "select name from sqlite_master where type='table'"
            current_tables = {t[0] for t in model.query_db(sql)}
            conn.commit()

            # これもできれば仕様書を作ってそこから引っぱってくるようにしたい
            correct_tables = [
                'users',
                'projects',
                'users_x_projects'
            ]
            for table in correct_tables:
                self.assertIn(table, current_tables)

    def test_create_user(self):
        with app.app_context():
            email = 'dev@kskp.io'
            password = 'devpass'
            name = '開発者'
            creator = 'admin@kskp.io'
            model.create_user(email, password, name, creator)

            sql = "SELECT password, name, creator FROM users WHERE email = ?"
            result = model.query_db(sql, (email,), one=True)

            self.assertNotEqual(result[0], password) # 平文ではないことのテスト
            self.assertEqual(result[1], name)
            self.assertEqual(result[2], creator)

    def test_delete_user(self):
        with app.app_context():
            email = 'dev@kskp.io'

            model.create_user(email, '', '', '')
            result = model.get_user(email)
            self.assertEqual(len(result), 1)

            model.delete_user(email)

            result = model.get_user(email)
            self.assertIsNone(result)

    def test_get_current_user(self):
        with app.test_client() as client:
            with app.app_context():
                email = 'dev@kskp.io'
                name = '開発者'
                model.create_user(email, '', name, '')

                with client.session_transaction() as session:
                    session['user_id'] = email
                    user = model.get_current_user(session)

                self.assertEqual(user.email, email)
                self.assertEqual(user.name, name)

    def test_create_project(self):
        with app.app_context():
            email = 'dev@kskp.io'
            name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                session['user_id'] = email
                model.create_user(email, '', name, '')
                model.create_project(project_name, session)

            results = model.get_all_projects()
            self.assertEqual(len(results), 1)
            res = results[0]
            self.assertEqual(res[2], project_name)


    def test_get_projects_by_user_id(self):
        pass

if __name__ == '__main__':
    unittest.main()
