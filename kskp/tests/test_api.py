import os
import unittest
import tempfile
import json
import uuid
import pprint
from pathlib import Path

from werkzeug.datastructures import Headers

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

        with app.app_context():
            with self.client.session_transaction() as session:
                session['user_id'] = email
                model.create_user(email, '', creator_name, '')

            headers = Headers()
            headers.add('Content-Type', 'application/json')
            data = '{"name": "%s"}' % project_name
            resp = self.client.post('/api/v0/projects',
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
            (user1, project_id, project_uuid) = setUpProject(self)

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
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            new_flow_name = '新しいフローです'
            new_flow_data_source_name = str(uuid.uuid4())

            # 必要最低限の項目だけを送る
            self.assertIsNotNone(project_uuid)

            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name,
                'uuid': new_flow_data_source_name
            }

            endpoint = '/api/v0/flows'
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data)
            )

            result = json.loads(response.get_data())

            result_project_id = model.get_project_id_by_uuid(project_uuid)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['projectId'], result_project_id)
            self.assertEqual(result['data']['name'], new_flow_name)

            # 後片付け
            model.make_flow_path(new_flow_data_source_name).unlink()


    def test_fetch_flows_project_uuid_Nothing(self):
        """
        fetch_flowのprojectuuidが指定されていない場合のテスト
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows'
            response = client.get(endpoint)
            results = json.loads(response.get_data())

        # Projectを指定しなかった場合、例外が発生するかしないかのテスト
        # ここではとりあえず空のリストが返って来ることを期待している
        self.assertEqual(results['success'], True)
        self.assertEqual(results['data'], [])

        # 後片付け
        with app.app_context():
            paths = model.get_flow_paths_by_project_uuid(project_uuid)
            for path in paths:
                path.unlink()

    def test_fetch_flow(self):
        """
        fetch_flowをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)


        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows/%s' % data_source_name
            response = client.get(endpoint)
            result = json.loads(response.get_data())
            flow_path = model.get_flow_path_by_uuid(data_source_name)

        self.assertEqual(result['success'], True)
        self.assertEqual(flow_path.stem, data_source_name)
        self.assertEqual(result['data']['projectId'], project_id)
        self.assertEqual(result['data']['name'], new_flow_name)

        # 後片付け
        path = model.get_flow_path_by_uuid(data_source_name)
        path.unlink()

    def test_fetch_flows(self):
        """
        fecth_flowsをテストする
        """

        # ユーザとプロジェクト、フローを作成する
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            flow1_datasource_name = str(uuid.uuid4())
            flow2_datasource_name = str(uuid.uuid4())
            flow3_datasource_name = str(uuid.uuid4())
            created_flow = model.create_flow(project_id, 'フローテスト用', flow1_datasource_name)
            created_flow2 = model.create_flow(project_id, 'フローテスト用2', flow2_datasource_name)
            created_flow3 = model.create_flow(project_id, 'フローテスト用3', flow3_datasource_name)

         # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows?project=%s' % project_uuid
            response = client.get(endpoint)
            results = json.loads(response.get_data())

            flow_paths = model.get_flow_paths_by_project_uuid(project_uuid)

        self.assertEqual(results['success'], True)
        self.assertEqual({p.stem for p in flow_paths}, {flow1_datasource_name,
                                                        flow2_datasource_name,
                                                        flow3_datasource_name})
        self.assertEqual({r['projectId'] for r in results['data']}, {project_id,
                                                                     project_id,
                                                                     project_id})
        self.assertEqual({r['name'] for r in results['data']}, {'フローテスト用',
                                                                'フローテスト用2',
                                                                'フローテスト用3'})

        # 後片付け
        with app.app_context():
            paths = model.get_flow_paths_by_project_uuid(project_uuid)
            for path in paths:
                path.unlink()


    def test_update_flow(self):
        """
        update_flow APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)


        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows/%s' % data_source_name
            updated_flow_name = '変更後だよ'
            new_item = 'vjq@aer'
            response = client.put(endpoint,
                content_type='application/json',
                data=json.dumps({
                    'b': new_item,
                    'name': updated_flow_name
                })
            )
            result = json.loads(response.get_data())
            flow_path = model.get_flow_path_by_uuid(data_source_name)


        self.assertEqual(result['success'], True)
        self.assertEqual(flow_path.stem, data_source_name)
        self.assertEqual(result['data']['projectId'], project_id)
        # 名前は正しく変更されている
        self.assertEqual(result['data']['name'], updated_flow_name)
        # 新しい内容も入っている
        self.assertEqual(result['data']['b'], new_item)

        # 後片付け
        flow_path.unlink()


    def test_delete_flow(self):
        """
        delete_flow APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)

            # APIを投げる前はファイルは存在するはず
            self.assertTrue(model.make_flow_path(data_source_name).exists())

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows/%s' % data_source_name
            response = client.delete(endpoint)
            result = json.loads(response.get_data())
        # 結果のチェック
        self.assertEqual(result['success'], True)
        with app.app_context():
            self.assertFalse(model.make_flow_path(data_source_name).exists())


    def test_fetch_commands(self):
        """
        fetch_commands APIをテストする
        TODO: 結果の中身を確認するコードは書いていないが、そもそも書くべきか？
        内容は増えていくし、pprintで見ればおかしくないことぐらいはわかる
        必要になった時や必須のポイントがあれば書こう
        （中身のスキーマだけは確認した方が良さげ）
        """

        with app.test_client() as client:
            response = client.get('/api/v0/commands')
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        data = result['data']
        # pprint.pprint(data)


    def test_upload_frame(self):
        """
        upload_frame APIをテストする
        """
        # アップロード用に一時ファイルを作成する
        f, file_name = tempfile.mkstemp()

        with app.test_client() as client:
            response = client.post('/api/v0/frames',
                # content_type='multipart/form-data',
                # content_type='application/x-www-form-urlencoded',
                data={
                    # 'file_name': file_name
                    # ,
                    'file': f
                }
            )
            result = json.loads(response.get_data())

        # self.assertEqual(result['message'], '')
        # self.assertEqual(result['success'], True)


