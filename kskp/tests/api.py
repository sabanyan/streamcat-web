import os
import unittest
import tempfile
import json
import uuid

from werkzeug.datastructures import Headers

from flask import template_rendered

from kskp import app
import kskp.model as model

class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

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
            # print(resp.get_data())

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

    def test_get_projects_api(self):
        with app.app_context():

            # テストデータの準備
            user1 = 'user1'
            user2 = 'user2'
            model.create_user(user1, '', '', '')
            model.create_user(user2, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = user1

            proj1 = 'proj1'
            proj2 = 'proj2'
            proj3 = 'proj3'

            model.create_project(proj1, session)
            model.create_project(proj2, session)
            model.create_project(proj3, session)

            model.add_info_for_users_x_projects(1, 1) # user1 proj1
            model.add_info_for_users_x_projects(1, 2) # user1 proj2
            model.add_info_for_users_x_projects(2, 2) # user2 proj2
            model.add_info_for_users_x_projects(2, 3) # user2 proj3

            with app.test_client() as client:
                def test_projects_by_user_id(user_id, projects):
                    with client.session_transaction() as session:
                        session['user_id'] = user_id
                    result = json.loads(client.get('/api/v0/projects').get_data())
                    self.assertEqual(result['success'], True)
                    self.assertEqual({r['name'] for r in result['data']}, projects)

                test_projects_by_user_id(user1, {proj1, proj2}) # user1だとproj1とproj2が見られる
                test_projects_by_user_id(user2, {proj2, proj3}) # user2だとproj2とproj3が見られる

    def test_delete_project(self):
        with app.app_context():

            user1 = 'user1'
            model.create_user(user1, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = user1

            model.create_project('proj1', session)

            # 削除前のプロジェクトの数を調べる
            projects_before = model.get_all_projects()
            self.assertEqual(len(projects_before), 1)
            uuid = projects_before[0]['uuid']

            with app.test_client() as client:
                with client.session_transaction() as session:
                    session['user_id'] = user1
                result = json.loads(client.delete('/api/v0/projects/%s' % uuid).get_data())
                self.assertEqual(result['success'], True)

            # 削除後のプロジェクトの数を調べる
            projects_after = model.get_all_projects()
            self.assertEqual(len(projects_after), 0)

    def test_new_flow(self):
        """
        new_project APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():

            user1 = 'user1'
            model.create_user(user1, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = user1

            model.create_project('proj1', session)
            project_uuid = model.get_all_projects()[0]['uuid']

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            new_flow_name = '新しいフローです'
            new_flow_data_source_name = 'datasource_test'

            # 必要最低限の項目だけを送る
            self.assertIsNotNone(project_uuid)

            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name,
                'data_source_name': new_flow_data_source_name
            }

            endpoint = '/api/v0/flows/new'
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data)
            )

            result = json.loads(response.get_data())

            result_project_id = model.get_project_id_by_uuid(project_uuid)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['project_id'], result_project_id)
            self.assertEqual(result['data']['name'], new_flow_name)

            # 後片付け
            model.make_flow_path(new_flow_data_source_name).unlink()


    def test_fetch_flow(self):
        """
        fetch_flowをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            user1 = 'user1'
            model.create_user(user1, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = user1

            model.create_project('proj1', session)
            project_id = model.get_all_projects()[0]['id']

            # フローも作る
            new_flow_name = 'ふろー取得APIてすと'
            data_source_name = 'fetch_flow_api_test'

            created_flow = model.create_flow(project_id, new_flow_name, data_source_name)


        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows/%s' % created_flow['uuid']
            response = client.get(endpoint)
            result = json.loads(response.get_data())


        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['uuid'], created_flow['uuid'])
        self.assertEqual(result['data']['project_id'], project_id)
        self.assertEqual(result['data']['name'], new_flow_name)

        # 後片付け
        path = model.get_flow_path_by_uuid(created_flow['uuid'])
        path.unlink()


    def test_update_flow(self):
        """
        update_flow APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            user1 = 'user1'
            model.create_user(user1, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = user1

            model.create_project('proj1', session)
            project_id = model.get_all_projects()[0]['id']

            # フローも作る
            new_flow_name = 'ふろー更新APIてすと'
            data_source_name = 'update_flow_api_test'

            created_flow = model.create_flow(project_id, new_flow_name, data_source_name)


        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows/%s' % created_flow['uuid']
            updated_flow_name = '変更後だよ'
            new_item = 'vjq@aer'
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps({
                    'b': new_item,
                    'name': updated_flow_name
                })
            )
            result = json.loads(response.get_data())


        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['uuid'], created_flow['uuid'])
        self.assertEqual(result['data']['project_id'], project_id)
        # 名前は正しく変更されている
        self.assertEqual(result['data']['name'], updated_flow_name)
        # 新しい内容も入っている
        self.assertEqual(result['data']['b'], new_item)

        # 後片付け
        path = model.get_flow_path_by_uuid(created_flow['uuid'])
        path.unlink()


    def test_delete_flow(self):
        """
        delete_flow APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():

            user1 = 'user1'
            model.create_user(user1, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = user1

            model.create_project('proj1', session)
            project_uuid = model.get_all_projects()[0]['uuid']
            project_id = model.get_project_id_by_uuid(project_uuid)

            # フロー作成
            new_flow_name = 'フロー削除のテスト用'
            data_source_name = 'delete_flow_test'
            new_flow = model.create_flow(project_id, new_flow_name, data_source_name)

            # APIを投げる前はファイルは存在するはず
            self.assertTrue(model.make_flow_path(data_source_name).exists())

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows/%s' % new_flow['uuid']
            response = client.delete(endpoint)
            result = json.loads(response.get_data())

        # 結果のチェック
        self.assertEqual(result['success'], True)
        with app.app_context():
            self.assertFalse(model.make_flow_path(data_source_name).exists())


if __name__ == '__main__':
    unittest.main()
