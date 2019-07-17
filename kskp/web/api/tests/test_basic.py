import os
import unittest
import tempfile
import json
import uuid
from pathlib import Path

from kskp.web import app
# from .test_case_base import TestCaseBase
from kskp.store import model, FLOW_PATH

from .utils import setUpUser, setUpProject, setUpFlow, remove_copy_flow_files, create_data
from kskp.store import Library, STORE_DIR

class ApiTestCase(unittest.TestCase):

    # フロー(833fdb62-2bb6-4a77-a0e1-77941ad951a3)の入力フレーム
    INPUT_FRAME_UUID = '86365ce9-9b01-4ec3-b672-7739e8f1e507'

    def setUp(self):
        self.db_fd, os.environ['SQLITE_PATH'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

        # テスト用フレームをライブラリに登録する
        # input_frame_path = os.path.join('kskp/data/frames', self.INPUT_FRAME_UUID + '.csv')
        # self.save_frame_to_library(self.INPUT_FRAME_UUID, input_frame_path)

    def tearDown(self):
        # テスト用フレームをライブラリから削除する
        # self.remove_frame_from_library(self.INPUT_FRAME_UUID)

        os.close(self.db_fd)
        os.unlink(os.environ['SQLITE_PATH'])

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

            data = '{"name": "%s"}' % project_name
            resp = self.client.post('/api/v0/projects',
                content_type='application/json',
                data=data
            )

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
        """
        get_projects APIをテストする
        """
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
        """
        delete_project APIをテストする
        """
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

    def test_update_project(self):
        """
        update_project APIをテストする
        """
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

            # 更新前のプロジェクト名を調べる
            projects_before = model.get_all_projects()
            self.assertEqual(len(projects_before), 1)
            uuid = projects_before[0]['uuid']

            name = projects_before[0]['name']
            new_name = "変更後のプロジェクト名"

            with app.test_client() as client:
                with client.session_transaction() as session:
                    session['user_id'] = user1

                data = {
                    "new_name": new_name,
                    "description": ""
                }
                response = client.put('/api/v0/projects/%s' % uuid,
                                    content_type='application/json',
                                    data=json.dumps(data)
                                    )

                result = json.loads(response.get_data())

                self.assertEqual(result['success'], True)

            # 更新のプロジェクトの数を調べる
            projects_after_name = model.get_project_by_uuid(uuid)['name']
            self.assertEqual(projects_after_name, new_name)


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

            new_flow_name = str(uuid.uuid4())
            new_frame_uuid = str(uuid.uuid4())

            # 必要最低限の項目だけを送る
            data_source = {
                "id": "i",
                "type": "frame",
                "dataSource": "csv",
                "uuid": new_frame_uuid,
                "label": "test"
            }

            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name,
                'datasource': data_source
            }

            endpoint = '/api/v0/flows'
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data)
                )

            result = json.loads(response.get_data())

            result_project_id = model.get_project_by_uuid(project_uuid)['id']

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['description'], "")
            self.assertEqual(result['data']['projectId'], result_project_id)
            self.assertEqual(result['data']['label'], new_flow_name)
            self.assertEqual(result['data']['nodes'][0]['uuid'], new_frame_uuid)
            self.assertEqual(result['data']['nodes'][0]['label'], "test")

            # 後片付け
            # uuidがわからないので、labelで判断して消している
            # そのためにフローの名前はuuidで作っている
            for flow_path in Path(FLOW_PATH).iterdir():
                try:
                    if not flow_path.suffix == '.json':
                        continue
                    data = json.loads(flow_path.read_text(encoding='utf-8'))
                    if data['label'] == new_flow_name:
                        flow_path.unlink()
                        break
                except json.JSONDecodeError as e:
                    continue

    def test_new_flow_for_copy(self):
        """
        new_flow APIをテストする
        フローコピー用
        1回だけコピー
        """

        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)


        copy_flow_label = new_flow_name + ' のコピー'

        # 前のテストが失敗してフローのコピーが残っていればそれを削除する
        remove_copy_flow_files(data_source_name, copy_flow_label, project_id)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            # フローをコピーする
            data_copy_flow = {
                'original_flow_uuid': data_source_name
            }

            endpoint = '/api/v0/flows'
            copy_response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data_copy_flow)
                )

            result = json.loads(copy_response.get_data())

            # コピーされているかの確認
            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['label'], copy_flow_label)

            # 後片付け
            os.remove(FLOW_PATH + '/' + data_source_name + '.json')
            remove_copy_flow_files(data_source_name, copy_flow_label, project_id)

    def test_new_flow_for_copy_multi(self):
        """
        new_flow APIをテストする
        フローコピー用
        2回コピーする
        """

        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)

        copy_flow_label_1 = new_flow_name + ' のコピー'
        copy_flow_label_2 = new_flow_name + ' のコピー2'

        # 前のテストが失敗してフローのコピーが残っていればそれを削除する
        remove_copy_flow_files(data_source_name, copy_flow_label_1, project_id)
        remove_copy_flow_files(data_source_name, copy_flow_label_2, project_id)

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            # フローをコピーする
            data_copy_flow = {
                'original_flow_uuid': data_source_name
            }

            endpoint = '/api/v0/flows'

            # 同じフローを2回コピーする
            copy_response_1 = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data_copy_flow)
                )

            copy_response_2 = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data_copy_flow)
                )

            result_1 = json.loads(copy_response_1.get_data())
            result_2 = json.loads(copy_response_2.get_data())

            # コピーされているかの確認
            self.assertEqual(result_1['success'], True)
            self.assertEqual(result_1['data']['label'], copy_flow_label_1)

            self.assertEqual(result_2['success'], True)
            self.assertEqual(result_2['data']['label'], copy_flow_label_2)

            # 後片付け
            os.remove(FLOW_PATH + '/' + data_source_name + '.json')
            for path in Path(FLOW_PATH).iterdir():
                with open(path) as f:
                    if path.name == '.DS_Store':
                        continue
                    flow_json = json.load(f)
                    if (flow_json['label'] == copy_flow_label_1 or flow_json['label'] == copy_flow_label_2) \
                        and flow_json['projectId'] == project_id:
                        path.unlink()

    def test_new_flow_nothing_datasource(self):
        """
        new_flow APIをテストする
        データソースなしで新規作成
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            new_flow_name = str(uuid.uuid4())

            # 必要最低限の項目だけを送る
            self.assertIsNotNone(project_uuid)

            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name
            }


            endpoint = '/api/v0/flows'
            response = client.post(endpoint,
                content_type='application/json',
                data=json.dumps(data)
                )

            result = json.loads(response.get_data())

            result_project_id = model.get_project_by_uuid(project_uuid)['id']

            self.assertEqual(result['success'], True)
            self.assertEqual(result['data']['projectId'], result_project_id)
            self.assertEqual(result['data']['label'], new_flow_name)

            # 後片付け
            for flow_path in Path(FLOW_PATH).iterdir():
                try:
                    if not flow_path.suffix == '.json':
                        continue
                    data = json.loads(flow_path.read_text(encoding='utf-8'))
                    if data['label'] == new_flow_name:
                        flow_path.unlink()
                        break
                except json.JSONDecodeError as e:
                    continue

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

        self.assertTrue({project_id,project_id,project_id}
                        <= {r['projectId'] for r in results['data']})
        self.assertTrue({'フローテスト用','フローテスト用2','フローテスト用3'}
                        <= {r['label'] for r in results['data']})
        self.assertTrue({flow1_datasource_name,flow2_datasource_name,flow3_datasource_name}
                        <= {r['uuid'] for r in results['data']})

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
        # テストで作成した以外のサブフローがあるかもなので、テスト対象のサブフローを探す
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
        portにinputがあるものを取得する
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
        # 一応中身があるのだけ確認
        self.assertTrue(len(result['data']) > 0)
        data = result['data']
        # pprint.pprint(data)

    def test_fetch_visualizers(self):
        """
        fetch_visualizers APIをテストする
        上記fetch_commandsのテストと同様中身の確認は現状していない
        """

        with app.test_client() as client:
            response = client.get('/api/v0/visualizers')
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        # 一応中身があるのだけ確認
        self.assertTrue(len(result['data']) > 0)
        data = result['data']
        # pprint.pprint(data)

    def test_download_file(self):
        """
        download_file APIのテストをする
        """
        # テストデータ作成
        data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_uuid = create_data(Path('kskp/data') / 'test_data.csv', data)

        with app.test_client() as client:
            response = client.get('/api/v0/files?type=frame&uuid=%s&ext=csv' % frame_uuid)

        # ResourceWarningが出てしまうが、特に問題ありません。
        assert True

        # 後片付け
        Library.delete_frame(frame_uuid)

    def test_delete_cache(self):
        import csv
        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1,
             project_id, project_uuid,
             new_flow_name, data_source_name, created_flow) = setUpFlow(self)

        # キャッシュデータ作成
        data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        datum_id = 'test'
        frame_uuid = create_data((STORE_DIR / 'frames/csv/フロー実行キャッシュ/test_data.csv'), data)

        flow_path = Path(FLOW_PATH) / (data_source_name + '.json')
        flow_json = json.loads(flow_path.read_text(), encoding='utf-8')
        node = {
            "id": datum_id,
            "type": "frame",
            "dataSource": "csv",
            "uuid": frame_uuid,
            "cacheCreatedAt": '2019/01/01'
        }
        flow_json['nodes'] = []
        flow_json['nodes'].append(node)
        flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1

            endpoint = '/api/v0/caches?of=%s.%s' % (data_source_name, datum_id)
            response = client.delete(endpoint)
            result = json.loads(response.get_data())

        # # テスト
        # frameが消えているか
        self.assertEqual(result['success'], True)
        self.assertIsNone(Library.load_frame(frame_uuid))
        # jsonのuuidが書き換わっているかどうか
        flow_json = json.loads(flow_path.read_text(), encoding='utf-8')
        self.assertIsNone(flow_json['nodes'][0]['uuid'])

        # 後片付け
        flow_path.unlink()
