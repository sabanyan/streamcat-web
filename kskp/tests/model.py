import os
import unittest
import tempfile

from werkzeug.datastructures import Headers

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

    def test_add_info_for_users_x_projects(self):
        """
        add_info_for_users_x_projects関数のテスト
        本当はinsertできているかだけじゃなくて、
        ちゃんとusersとprojectsを繋げられているかのテストも必要だが、
        それは果たしてこのメソッド内で行うべきなのか？

        ひとまずは単純なテストだけを実装しておく
        """

        with app.app_context():
            user_id = 1
            project_id = 2
            model.add_info_for_users_x_projects(user_id, project_id)

            sql = '''
            SELECT user_id, project_id FROM users_x_projects
             WHERE user_id = ? AND project_id = ?
            '''

            result = model.query_db(sql, (user_id, project_id), one=True)

            self.assertEqual(result[0], user_id)
            self.assertEqual(result[1], project_id)


    def test_get_projects_by_user_id(self):
        pass
        # with app.app_context():
        #     user1 = 'user1'
        #     user2 = 'user2'
        #     user3 = 'user3'
        #     model.create_user(user1, '', '', '')
        #     model.create_user(user2, '', '', '')
        #     model.create_user(user3, '', '', '')
        #
        #     with self.client.session_transaction() as session:
        #         session['user_id'] = user1
        #         model.create_project('user1_proj_1', session)
        #         model.create_project('user2_proj_1', session)
        #         model.create_project('user3_proj_1', session)


    def test_start_project(self):
        """
        model.start_projectをテストする
        """
        with app.app_context():
            email = 'dev@kskp.io'
            creator_name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                session['user_id'] = email
                model.create_user(email, '', creator_name, '')
                model.start_project(project_name, session)

            fetch_sql = '''
            SELECT x.user_id, p.name, p.creator_name FROM projects p
             INNER JOIN users_x_projects x
                ON x.project_id = p.id
               AND x.user_id = ?
            '''
            res = model.query_db(fetch_sql, (email,), one=True)

            self.assertEqual(res['user_id'], email)
            self.assertEqual(res['name'], project_name)
            self.assertEqual(res['creator_name'], creator_name)


    def test_new_project(self):
        """
        new_project APIをテストする
        """
        email = 'dev@kskp.io'
        creator_name = '開発者'
        project_name = '新しいプロジェクト'

        app.testing = True

        with app.app_context():
            with self.client.session_transaction() as session:
                session['user_id'] = email
                model.create_user(email, '', creator_name, '')

            headers = Headers()
            headers.add('Content-Type', 'application/json')
            data = '{"name": "%s"}' % project_name
            resp = self.client.post('/api/v0/projects/new',
                # charset='UTF-8',
                content_type='application/json',
                # content_length=len(data),
                data=data
            )
            print(resp.get_data())

            fetch_sql = '''
            SELECT x.user_id, p.name, p.creator_name FROM projects p
             INNER JOIN users_x_projects x
                ON x.project_id = p.id
               AND x.user_id = ?
            '''
            res = model.query_db(fetch_sql, (email,), one=True)

            self.assertEqual(res['user_id'], email)
            self.assertEqual(res['name'], project_name)
            self.assertEqual(res['creator_name'], creator_name)


if __name__ == '__main__':
    unittest.main()