class FrameApiTestCase(unittest.TestCase):
    def setUp(self):
        app.testing = True

        setUpDatabase(self)
        setUpClient(self)

        with app.app_context():
            # まずユーザとプロジェクトを作る
            setUpProject(self)

        # frameを作る ファイル名はUUID
        self.frame_uuid = str(uuid.uuid4())
        csv_contents = 'a,b,c\n1,2,3\n0,1,2'
        self.path = app.root_path / Path('data/frames/%s.csv' % self.frame_uuid)
        self.path.write_text(csv_contents, encoding='utf-8')


    def tearDown(self):
        # 後片付け
        self.path.unlink()
        tearDownDatabase(self)


    def test_fetch_frame(self):
        """
        fetch_frame APIをテストする
        """
        with app.test_client() as client:
            response = client.get('/api/v0/frames/%s' % self.frame_uuid)
        result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        data = result['data']
        self.assertEqual(data['a'], ['1', '0'])
        self.assertEqual(data['b'], ['2', '1'])
        self.assertEqual(data['c'], ['3', '2'])


def setUpDatabase(self):
    """
    一時ファイルでsqlite DBを作成する
    """
    self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()

    with app.app_context():
        model.init_db()


def tearDownDatabase(self):
    """
    sqlite DBの削除
    """
    os.close(self.db_fd)
    os.unlink(app.config['DATABASE'])


def setUpClient(self):
    """
    エンドポイント テスト用の作成
    """
    self.client = app.test_client()


def setUpUser(self):
    user1 = 'user1'
    model.create_user(user1, '', '', '')
    return user1


def setUpProject(self):
    user1 = setUpUser(self)

    with self.client.session_transaction() as session:
        session['user_id'] = user1

    model.create_project('proj1', session)
    project_uuid = model.get_all_projects()[0]['uuid']
    project_id = model.get_project_id_by_uuid(project_uuid)

    return (user1, project_id, project_uuid)


def setUpFlow(self):
    (user1, project_id, project_uuid) = setUpProject(self)

    # フロー作成
    new_flow_name = 'フローテスト用'
    data_source_name = str(uuid.uuid4())
    created_flow = model.create_flow(project_id, new_flow_name, data_source_name)

    return (user1, project_id, project_uuid, new_flow_name, data_source_name, created_flow)

if __name__ == '__main__':
    unittest.main()
