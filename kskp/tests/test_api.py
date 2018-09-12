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
                session['user_id'] = model.get_user_id_by_email(email)

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
                session['user_id'] = model.get_user_id_by_email(user1)

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

                test_projects_by_user_id(model.get_user_id_by_email(user1), {proj1, proj2}) # user1だとproj1とproj2が見られる
                test_projects_by_user_id(model.get_user_id_by_email(user2), {proj2, proj3}) # user2だとproj2とproj3が見られる

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
        session['user_id'] = model.get_user_id_by_email(user1)

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

class JobTestCase(unittest.TestCase):
    def setUp(self):
        app.testing = True
        self.client = app.test_client()

    def tearDown(self):
        pass

    def test_jobs(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定なし
        テストがsample.json、sample2.jsonありきなので、書き直し予定
        '''
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'

            endpoint = '/api/v0/jobs'
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][2]['flow']['uuid'], flow_uuid)
        self.assertEqual(result['data'][2]['data']['d1']['uuid'], '860538F5-CD5B-47B5-A88A-6D2107601F89')
        self.assertEqual(result['data'][2]['data']['d2']['uuid'], 'A142C00D-8F97-4E40-97DE-789D7B117E35')
        self.assertEqual(result['data'][1]['flow']['uuid'], flow_uuid)
        self.assertEqual(result['data'][1]['data']['d1']['uuid'], '16DF44FA-2D8B-430C-B1AC-2C20954C1317')
        self.assertEqual(result['data'][1]['data']['d2']['uuid'], '754AD573-3026-41C8-9DC2-4870FC28194E')
        self.assertEqual(result['data'][0]['flow']['uuid'], 'ACA335C6-675C-49E2-A8B4-5E655CB46254')
        self.assertEqual(result['data'][0]['data']['d1']['uuid'], 'b97ee374-5b84-48ab-b971-046858937ccb')
        self.assertEqual(result['data'][0]['data']['d2']['uuid'], '2C72275F-2019-49AE-B36D-A29D1507F8DD')
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')

    def test_jobs_count(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定あり
        テストがsample.jsonありきなので、書き直し予定
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

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][count - 1]['flow']['uuid'], 'ACA335C6-675C-49E2-A8B4-5E655CB46254')
        self.assertEqual(result['data'][count - 1]['data']['d1']['uuid'], 'b97ee374-5b84-48ab-b971-046858937ccb')
        self.assertEqual(result['data'][count - 1]['data']['d2']['uuid'], '2C72275F-2019-49AE-B36D-A29D1507F8DD')
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')

    def test_jobs_flow(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定無し
        テストがsample.jsonありきなので、書き直し予定
        '''
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'

            endpoint = '/api/v0/jobs?flow=%s' % flow_uuid
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][1]['flow']['uuid'], flow_uuid)
        self.assertEqual(result['data'][1]['data']['d1']['uuid'], '860538F5-CD5B-47B5-A88A-6D2107601F89')
        self.assertEqual(result['data'][1]['data']['d2']['uuid'], 'A142C00D-8F97-4E40-97DE-789D7B117E35')
        self.assertEqual(result['data'][0]['flow']['uuid'], flow_uuid)
        self.assertEqual(result['data'][0]['data']['d1']['uuid'], '16DF44FA-2D8B-430C-B1AC-2C20954C1317')
        self.assertEqual(result['data'][0]['data']['d2']['uuid'], '754AD573-3026-41C8-9DC2-4870FC28194E')
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')

    def test_jobs_flow_count(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定あり
        テストがsample.jsonありきなので、書き直し予定
        '''
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'
            count = 1

            endpoint = '/api/v0/jobs?flow=%s&count=%s' % (flow_uuid, count)
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][count - 1]['flow']['uuid'], flow_uuid)
        self.assertEqual(result['data'][count - 1]['data']['d1']['uuid'], '16DF44FA-2D8B-430C-B1AC-2C20954C1317')
        self.assertEqual(result['data'][count - 1]['data']['d2']['uuid'], '754AD573-3026-41C8-9DC2-4870FC28194E')
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')

    def test_jobs_project(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定無し
        テストがsample.jsonありきなので、書き直し予定
        '''
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            count = 1

            endpoint = '/api/v0/jobs?project=%s' % project_uuid
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][1]['flow']['uuid'], '2C096E39-28BD-491B-B0E2-7ECFFD113304')
        self.assertEqual(result['data'][1]['data']['d1']['uuid'], '860538F5-CD5B-47B5-A88A-6D2107601F89')
        self.assertEqual(result['data'][1]['data']['d2']['uuid'], 'A142C00D-8F97-4E40-97DE-789D7B117E35')
        self.assertEqual(result['data'][0]['flow']['uuid'], 'ACA335C6-675C-49E2-A8B4-5E655CB46254')
        self.assertEqual(result['data'][0]['data']['d1']['uuid'], 'b97ee374-5b84-48ab-b971-046858937ccb')
        self.assertEqual(result['data'][0]['data']['d2']['uuid'], '2C72275F-2019-49AE-B36D-A29D1507F8DD')
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')

    def test_jobs_project_count(self):
        '''
        実行履歴を取得するAPIのテスト
        count指定あり
        テストがsample.jsonありきなので、書き直し予定
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

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'][count - 1]['flow']['uuid'], 'ACA335C6-675C-49E2-A8B4-5E655CB46254')
        self.assertEqual(result['data'][count - 1]['data']['d1']['uuid'], 'b97ee374-5b84-48ab-b971-046858937ccb')
        self.assertEqual(result['data'][count - 1]['data']['d2']['uuid'], '2C72275F-2019-49AE-B36D-A29D1507F8DD')
        self.assertEqual(result['navigation']['user_id'], user1)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        self.assertEqual(result['navigation']['project_uuid'], project_uuid)
        self.assertEqual(result['navigation']['project_name'], 'proj1')

if __name__ == '__main__':
    unittest.main()
