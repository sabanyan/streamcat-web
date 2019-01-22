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
                model.create_user(email, '', creator_name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']

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
            SELECT x.user_id, x.project_id, p.name, p.creator_id FROM projects p
             INNER JOIN users_x_projects x
                ON x.project_id = p.id
               AND x.user_id = ?
            '''
            res = model.query_db(fetch_sql, (session['user_id'],), one=True)

            self.assertEqual(res['user_id'], session['user_id'])
            self.assertEqual(res['project_id'], 1)
            self.assertEqual(res['name'], project_name)
            self.assertEqual(res['creator_id'], session['user_id'])

    def test_get_projects_api(self):
        with app.app_context():

            # テストデータの準備
            user1 = 'user1'
            user2 = 'user2'
            model.create_user(user1, '', '', '')
            model.create_user(user2, '', '', '')

            with self.client.session_transaction() as session:
                session['user_id'] = model.get_user_id_by_email(user1)['id']

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
                    self.assertEqual(result['navigation']['user_id'], user_id)
                    self.assertEqual(result['navigation']['user_name'], model.get_user_by_id(user_id)['name'])

                test_projects_by_user_id(model.get_user_id_by_email(user1)['id'], {proj1, proj2}) # user1だとproj1とproj2が見られる
                test_projects_by_user_id(model.get_user_id_by_email(user2)['id'], {proj2, proj3}) # user2だとproj2とproj3が見られる

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
        new_flow APIをテストする
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
            data_source = {
                "id": "i",
                "type": "frame",
                "dataSource": "csv",
                "uuid": "2C72275F-2019-49AE-B36D-A29D1507F8DD",
                "label": "test"
            }

            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name,
                'datasource': data_source
            }

            flow_path = app.config['FLOW_PATH']
            with tempfile.TemporaryDirectory() as temp_dir:
                app.config['FLOW_PATH'] = temp_dir

                endpoint = '/api/v0/flows'
                response = client.post(endpoint,
                    content_type='application/json',
                    data=json.dumps(data)
                    )

            result = json.loads(response.get_data())

            result_project_id = model.get_project_id_by_uuid(project_uuid)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['description'], "")
            self.assertEqual(result['data']['projectId'], result_project_id)
            self.assertEqual(result['data']['label'], new_flow_name)
            self.assertEqual(result['data']['nodes'][0]['uuid'], "2C72275F-2019-49AE-B36D-A29D1507F8DD")
            self.assertEqual(result['data']['nodes'][0]['label'], "test")

            # 後片付け
            app.config['FLOW_PATH'] = flow_path

    def test_new_flow_nothing_datasource(self):
        """
        new_flow APIをテストする
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
                'name': new_flow_name
            }

            flow_path = app.config['FLOW_PATH']
            with tempfile.TemporaryDirectory() as temp_dir:
                app.config['FLOW_PATH'] = temp_dir

                endpoint = '/api/v0/flows'
                response = client.post(endpoint,
                    content_type='application/json',
                    data=json.dumps(data)
                    )

            result = json.loads(response.get_data())

            result_project_id = model.get_project_id_by_uuid(project_uuid)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['projectId'], result_project_id)
            self.assertEqual(result['data']['label'], new_flow_name)

            # 後片付け
            app.config['FLOW_PATH'] = flow_path


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
        path = model.get_flow_path_by_uuid(data_source_name)
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
        self.assertEqual(result['data']['label'], new_flow_name)
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')
        self.assertEqual(result['navigation']['flow_name'], new_flow_name)
        self.assertEqual(result['navigation']['flow_uuid'], data_source_name)

        # 後片付け
        path = model.get_flow_path_by_uuid(data_source_name)
        path.unlink()

    def test_fetch_flows(self):
        """
        fecth_flowsをテストする
        """

        unlink_list = []
        # ユーザとプロジェクト、フローを作成する
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            flow1_datasource_name = str(uuid.uuid4())
            unlink_list.append(flow1_datasource_name)
            flow2_datasource_name = str(uuid.uuid4())
            unlink_list.append(flow2_datasource_name)
            flow3_datasource_name = str(uuid.uuid4())
            unlink_list.append(flow3_datasource_name)

            data1 = {'project_uuid': project_uuid, 'name': 'フローテスト用', 'datasource': None}
            data2 = {'project_uuid': project_uuid, 'name': 'フローテスト用2', 'datasource': None}
            data3 = {'project_uuid': project_uuid, 'name': 'フローテスト用3', 'datasource': None}
            created_flow = model.create_flow(data1, user1, flow1_datasource_name)
            created_flow2 = model.create_flow(data2, user1, flow2_datasource_name)
            created_flow3 = model.create_flow(data3, user1, flow3_datasource_name)

         # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/flows?project=%s' % project_uuid
            response = client.get(endpoint)
            results = json.loads(response.get_data())

            flow_paths = model.get_flow_paths_by_project_uuid(project_uuid)

        # ファイル名がflow_uuidになっているのかテスト
        self.assertEqual(results['success'], True)

        # もともと既存のテスト用のフローが存在していて、それも取得してしまう。
        # 書き直すまで一旦コメントアウトしている。
        # self.assertEqual({r['projectId'] for r in results['data']}, {project_id,
        #                                                              project_id,
        #                                                              project_id})
        # self.assertEqual({r['label'] for r in results['data']}, {'フローテスト用',
        #                                                         'フローテスト用2',
        #                                                         'フローテスト用3'})
        # self.assertEqual({r['uuid'] for r in results['data']}, {flow1_datasource_name,
        #                                                         flow2_datasource_name,
        #                                                         flow3_datasource_name})

        self.assertEqual(results['navigation']['user_id'], user1)
        self.assertEqual(results['navigation']['user_name'], 'user1')
        self.assertEqual(results['navigation']['project_uuid'], project_uuid)
        self.assertEqual(results['navigation']['project_name'], 'proj1')

        # 後片付け
        for unlink_flow in unlink_list:
            path = model.get_flow_path_by_uuid(unlink_flow)
            path.unlink()

    def test_update_profile_user(self):
        """
        update_profile APIのテスト
        ユーザ情報のみ
        """
        # まずユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/profile/%s' % user1
            updated_user_name = 'new_user'
            updated_user_pass = 'new_pass'
            updated_user_email = 'new_email'

            response = client.put(endpoint,
                content_type='application/json',
                data=json.dumps({
                    'profile':{
                        'name': updated_user_name,
                        'password': updated_user_pass,
                        'email': updated_user_email
                    }
                })
            )
            result = json.loads(response.get_data())
            user = model.get_user_by_id(session['user_id'])

        self.assertEqual(result['success'], True)
        self.assertEqual(updated_user_name, user['name'])
        self.assertEqual(updated_user_pass, user['password'])
        self.assertEqual(updated_user_email, user['email'])

    @unittest.skip
    def test_update_profile_grafana(self):
        """
        update_profile APIのテスト
        grafana情報のみ
        """
        # まずユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/profile/%s' % user1
            updated_grafana_url = 'after_url'
            updated_grafana_password = 'after_pass'
            updated_grafana_id = 'after_id'

            response = client.put(endpoint,
                content_type='application/json',
                data=json.dumps({
                    'extension_tools':{
                        'grafana':{
                            'id': updated_grafana_id,
                            'password': updated_grafana_password,
                            'url': updated_grafana_url,
                        }
                    }
                })
            )
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)

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
                    'label': updated_flow_name
                })
            )
            result = json.loads(response.get_data())
            flow_path = model.get_flow_path_by_uuid(data_source_name)


        self.assertEqual(result['success'], True)
        self.assertEqual(flow_path.stem, data_source_name)
        self.assertEqual(result['data']['projectId'], project_id)
        # 名前は正しく変更されている
        self.assertEqual(result['data']['label'], updated_flow_name)
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

    def test_fetch_subflows(self):
        """
        fetch_subflows APIをテストする
        """

        unlink_list = []
        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            flow1_datasource_name = str(uuid.uuid4())
            data1 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用', 'datasource': None}
            created_flow = model.create_flow(data1, user1, flow1_datasource_name)

            # サブフロー化
            created_flow['ports'][0] = {"name": "i","type": "frame"}
            created_flow['ports'][1] = {"name": "o","type": "frame"}
            # フローを更新
            model.write_data_to_json(model.make_flow_path(flow1_datasource_name), created_flow)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/subflows'
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        # テストで作成した以外のフローもあるので、テスト対象のサブフローを探す
        for subflow in result['data']:
            if subflow['uuid'] == flow1_datasource_name:
                self.assertEqual(subflow['label'], 'サブフローテスト用')
                self.assertEqual(subflow['projectName'], 'proj1')
                self.assertEqual(subflow['ports'][0], {"name": "i","type": "frame"})
                self.assertEqual(subflow['ports'][1], {"name": "o","type": "frame"})

        # 後片付け
        path = model.get_flow_path_by_uuid(flow1_datasource_name)
        path.unlink()

    def test_fetch_subflows_no_inputs(self):
        """
        fetch_subflows APIをテストする
        portにinputがないものは出力しない
        """

        unlink_list = []
        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            # 取得すべきサブフロー（inputがある）
            flow1_datasource_name = str(uuid.uuid4())
            data1 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用', 'datasource': None}
            subflow1 = model.create_flow(data1, user1, flow1_datasource_name)
            # サブフロー化
            subflow1['ports'][0] = {"name": "i","type": "frame"}
            # フローを更新
            model.write_data_to_json(model.make_flow_path(flow1_datasource_name), subflow1)

            # 取得すべきではないサブフロー（inputがない）
            flow2_datasource_name = str(uuid.uuid4())
            data2 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用２', 'datasource': None}
            subflow2 = model.create_flow(data2, user1, flow2_datasource_name)
            # サブフロー化
            subflow2['ports'][1] = {"name": "o","type": "frame"}
            # フローを更新
            model.write_data_to_json(model.make_flow_path(flow2_datasource_name), subflow2)

            unlink_list.append(flow1_datasource_name)
            unlink_list.append(flow2_datasource_name)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/subflows?no_inputs=on'
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)


        # テストで作成した以外のフローもあるので、テスト対象のサブフローを探す
        # 取得すべきフローを取得できたかのフラグ
        found_flag = False
        for subflow in result['data']:
            # ブロック句
            # 取得すべきではないフローがあった場合、テストを失敗させる
            if subflow['uuid'] == flow2_datasource_name:
                self.assertEqual(True, False)

            if subflow['uuid'] == flow1_datasource_name:
                found_flag = True
                self.assertEqual(subflow['label'], 'サブフローテスト用')
                self.assertEqual(subflow['projectName'], 'proj1')
                self.assertEqual(subflow['ports'][0], {"name": "i","type": "frame"})

        self.assertEqual(found_flag, True)

        # 後片付け
        for unlink_flow in unlink_list:
            path = model.get_flow_path_by_uuid(unlink_flow)
            path.unlink()

    def test_fetch_subflows_has_outputs(self):
        """
        fetch_subflows APIをテストする
        portにoutputがあるものを取得する
        """

        unlink_list = []
        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            # 取得すべきサブフロー（outputがある）
            flow1_datasource_name = str(uuid.uuid4())
            data1 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用', 'datasource': None}
            subflow1 = model.create_flow(data1, user1, flow1_datasource_name)
            # サブフロー化
            subflow1['ports'][1] = {"name": "o","type": "frame"}
            # フローを更新
            model.write_data_to_json(model.make_flow_path(flow1_datasource_name), subflow1)

            # 取得すべきではないサブフロー（outputがない）
            flow2_datasource_name = str(uuid.uuid4())
            data2 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用２', 'datasource': None}
            subflow2 = model.create_flow(data2, user1, flow2_datasource_name)
            # サブフロー化
            subflow2['ports'][0] = {"name": "i","type": "frame"}
            # フローを更新
            model.write_data_to_json(model.make_flow_path(flow2_datasource_name), subflow2)

            unlink_list.append(flow1_datasource_name)
            unlink_list.append(flow2_datasource_name)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/subflows?no_outputs=on'
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)

        # テストで作成した以外のフローもあるので、テスト対象のサブフローを探す
        # 取得すべきフローを取得できたかのフラグ
        found_flag = False
        for subflow in result['data']:
            # ブロック句
            # 取得すべきではないフローがあった場合、テストを失敗させる
            if subflow['uuid'] == flow2_datasource_name:
                self.assertEqual(True, False)

            if subflow['uuid'] == flow1_datasource_name:
                found_flag = True
                self.assertEqual(subflow['label'], 'サブフローテスト用')
                self.assertEqual(subflow['projectName'], 'proj1')
                self.assertEqual(subflow['ports'][1], {"name": "o","type": "frame"})

        self.assertEqual(found_flag, True)

        # 後片付け
        for unlink_flow in unlink_list:
            path = model.get_flow_path_by_uuid(unlink_flow)
            path.unlink()

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

    def test_make_executableflows_by_frame_uuid(self):
        """
        make_executableflows APIをテストする。
        既に登録されていフレームをinputに使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する
        """
        # アップロード用に一時ファイルを作成する
        frame_uuid = str(uuid.uuid4())

        import csv
        with open('kskp/data/frames/' + frame_uuid + '.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        flow_uuid = '5e6e9c97-5379-4f2b-b8aa-cac21d80f49f'

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/executableflows',
                data={
                    'flow_uuid' : flow_uuid,
                    'i' : frame_uuid
                }
            )
            result = json.loads(response.get_data())


        # テスト
        new_flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        # 新しいフローが作られているか
        self.assertNotEqual(result['flow_uuid'], flow_uuid)
        # 実行できるようにportsやframeが置き換わっているか
        self.assertEqual(len(new_flow_json['ports'][0]), 0)
        self.assertEqual(len(new_flow_json['ports'][1]), 0)
        for node in new_flow_json['nodes']:
            if node['id'] == 'i':
                self.assertEqual(node['uuid'], frame_uuid)

        # 後片付け
        flow_path = model.get_flow_path_by_uuid(result['flow_uuid'])
        frame_path = Path('kskp/data/frames/' + frame_uuid + '.csv')
        os.remove(flow_path)
        os.remove(frame_path)

    def test_make_executableflows_by_multi_frame_uuid(self):
        """
        make_executableflows APIをテストする。
        既に登録されていフレーム（複数）をinputに使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する
        """
        # アップロード用に一時ファイルを作成する
        frame_uuid_1 = str(uuid.uuid4())
        frame_uuid_2 = str(uuid.uuid4())

        import csv
        with open('kskp/data/frames/' + frame_uuid_1 + '.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        with open('kskp/data/frames/' + frame_uuid_2 + '.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        flow_uuid = '6e6e9c97-5379-4f2b-b8aa-cac21d80f49f'

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/executableflows',
                data={
                    'flow_uuid' : flow_uuid,
                    'i' : frame_uuid_1,
                    'i2': frame_uuid_2
                }
            )
            result = json.loads(response.get_data())

        # テスト
        new_flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        # 新しいフローが作られているか
        self.assertNotEqual(result['flow_uuid'], flow_uuid)
        # 実行できるようにportsやframeが置き換わっているか
        self.assertEqual(len(new_flow_json['ports'][0]), 0)
        self.assertEqual(len(new_flow_json['ports'][1]), 0)
        for node in new_flow_json['nodes']:
            if node['id'] == 'i':
                self.assertEqual(node['uuid'], frame_uuid_1)
            if node['id'] == 'i2':
                self.assertEqual(node['uuid'], frame_uuid_2)

        # 後片付け
        flow_path = model.get_flow_path_by_uuid(result['flow_uuid'])
        frame_path_1 = Path('kskp/data/frames/' + frame_uuid_1 + '.csv')
        frame_path_2 = Path('kskp/data/frames/' + frame_uuid_2 + '.csv')
        os.remove(flow_path)
        os.remove(frame_path_1)
        os.remove(frame_path_2)

    def test_make_executableflows_by_csv_file(self):
        """
        make_executableflows APIをテストする。
        アップロードしたcsvデータを使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する。
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        with open('kskp/data/frames/test.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        f = open('kskp/data/frames/test.csv', 'br')

        flow_uuid = '5e6e9c97-5379-4f2b-b8aa-cac21d80f49f'
        frame_uuid = None

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/executableflows',
                data={
                        'flow_uuid': flow_uuid,
                        'i': f
                    }
            )
            result = json.loads(response.get_data())

        # テスト
        new_flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        # 新しいフローが作られているか
        self.assertNotEqual(result['flow_uuid'], flow_uuid)
        # 実行できるようにportsやframeが置き換わっているか
        self.assertEqual(len(new_flow_json['ports'][0]), 0)
        self.assertEqual(len(new_flow_json['ports'][1]), 0)
        for node in new_flow_json['nodes']:
            # 作成したframe_uuidは外部から与えたものではないので、nullかどうかだけみる
            if node['id'] == 'i':
                self.assertIsNotNone(node['uuid'])

        # 後片付け
        # 削除対象のframe_uuidを取得
        flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        for node in flow_json['nodes']:
            if node['id'] == 'i':
                frame_uuid = node['uuid']
                break

        # 削除
        flow_path = model.get_flow_path_by_uuid(result['flow_uuid'])
        frame_path = Path('kskp/data/frames/' + frame_uuid + '.csv')
        test_data_path = Path('kskp/data/frames/test.csv')
        os.remove(flow_path)
        os.remove(frame_path)
        os.remove(test_data_path)

    # @unittest.skip
    def test_make_executableflows_by_multi_csv_file(self):
        """
        make_executableflows APIをテストする。
        アップロードしたcsvデータ（複数）を使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する。
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        with open('kskp/data/frames/test.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})
        f = open('kskp/data/frames/test.csv', 'br')

        with open('kskp/data/frames/test2.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})
        f2 = open('kskp/data/frames/test2.csv', 'br')

        flow_uuid = '6e6e9c97-5379-4f2b-b8aa-cac21d80f49f'
        frame_uuid_1 = None
        frame_uuid_2 = None

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/executableflows',
                data={
                        'flow_uuid': flow_uuid,
                        'i': f,
                        'i2': f2
                    }
            )
            result = json.loads(response.get_data())

        # テスト
        new_flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        # 新しいフローが作られているか
        self.assertNotEqual(result['flow_uuid'], flow_uuid)
        # 実行できるようにportsやframeが置き換わっているか
        self.assertEqual(len(new_flow_json['ports'][0]), 0)
        self.assertEqual(len(new_flow_json['ports'][1]), 0)
        for node in new_flow_json['nodes']:
            # 作成したframe_uuidは外部から与えたものではないので、nullかどうかだけみる
            if node['id'] == 'i':
                self.assertIsNotNone(node['uuid'])
            if node['id'] == 'i2':
                self.assertIsNotNone(node['uuid'])

        # 後片付け
        # 削除対象のframe_uuidを取得
        flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        for node in flow_json['nodes']:
            if node['id'] == 'i':
                frame_uuid_1 = node['uuid']
            elif node['id'] == 'i2':
                frame_uuid_2 = node['uuid']

        # 削除
        flow_path = model.get_flow_path_by_uuid(result['flow_uuid'])
        frame_path_1 = Path('kskp/data/frames/' + frame_uuid_1 + '.csv')
        frame_path_2 = Path('kskp/data/frames/' + frame_uuid_2 + '.csv')
        test_data_path_1 = Path('kskp/data/frames/test.csv')
        test_data_path_2 = Path('kskp/data/frames/test2.csv')
        os.remove(flow_path)
        os.remove(frame_path_1)
        os.remove(frame_path_2)
        os.remove(test_data_path_1)
        os.remove(test_data_path_2)

    def test_make_executableflows_by_multi_csv_file(self):
        """
        make_executableflows APIをテストする。
        アップロードしたcsvデータとKSKP上に既に存在するデータを使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する。
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid = str(uuid.uuid4())

        with open('kskp/data/frames/test.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})
        f = open('kskp/data/frames/test.csv', 'br')

        with open('kskp/data/frames/' + frame_uuid + '.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        flow_uuid = '6e6e9c97-5379-4f2b-b8aa-cac21d80f49f'
        frame_uuid_1 = None
        frame_uuid_2 = frame_uuid

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/executableflows',
                data={
                        'flow_uuid': flow_uuid,
                        'i': f,
                        'i2': frame_uuid
                    }
            )
            result = json.loads(response.get_data())

        # テスト
        new_flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        # 新しいフローが作られているか
        self.assertNotEqual(result['flow_uuid'], flow_uuid)
        # 実行できるようにportsやframeが置き換わっているか
        self.assertEqual(len(new_flow_json['ports'][0]), 0)
        self.assertEqual(len(new_flow_json['ports'][1]), 0)
        for node in new_flow_json['nodes']:
            # 作成したframe_uuidは外部から与えたものではないので、nullかどうかだけみる
            if node['id'] == 'i':
                self.assertIsNotNone(node['uuid'])
            if node['id'] == 'i2':
                self.assertEqual(node['uuid'], frame_uuid)

        # 後片付け
        # 削除対象のframe_uuidを取得
        flow_json = model.fetch_flow_by_uuid(result['flow_uuid'])
        for node in flow_json['nodes']:
            if node['id'] == 'i':
                frame_uuid_1 = node['uuid']

        # 削除
        flow_path = model.get_flow_path_by_uuid(result['flow_uuid'])
        frame_path_1 = Path('kskp/data/frames/' + frame_uuid_1 + '.csv')
        frame_path_2 = Path('kskp/data/frames/' + frame_uuid_2 + '.csv')
        test_data_path_1 = Path('kskp/data/frames/test.csv')
        os.remove(flow_path)
        os.remove(frame_path_1)
        os.remove(frame_path_2)
        os.remove(test_data_path_1)

    def test_execute_subflow_by_multi_csv_file(self):
        """
        make_executableflows APIをテストする。
        アップロードしたcsvデータとKSKP上に既に存在するデータを使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する。
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid = str(uuid.uuid4())

        with open('kskp/data/frames/test.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})
        f = open('kskp/data/frames/test.csv', 'br')

        with open('kskp/data/frames/' + frame_uuid + '.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        flow_uuid = '6e6e9c97-5379-4f2b-b8aa-cac21d80f49f'
        frame_uuid_1 = None
        frame_uuid_2 = frame_uuid

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/subflows',
                data={
                        'flow_uuid': flow_uuid,
                        'i': f,
                        'i2': frame_uuid
                    }
            )
            result = json.loads(response.get_data())

        # テスト
        self.assertEqual(result['success'], True)
        # 後片付け

        # 削除
        # frame_path_1 = Path('kskp/data/frames/' + frame_uuid_1 + '.csv')
        frame_path_2 = Path('kskp/data/frames/' + frame_uuid_2 + '.csv')
        test_data_path_1 = Path('kskp/data/frames/test.csv')
        # os.remove(frame_path_1)
        os.remove(frame_path_2)
        os.remove(test_data_path_1)

        # このテストで作成したjobsだけ削除する
        for path in Path(app.root_path + '/data/jobs/').iterdir():
            job_data = json.loads(path.read_text())

            if job_data['flow']['uuid'] == flow_uuid:
                # 指定したflowでjobができているかのテスト
                self.assertEqual(job_data['flow']['uuid'], flow_uuid)
                self.assertEqual(job_data['state'], '実行完了')

                # 作成したフレームの削除
                for data in job_data['data'].values():
                    frame_path = Path('kskp/data/frames/' + data['uuid'] + '.csv')
                    os.remove(frame_path)

                # jobsの削除
                os.remove(path)

    def test_execute_subflow_by_multi_csv_file_with_args(self):
        """
        make_executableflows APIをテストする。
        アップロードしたcsvデータとKSKP上に既に存在するデータを使う。

        TODO:フローが既存のものを使用しているので、
        テスト内で作成するように変更する。
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid = str(uuid.uuid4())

        with open('kskp/data/frames/test.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})
        f = open('kskp/data/frames/test.csv', 'br')

        flow_uuid = '7e6e9c97-5379-4f2b-b8aa-cac21d80f49f'
        frame_uuid_1 = None

        args = {
            'f': "0,1"
        }

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/subflows',
                data={
                        'flow_uuid': flow_uuid,
                        'args': json.dumps(args),
                        'i': f
                    }
            )
            result = json.loads(response.get_data())

        # テスト
        self.assertEqual(result['success'], True)
        # 後片付け

        # 削除
        # frame_path_1 = Path('kskp/data/frames/' + frame_uuid_1 + '.csv')
        test_data_path_1 = Path('kskp/data/frames/test.csv')
        # os.remove(frame_path_1)
        os.remove(test_data_path_1)

        # このテストで作成したjobsだけ削除する
        for path in Path(app.root_path + '/data/jobs/').iterdir():
            job_data = json.loads(path.read_text())
            if job_data['flow']['uuid'] == flow_uuid:
                # 指定したflowでjobができているかのテスト
                self.assertEqual(job_data['flow']['uuid'], flow_uuid)
                self.assertEqual(job_data['state'], '実行完了')
                # 作成したFrameの削除
                for data in job_data['data'].values():
                    frame_path = Path('kskp/data/frames/' + data['uuid'] + '.csv')
                    os.remove(frame_path)
                # jobsの削除
                os.remove(path)

    # 中間ファイルが作成され邪魔なので、一旦スキップしておく
    @unittest.skip
    def test_execute_subflow_by_multi_csv_file_with_args2(self):
        """
        make_executableflows APIをテストする。
        アップロードしたcsvデータとKSKP上に既に存在するデータを使う。

        「新エンジンの子」サブフローにinputsとargsを与えて実行してみた。
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid = str(uuid.uuid4())

        with open('kskp/data/frames/test.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})
        f = open('kskp/data/frames/test.csv', 'br')

        flow_uuid = '1D01BA67-789B-41D5-95A9-CC84D2E4EFA7'
        frame_uuid = None

        args = {
            'c': "${quantity}>15",
            'f1': 'quantity,amount',
            'f2': 'customer'
        }

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            response = client.post('/api/v0/subflows',
                data={
                        'flow_uuid': flow_uuid,
                        'args': json.dumps(args),
                        'Ci': f
                    }
            )
            result = json.loads(response.get_data())

        # テスト
        self.assertEqual(result['success'], True)
        # 後片付け

        # 削除
        test_data_path_1 = Path('kskp/data/frames/test.csv')
        os.remove(test_data_path_1)

        # このテストで作成したjobsだけ削除する
        for path in Path(app.root_path + '/data/jobs/').iterdir():
            job_data = json.loads(path.read_text())
            if job_data['flow']['uuid'] == flow_uuid:
                # 指定したflowでjobができているかのテスト
                self.assertEqual(job_data['flow']['uuid'], flow_uuid)
                self.assertEqual(job_data['state'], '実行完了')
                # 作成したFrameの削除
                print(job_data['data'])
                for data in job_data['data'].values():
                    frame_path = Path('kskp/data/frames/' + data['uuid'] + '.csv')
                    # os.remove(frame_path)
                # jobsの削除
                os.remove(path)

    def test_visualizers_csvtohtmltable(self):
        """
        visualizers APIをテストする。
        htmlテーブル
        返ってくるのはHTML
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid_1 = str(uuid.uuid4())

        with open('kskp/data/frames/' + frame_uuid_1 + '.csv', 'w') as csv_file:
            fieldnames = ['customer', 'quantity', 'amount']
            csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            csv_writer.writeheader()
            csv_writer.writerow({'customer': 'A', 'quantity':20, 'amount':5200})
            csv_writer.writerow({'customer': 'B', 'quantity':18, 'amount':4000})
            csv_writer.writerow({'customer': 'C', 'quantity':15, 'amount':3500})
            csv_writer.writerow({'customer': 'D', 'quantity':10, 'amount':2000})
            csv_writer.writerow({'customer': 'E', 'quantity':3, 'amount':800})

        command_id = 'csvtohtmltable'

        args = {
            'limit':50,
            'offset':3
        }

        inputs = {
            'i': frame_uuid_1
        }

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/visualizers?from=%s' % command_id
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps({
                        'args': args,
                        'inputs': inputs
                    })
            )
            # result = json.loads(response.get_data())

        # テスト
        # HTMLファイルができているかどうかのテスト
        visualize_name = frame_uuid_1 + '_' + command_id
        self.assertEqual(os.path.exists('kskp/templates/visualize/%s.html' % visualize_name), True)

        # 後片付け
        os.remove('kskp/data/frames/%s.csv' % frame_uuid_1)
        os.remove('kskp/templates/visualize/%s.html' % visualize_name)

    def test_visualizers_linegraph(self):
        """
        visualizers APIをテストする。
        折れ線グラフ
        返ってくるのはHTML
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid_1 = 'f20541d4-8b8f-4787-6ea9-f1e9d3db80a1'

        command_id = 'csvtolinegraph'

        args = {
            'limit': '',
            'offset': '',
            'columns': ['temperature'],
            'x_inch': 7,
            'y_inch': 3,
            'x_axis': 'Time',
            'time_series_column': ['Time']
        }

        inputs = {
            'i': frame_uuid_1
        }

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/visualizers?from=%s' % command_id
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps({
                        'args': args,
                        'inputs': inputs
                    })
            )

        # テスト
        # 画像ファイル、HTMLファイルができているかどうかのテスト
        visualize_name = frame_uuid_1 + '_' + command_id
        self.assertEqual(os.path.exists('kskp/static/images/visualize/%s.png' % visualize_name), True)
        self.assertEqual(os.path.exists('kskp/templates/visualize/%s.html' % visualize_name), True)

        # 後片付け
        os.remove('kskp/static/images/visualize/%s.png' % visualize_name)
        os.remove('kskp/templates/visualize/%s.html' % visualize_name)

    def test_visualizers_histogram(self):
        """
        visualizers APIをテストする。
        ヒストグラム
        返ってくるのはHTML
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid_1 = '180127_1535_4sensor_5sec'

        command_id = 'csvtohistogram'

        args = {
            'limit': '',
            'offset': '',
            'columns': [1,2,3,4],
            'x_inch': 7,
            'y_inch': 3,
            'bins': 100,
            'x_axis': '',
            'alpha': 0.5
        }

        inputs = {
            'i': frame_uuid_1
        }

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/visualizers?from=%s' % command_id
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps({
                        'args': args,
                        'inputs': inputs
                    })
            )

        # テスト
        # 画像ファイル、HTMLファイルができているかどうかのテスト
        visualize_name = frame_uuid_1 + '_' + command_id
        self.assertEqual(os.path.exists('kskp/static/images/visualize/%s.png' % visualize_name), True)
        self.assertEqual(os.path.exists('kskp/templates/visualize/%s.html' % visualize_name), True)

        # 後片付け
        os.remove('kskp/static/images/visualize/%s.png' % visualize_name)
        os.remove('kskp/templates/visualize/%s.html' % visualize_name)

    def test_visualizers_scatter(self):
        """
        visualizers APIをテストする。
        散布図
        返ってくるのはHTML
        """
        # アップロード用に一時csvファイルを作成する
        import csv

        frame_uuid_1 = '180127_1535_4sensor_5sec'

        command_id = 'csvtoscatter'

        args = {
            'limit': '',
            'offset': '',
            'x_inch': 7,
            'y_inch': 5,
            'y_axis': '3H',
            'x_axis': '4H',
            'alpha': 0.5
        }

        inputs = {
            'i': frame_uuid_1
        }

        # ユーザの作成
        with app.app_context():
            user1 = setUpUser(self)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/visualizers?from=%s' % command_id
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps({
                        'args': args,
                        'inputs': inputs
                    })
            )

        # テスト
        # 画像ファイル、HTMLファイルができているかどうかのテスト
        visualize_name = frame_uuid_1 + '_' + command_id
        self.assertEqual(os.path.exists('kskp/static/images/visualize/%s.png' % visualize_name), True)
        self.assertEqual(os.path.exists('kskp/templates/visualize/%s.html' % visualize_name), True)

        # 後片付け
        os.remove('kskp/static/images/visualize/%s.png' % visualize_name)
        os.remove('kskp/templates/visualize/%s.html' % visualize_name)

    @unittest.skip
    def test_execute_flow(self):
        '''
        execute_flow APIをテストする
        7/4現在、エラー回避のためengineの__init__のexecuteのjob.dtor()を無効にしている
        7/17現在、フローの記述方法変更により、一時的にskipにしている
        '''
        flow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'

        # 実行
        with app.test_client() as client:
            endpoint = '/api/v0/frames?from=%s' % flow_uuid
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        # 生成されてほしい結果
        expected_result = {'金額合計': ['30', '120'], '顧客%0': ['A', 'B']}

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['d1'], expected_result)

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
        self.assertEqual(data['numberOfLines'], 2)
        self.assertEqual(data['fileSize'], 17)
        self.assertEqual(data['contents']['a'], ['1', '0'])
        self.assertEqual(data['contents']['b'], ['2', '1'])
        self.assertEqual(data['contents']['c'], ['3', '2'])


    def test_download_frame(self):
        """
        download_frame APIのテストをする
        """
        frame_uuid = '2c792bbc-4679-4396-96d1-94fc023073b1'
        with app.test_client() as client:
            response = client.get('/api/v0/files?type=frame&uuid=%s&ext=csv' % frame_uuid)

        # ResourceWarningが出てしまうが、特に問題ありません。
        assert True


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
    user1 = 1
    model.create_user(user1, '', 'user1', '')
    return user1


def setUpProject(self):
    user1 = setUpUser(self)

    with self.client.session_transaction() as session:
        session['user_id'] = model.get_user_id_by_email(user1)['id']

    model.create_project('proj1', session)
    project_uuid = model.get_all_projects()[0]['uuid']
    project_id = model.get_project_id_by_uuid(project_uuid)

    return (user1, project_id, project_uuid)


def setUpFlow(self):
    (user1, project_id, project_uuid) = setUpProject(self)

    # フロー作成
    new_flow_name = 'フローテスト用'
    data_source_name = str(uuid.uuid4())

    data = {
        'project_uuid': project_uuid,
        'name': new_flow_name,
        'datasouce': None
    }

    created_flow = model.create_flow(data, user1, data_source_name)

    return (user1, project_id, project_uuid, new_flow_name, data_source_name, created_flow)

import copy
class JobTestCase(unittest.TestCase):
    jobs_root = app.root_path + '/data/jobs/'
    jobs_path = Path(jobs_root)

    json_template = {
        "executedAt": "",
        "executor": {
            "name": ""
        },
        "inputs": {},
        "params": {},
        "flow": {
            "uuid": ""
        },
        "projectId": None,
        "data": {
            "d1": {
                "type": "frame",
                "uuid": "",
                "label": ""
            }
        },
        "errors": {}
    }
    SAMPLE_EXECUTOR = 'ユーザー 太郎'
    SAMPLE_FLOW_UUID = str(uuid.uuid4())

    def setUp(self):
        app.testing = True
        self.client = app.test_client()

        self.jobs_path.mkdir(parents=True, exist_ok=True)
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # もともとfor文で作成していたけど、種類が違うjobsを作成したいので（flow_uuidやprojectが異なる）
        # ちょっとバラしました
        with open (str(self.jobs_path) + '/test' + str(1) + '.json', 'w') as f:
            sample = copy.deepcopy(self.json_template)
            sample['executedAt'] = '1970-01-01T00:00:0' + str(0) + '09:00'
            sample['executor']['name'] = self.SAMPLE_EXECUTOR
            sample['flow']['uuid'] = self.SAMPLE_FLOW_UUID
            sample['data']['d1']['uuid'] = '99999999999' + str(0)
            sample['data']['d1']['label'] = str(0)
            sample['projectId'] = project_id
            json.dump(sample, f, ensure_ascii=False, indent=4)

        with open (str(self.jobs_path) + '/test' + str(2) + '.json', 'w') as f:
            sample = copy.deepcopy(self.json_template)
            sample['executedAt'] = '1970-01-01T00:00:0' + str(1) + '09:00'
            sample['executor']['name'] = self.SAMPLE_EXECUTOR
            sample['flow']['uuid'] = self.SAMPLE_FLOW_UUID
            sample['data']['d1']['uuid'] = '99999999999' + str(1)
            sample['data']['d1']['label'] = str(1)
            sample['projectId'] = project_id
            json.dump(sample, f, ensure_ascii=False, indent=4)

        with open (str(self.jobs_path) + '/test' + str(3) + '.json', 'w') as f:
            sample = copy.deepcopy(self.json_template)
            sample['executedAt'] = '1970-01-01T00:00:0' + str(2) + '09:00'
            sample['executor']['name'] = self.SAMPLE_EXECUTOR
            sample['flow']['uuid'] = self.SAMPLE_FLOW_UUID
            sample['data']['d1']['uuid'] = '99999999999' + str(2)
            sample['data']['d1']['label'] = str(2)
            sample['projectId'] = project_id
            json.dump(sample, f, ensure_ascii=False, indent=4)

    def tearDown(self):
        # ディレクトリ削除
        for f in self.jobs_path.glob('test[0-9].json'):
            f.unlink()
        pass

    def test_jobs(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定なし
        '''

        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/jobs' #???
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        for x in range(0, 3):
            #setupでの書き方と同じにしているけど、いらんやり方かな、変更に対応しやすいと思ったけど。
            node_d1_uuid = '99999999999' + str(2 - x)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data'][x]['flow']['uuid'], self.SAMPLE_FLOW_UUID)
            self.assertEqual(result['data'][x]['data']['d1']['uuid'], node_d1_uuid)
            self.assertEqual(result['data'][x]['data']['d1']['label'], str(2 - x))
            self.assertEqual(result['navigation']['user_id'], user1)
            self.assertEqual(result['navigation']['user_name'], 'user1')

    def test_jobs_count(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定あり
        '''
        with app.app_context():
            user1 = setUpUser(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            count = 1

            endpoint = '/api/v0/jobs?count=%s' % (count)
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        node_d1_uuid = '99999999999' + str(count + 1)

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][count - 1]['flow']['uuid'], self.SAMPLE_FLOW_UUID)
        self.assertEqual(result['data'][count - 1]['data']['d1']['uuid'], node_d1_uuid)
        self.assertEqual(result['data'][count - 1]['data']['d1']['label'], str(count + 1))
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')

    # client.get()の部分で
    # AttributeError: 'NoneType' object has no attribute 'read_text'
    # のエラーが出る
    # @unittest.skip('check')
    def test_jobs_flow(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定無し
        '''
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            # フロー作成
            new_flow_name = 'フローテスト用'
            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name,
                'datasouce': None
            }
            created_flow = model.create_flow(data, user1, self.SAMPLE_FLOW_UUID)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            endpoint = '/api/v0/jobs?flow=%s' % self.SAMPLE_FLOW_UUID
            response = client.get(endpoint)
            result = json.loads(response.get_data())


        for x in range(0, 3):
            #setupでの書き方と同じにしているけど、いらんやり方かな、変更に対応しやすいと思ったけど。
            node_d1_uuid = '99999999999' + str(2 - x)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data'][x]['flow']['uuid'], self.SAMPLE_FLOW_UUID)
            self.assertEqual(result['data'][x]['data']['d1']['uuid'], node_d1_uuid)
            self.assertEqual(result['data'][x]['data']['d1']['label'], str(2 - x))
            self.assertEqual(result['navigation']['user_id'], user1)
            self.assertEqual(result['navigation']['user_name'], 'user1')
            self.assertEqual(result['navigation']['project_uuid'], project_uuid)
            self.assertEqual(result['navigation']['project_name'], 'proj1')

        path = model.get_flow_path_by_uuid(self.SAMPLE_FLOW_UUID)
        path.unlink()

    # @unittest.skip('check')
    def test_jobs_flow_count(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定あり
        '''
        with app.app_context():
            # (user1, project_id, project_uuid, a, b, c) = setUpFlow(self)
            (user1, project_id, project_uuid) = setUpProject(self)
            # フロー作成
            new_flow_name = 'フローテスト用'
            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name,
                'datasouce': None
            }
            created_flow = model.create_flow(data, user1, self.SAMPLE_FLOW_UUID)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            count = 1
            # flow_uuid = '123456789' + str(count + 1)
            node_d1_uuid = '99999999999' + str(count + 1)

            endpoint = '/api/v0/jobs?flow=%s&count=%s' % (self.SAMPLE_FLOW_UUID, count)
            response = client.get(endpoint)
            result = json.loads(response.get_data())


        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][count - 1]['flow']['uuid'], self.SAMPLE_FLOW_UUID)
        self.assertEqual(result['data'][count - 1]['data']['d1']['uuid'], node_d1_uuid)
        self.assertEqual(result['data'][count - 1]['data']['d1']['label'], str(count + 1))
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')

        path = model.get_flow_path_by_uuid(self.SAMPLE_FLOW_UUID)
        path.unlink()

    def test_jobs_project(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定無し
        '''

        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1
            endpoint = '/api/v0/jobs?project=%s' % project_uuid #???
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        for x in range(0, 3):
            #setupでの書き方と同じにしているけど、いらんやり方かな、変更に対応しやすいと思ったけど
            node_d1_uuid = '99999999999' + str(2 - x)

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data'][x]['flow']['uuid'], self.SAMPLE_FLOW_UUID)
            self.assertEqual(result['data'][x]['data']['d1']['uuid'], node_d1_uuid)
            self.assertEqual(result['data'][x]['data']['d1']['label'], str(2 - x))
            self.assertEqual(result['navigation']['user_id'], user1)
            self.assertEqual(result['navigation']['user_name'], 'user1')
            self.assertEqual(result['navigation']['project_uuid'], project_uuid)
            self.assertEqual(result['navigation']['project_name'], 'proj1')

    def test_jobs_project_count(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定あり
        '''
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            count = 1

            endpoint = '/api/v0/jobs?project=%s&count=%s' % (project_uuid, count)
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        #setupでの書き方と同じにしているけど、いらんやり方かな、変更に対応しやすいと思ったけど。
        node_d1_uuid = '99999999999' + str(2)

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][count - 1]['flow']['uuid'], self.SAMPLE_FLOW_UUID)
        self.assertEqual(result['data'][count - 1]['data']['d1']['uuid'], node_d1_uuid)
        self.assertEqual(result['data'][count - 1]['data']['d1']['label'], str(count + 1))
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')

if __name__ == '__main__':
    unittest.main()
