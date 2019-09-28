import os
import io
import unittest
import tempfile
import json
import uuid
import pprint

from pathlib import Path
from werkzeug.datastructures import Headers

from kskp.web.backend.api.tests.test_case_base import TestCaseBase
from kskp.store import model
from kskp.store import ss
from kskp.web.backend import app
from kskp.store import Datum, Frame, Flow, Folder, Library, STORE_DIR
from kskp.web.backend.api.tests.utils import create_data

# 
# クラス毎にテストケースを実行してください。
# このファイルのテストケースを一括で実行するとTearDown()でエラーになります！
# 

class ProjectApiTestCase(TestCaseBase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def get_record_by_sql(self, sql):
        """
        指定したSQL文を発行し、一つの結果行を取得する
        """
        results = ss.execute(sql)
        # 結果行の最初の1件目を返す
        for result in results:
            return result
        # 結果行が0件の場合はNoneを返す
        return None

    def test_new_project(self):
        """
        POST /projects APIをテストする
        """
        project_name = 'プロジェクトです'
        data = {'name': project_name}

        user_id = 777

        # POST /projects
        self.post_uri('/api/v0/projects', data, user_id)

        # ルートフローフォルダを取得する
        root_flow_folder = model.get_flow_dir_path(user_id)

        # 保存されたフォルダを取得する
        sql = """
        select * from data D
        where D.type = 'folder'
          and creator = 777
          and exists (select * from Data P
                      where P.id = D.parent_id
                        and P.uuid = '{uuid}')
        order by id
        """.format(uuid=root_flow_folder.uuid)
        result = self.get_record_by_sql(sql)

        # フォルダが期待どうりに保存されていることを検証する
        self.assertIsNotNone(result['id'])
        self.assertEqual(result['parent_id'], root_flow_folder.id)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['path'], (Path(root_flow_folder.path) / 'プロジェクトです').as_posix())
        self.assertEqual(result['type'], 'folder')
        self.assertEqual(result['label'], project_name)
        self.assertEqual(result['creator'], user_id)
        self.assertEqual(result['modifier'], user_id)
        self.assertIsNotNone(result['created_at'])
        self.assertIsNotNone(result['modified_at'])

    def test_get_projects_api(self):
        """
        GET /projects APIをテストする
        """
        # プロジェクトを作成する
        self.post_uri('/api/v0/projects', {'name': '新しいプロジェクト'}, self.USER_ID)

        # フォルダを取得する
        results = self.get_uri('/api/v0/projects', self.USER_ID)

        # 作成したプロジェクトが取得できることを検証する
        result0 = results['data'][0]
        self.assertIsNotNone(result0['uuid'])
        self.assertEqual(result0['name'], '新しいプロジェクト')
        self.assertEqual(result0['creator_id'], self.USER_ID)
        self.assertIsNotNone(result0['creator_name'])
        self.assertIsNotNone(result0['created_at'])

        # ナビが取得できることを検証する
        navi = results['navigation']
        self.assertEqual(navi['flow_name'], '')
        self.assertEqual(navi['flow_uuid'], '')
        self.assertEqual(navi['project_name'], '')
        self.assertEqual(navi['project_uuid'], '')
        self.assertEqual(navi['user_id'], self.USER_ID)
        self.assertIsNotNone(navi['user_name'])

    def test_update_project(self):
        """
        PUT /projects APIをテストする
        """
        # フォルダを作成する
        root = Datum.find_root()
        folder = Folder(root.uuid, 'フロー格納フォルダ', self.USER_ID)
        folder.save()

        # PUT /projects
        new_label = '変更後のフォルダ名'
        json_data = {'new_name': new_label, "description": ""}
        self.put_uri(('/api/v0/projects/%s' % folder.uuid), json_data, self.USER_ID)

        # ラベル名が修正されていることを確認する
        updated_folder = Folder.find_by_uuid(folder.uuid)
        self.assertEqual(updated_folder.label, new_label)

        # フォルダを削除する
        self.assertFalse(folder.delete())

    def test_delete_project(self):
        """
        DELETE /projects APIをテストする
        """
        # フォルダを作成する
        root = Datum.find_root()
        folder = Folder(root.uuid, 'フロー格納フォルダ', self.USER_ID)
        folder.save()

        # DELETE /projects
        self.delete_uri(('/api/v0/projects/%s' % folder.uuid), self.USER_ID)

        # フォルダが消えていることを確認する
        self.assertFalse(Folder.exists(folder.uuid))


class FrameApiTestCase(TestCaseBase):

    TESTDATA_DIR = STORE_DIR.parent / Library.load_root().path

    def setUp(self):
        app.testing = True

        # frameを作る ファイル名はUUID
        self.frame_uuid = str(uuid.uuid4())
        csv_contents = 'a,b,c\n1,2,3\n0,1,2'
        self.path = app.root_path / Path('api/tests/frames/%s.csv' % self.frame_uuid)
        self.path.write_text(csv_contents, encoding='utf-8')


    def tearDown(self):
        # 後片付け
        self.path.unlink()

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
        frame_uuid = create_data(Path(self.TESTDATA_DIR) / 'test_data.csv', data)

        with app.test_client() as client:
            response = client.get('/api/v0/files?type=frame&uuid=%s&ext=csv' % frame_uuid)

        # ResourceWarningが出てしまうが、特に問題ありません。
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/csv')
        self.assertEqual(response.data,
                         b'\xe9\xa1\xa7\xe5\xae\xa2,\xe6\x95\xb0\xe9\x87\x8f,'
                         b'\xe9\x87\x91\xe9\xa1\x8d\nA,1,10\nA,2,20\nB,1,30\nB,3,40\nB,1,50\n')

        # 後片付け
        Library.delete_frame(frame_uuid)

    def test_download_file_sjis(self):
         # テストデータ作成
        data = [
            ['顧客', '数量', '金額'],
            ['A', 1, 10],
            ['A', 2, 20],
            ['B', 1, 30],
            ['B', 3, 40],
            ['B', 1, 50]
        ]
        frame_uuid = create_data(Path(self.TESTDATA_DIR) / 'test_data.csv', data)

        # S_JISに変換してダウンロードするため、環境変数を設定する
        os.environ['FRAME_CHARACTER_CODE'] = 'cp932'

        with app.test_client() as client:
            response = client.get('/api/v0/files?type=frame&uuid=%s&ext=csv' % frame_uuid)

        pprint.pprint(response.data)

        # ResourceWarningが出てしまうが、特に問題ありません。
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/csv')
        self.assertEqual(response.data,
                         b'\x8c\xda\x8bq,\x90\x94\x97\xca,\x8b\xe0\x8az\r\n'
                         b'A,1,10\r\nA,2,20\r\nB,1,30\r\nB,3,40\r\nB,1,50\r\n')

        # 後片付け
        Library.delete_frame(frame_uuid)       

class FlowApiTestCase(TestCaseBase):

    # フロー(833fdb62-2bb6-4a77-a0e1-77941ad951a3)の入力フレーム
    INPUT_FRAME_UUID = '86365ce9-9b01-4ec3-b672-7739e8f1e507'
    INPUT_FRAME_UUID2 = '2c72275f-2019-49ae-b36d-a29d1507f8dd'

    def setUp(self):
        self.db_fd, os.environ['SQLITE_PATH'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

        # テスト用フレームをライブラリに登録する
        # input_frame_path = os.path.join('kskp/data/frames', self.INPUT_FRAME_UUID + '.csv')
        input_frame_path = 'kskp/web/backend/api/tests/frames/test_frame.csv'
        self.save_frame_to_library(self.INPUT_FRAME_UUID, input_frame_path)

        # テスト用フレームをライブラリに登録する
        input_frame_path2 = 'kskp/web/backend/api/tests/flows/2C72275F-2019-49AE-B36D-A29D1507F8DD.json'
        self.save_frame_to_library(self.INPUT_FRAME_UUID2, input_frame_path2)

    def tearDown(self):
        # テスト用フレームをライブラリから削除する
        self.remove_frame_from_library(self.INPUT_FRAME_UUID)

        os.close(self.db_fd)
        os.unlink(os.environ['SQLITE_PATH'])

    def test_new_flow(self):
        """
        new_flow APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            (user1, project_id, project_uuid) = setUpProject(self)

        new_flow_name = '新しいフローです'

        data_source = {
            "id": "i",
            "type": "frame",
            "dataSource": "csv",
            "uuid": self.INPUT_FRAME_UUID2,
            "label": "test"
        }

        data1 = {
            'project_uuid': project_uuid,
            'name': new_flow_name,
            'datasource': data_source
        }

        result = self.post_uri('/api/v0/flows', data1, self.USER_ID)

        self.assertEqual(result['data']['description'], "")
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['params'], [])
        self.assertEqual(result['data']['ports'], [[],[]])
        self.assertEqual(result['data']['creator'], 'user1')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertEqual(result['data']['label'], new_flow_name)
        self.assertEqual(result['data']['nodes'][0]['dataSource'], 'csv')
        self.assertEqual(result['data']['nodes'][0]['id'], 'i')
        self.assertEqual(result['data']['nodes'][0]['label'], 'test')
        self.assertEqual(result['data']['nodes'][0]['type'], 'frame')
        self.assertEqual(result['data']['nodes'][0]['uuid'], self.INPUT_FRAME_UUID2)


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

            # flow_path = app.config['FLOW_PATH']
            with tempfile.TemporaryDirectory() as temp_dir:
                app.config['FLOW_PATH'] = temp_dir

                endpoint = '/api/v0/flows'
                response = client.post(endpoint,
                    content_type='application/json',
                    data=json.dumps(data)
                    )

            result = json.loads(response.get_data())

            # result_project_id = model.get_project_id_by_uuid(project_uuid)

            self.assertEqual(result['success'], True)
            # フローJsonのprojectIdはもやは利用していない
            # self.assertEqual(result['data']['projectId'], result_project_id)
            self.assertEqual(result['data']['label'], new_flow_name)

            # 後片付け
            # app.config['FLOW_PATH'] = flow_path


    def test_new_flow_for_copy(self):
        """
        new_flow APIをテストする
        フローコピー用
        """
        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = Flow.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER_ID)

        # コピーされていることを検証する
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー')
        self.assertEqual(result['data']['description'],'')
        self.assertEqual(result['data']['params'], [])
        self.assertEqual(result['data']['ports'], [[],[]])
        self.assertEqual(result['data']['creator'], 'user1')
        self.assertIsNotNone(result['data']['createdAt'])


    def test_new_flow_for_copy_multi(self):
        """
        new_flow APIをテストする
        フローコピー用
        """

        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = Flow.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER_ID)

        # コピーされていることを検証する
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー')
        self.assertEqual(result['data']['description'],'')
        self.assertEqual(result['data']['params'], [])
        self.assertEqual(result['data']['ports'], [[],[]])
        self.assertEqual(result['data']['creator'], 'user1')
        self.assertIsNotNone(result['data']['createdAt'])

        # 同じフローを2回コピーする
        result2 = self.post_uri('/api/v0/flows', data_copy_flow, self.USER_ID)

        # コピーされていることを検証する
        self.assertEqual(result2['data']['projectId'], None)
        self.assertEqual(result2['data']['label'], test_flow_label + ' のコピー2')
        self.assertEqual(result2['data']['description'],'')
        self.assertEqual(result2['data']['params'], [])
        self.assertEqual(result2['data']['ports'], [[],[]])
        self.assertEqual(result2['data']['creator'], 'user1')
        self.assertIsNotNone(result2['data']['createdAt'])


    def test_fetch_flow(self):
        """
        fetch_flowをテストする
        """
        # まずユーザとプロジェクトを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = Flow.find_by_uuid(test_flow_uuid).label

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER_ID
            endpoint = '/api/v0/flows/%s' % test_flow_uuid
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)

        # self.assertEqual(flow_path.stem, data_source_name)
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['label'], test_flow_label)
        self.assertEqual(result['navigation']['user_id'], self.USER_ID)
        self.assertEqual(result['navigation']['user_name'], 'user1')
        # self.assertEqual(result['navigation']['project_uuid'], )
        self.assertEqual(result['navigation']['project_name'], 'ROOT_FOLDER')
        self.assertEqual(result['navigation']['flow_name'], test_flow_label)
        self.assertEqual(result['navigation']['flow_uuid'], test_flow_uuid)


    def test_fetch_flows(self):
        """
        fecth_flowsをテストする
        """
        # まずユーザとプロジェクトを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)

        # フロー格納フォルダを取得する
        from kskp.store.model import get_flow_dir_path
        flow_folder = get_flow_dir_path(self.USER_ID)

        # フローを、フロー格納フォルダに格納する
        flow_uuid = str(uuid.uuid4())
        flow_path = 'backend/api/tests/flows/168d23c2-f835-4392-ba0e-76e94a08b719.json'
        self.save_flow_to_library(flow_uuid, flow_path)

        # フレームを、フロー格納フォルダに格納する
        f = (io.BytesIO(b"thisisaframefile"), 'wearetestmen.csv')
        self.post_frames('適当なフレーム', flow_folder.uuid, f, self.USER_ID)

        # GET /Flows
        results = self.get_uri('/api/v0/flows?project=%s' % flow_folder.uuid, self.USER_ID)

        # 結果の件数は1件以上である
        self.assertGreater(len(results['data']), 0)

        # 格納したフローが取得できることを検証する
        self.assertEqual(results['data'][0]['projectId'], 1)
        self.assertEqual(results['data'][0]['label'], 'new_flow2')
        self.assertEqual(results['data'][0]['description'],'')
        self.assertEqual(results['data'][0]['params'], [])
        self.assertEqual(results['data'][0]['ports'], [[],[]])
        self.assertEqual(results['data'][0]['creator'], '開発用')
        self.assertIsNotNone(results['data'][0]['createdAt'])

        # ナビゲーションを検証する
        self.assertEqual(results['navigation']['user_id'], self.USER_ID)
        self.assertEqual(results['navigation']['user_name'], 'user1')
        self.assertEqual(results['navigation']['project_uuid'], flow_folder.uuid)
        self.assertEqual(results['navigation']['project_name'], flow_folder.label)


    def test_fetch_flows_project_uuid_Nothing(self):
        """
        fetch_flowのprojectuuidが指定されていない場合のテスト
        """
        with app.app_context():
            setUpUser(self)

        # 実際のAPIを投げるテストを開始する
        result = self.get_uri('/api/v0/flows', self.USER_ID)

        # Projectを指定しなかった場合、例外が発生するかしないかのテスト
        # ここではとりあえず空のリストが返って来ることを期待している
        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], [])

    def test_update_flow(self):
        """
        update_flow APIをテストする
        """
        # まずユーザとプロジェクトを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER_ID
            endpoint = '/api/v0/flows/%s' % test_flow_uuid
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

        self.assertEqual(result['success'], True)
        self.assertEqual(result['data']['projectId'], None)
        # 名前は正しく変更されている
        self.assertEqual(result['data']['label'], updated_flow_name)
        # 新しい内容も入っている
        self.assertEqual(result['data']['b'], new_item)


    def test_move_flow(self):
        # ルートを取得する
        root = Datum.find_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1C", "parent": root.uuid}, self.USER_ID)
        folder_dst_uuid = folder_dst['data']['uuid']

        # ユーザとプロジェクトを作る
        with app.app_context():
            flow_uuid = setUpFlow(self)
            
        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/flows/%s' % flow_uuid, {"parent": folder_dst_uuid}, self.USER_ID)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フロー1C'
            ,'type'     : 'flow'
            ,'creator'  : 'user1'
        }

        # PUT /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /frames apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], flow_uuid)
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

    def test_delete_flow(self):
        """
        delete_flow APIをテストする
        """
        # まずユーザとプロジェクトを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)

        # APIを投げる前はフローは存在するはず
        self.assertTrue(Flow.exists(test_flow_uuid))

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER_ID
            endpoint = '/api/v0/flows/%s' % test_flow_uuid
            response = client.delete(endpoint)
            result = json.loads(response.get_data())
        # 結果のチェック
        self.assertEqual(result['success'], True)

        # with app.app_context():
        #     self.assertFalse(model.make_flow_path(data_source_name).exists())

        # フローは削除されていること
        self.assertFalse(Flow.exists(test_flow_uuid))


    def test_fetch_subflows(self):
        """
        fetch_subflows APIをテストする
        """

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
            flow_path = model.make_flow_path(flow1_datasource_name)
            model.write_data_to_json(flow_path, created_flow)

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

        # 作成したサブフローを削除する
        os.unlink(flow_path)


    def test_fetch_subflows_no_inputs(self):
        """
        fetch_subflows APIをテストする
        portにinputがないものは出力しない
        """
        with app.app_context():
            user1 = setUpUser(self)

        with app.app_context():
            # サブフロー1を作成する
            data1 = {'project_uuid': None, 'name': 'INPUTだけがあるサブフロー', 'datasource': None}
            subflow1_data = model.create_flow(data1, self.USER_ID)
            subflow1_data['ports'][0] = {"name": "i","type": "frame"}
            # サブフロー1をライブラリに保存する
            root = Datum.find_root()
            subflow1 = Flow(root.uuid, 'INPUTだけがあるサブフローA', subflow1_data, self.USER_ID)
            subflow1_uuid = subflow1.uuid
            subflow1.save()

            # サブフロー2を作成する
            data2 = {'project_uuid': None, 'name': 'OUTPUTだけがあるサブフロー', 'datasource': None}
            subflow2_data = model.create_flow(data2, self.USER_ID)
            subflow2_data['ports'][1] = {"name": "o","type": "frame"}
            # サブフロー2をライブラリに保存する
            root = Datum.find_root()
            subflow2 = Flow(root.uuid, 'OUTPUTだけがあるサブフローA', subflow2_data, self.USER_ID)
            subflow2_uuid = subflow2.uuid
            subflow2.save()

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER_ID
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
            if subflow['uuid'] == subflow2_uuid:
                self.assertEqual(True, False)

            if subflow['uuid'] == subflow1_uuid:
                found_flag = True
                self.assertEqual(subflow['label'], 'INPUTだけがあるサブフロー')
                self.assertEqual(subflow['projectName'], 'ROOT_FOLDER')
                self.assertEqual(subflow['ports'][0], {"name": "i","type": "frame"})

        self.assertEqual(found_flag, True)


    def test_fetch_subflows_has_outputs(self):
        """
        fetch_subflows APIをテストする
        portにoutputがあるものを取得する
        """
        with app.app_context():
            user1 = setUpUser(self)

        with app.app_context():
            # サブフロー1を作成する
            data1 = {'project_uuid': None, 'name': 'OUTPUTだけがあるサブフローです', 'datasource': None}
            subflow1_data = model.create_flow(data1, self.USER_ID)
            subflow1_data['ports'][1] = {"name": "o","type": "frame"}
            # サブフロー1をライブラリに保存する
            root = Datum.find_root()
            subflow1 = Flow(root.uuid, 'OUTPUTだけがあるサブフローAA', subflow1_data, self.USER_ID)
            subflow1_uuid = subflow1.uuid
            subflow1.save()

            # サブフロー2を作成する
            data2 = {'project_uuid': None, 'name': 'INPUTだけがあるサブフローです', 'datasource': None}
            subflow2_data = model.create_flow(data2, self.USER_ID)
            subflow2_data['ports'][0] = {"name": "i","type": "frame"}
            # サブフロー2をライブラリに保存する
            root = Datum.find_root()
            subflow2 = Flow(root.uuid, 'INPUTだけがあるサブフローAA', subflow2_data, self.USER_ID)
            subflow2_uuid = subflow2.uuid
            subflow2.save()

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER_ID
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
            if subflow['uuid'] == subflow2_uuid:
                self.assertEqual(True, False)

            if subflow['uuid'] == subflow1_uuid:
                found_flag = True
                self.assertEqual(subflow['label'], 'OUTPUTだけがあるサブフローです')
                self.assertEqual(subflow['projectName'], 'ROOT_FOLDER')
                self.assertEqual(subflow['ports'][1], {"name": "o","type": "frame"})

        self.assertEqual(found_flag, True)

class CacheApiTestCase(TestCaseBase):

    def test_delete_cache(self):
        from kskp.store import Datum, Flow, Frame

        root = Datum.find_root()

        datum_id = 'test'
        user_id = 1

        # キャッシュと見立てるフレームを作成する
        cache = Frame(root.uuid, 'キャッシュです', None, user_id)

        # テスト用フローデータを作成する
        flow_data = {
            'projectId': None,
            'label': 'テストフローです',
            'ports': [[],[]],
            'params': [],
            'description': ""
        }
        node = {
            "id": datum_id,
            "type": "frame",
            "dataSource": "csv",
            "uuid": cache.uuid,
            "cacheCreatedAt": '2019/01/01'
        }
        flow_data['nodes']=[]
        flow_data['nodes'].append(node)

        # フローをライブラリに保存する
        test_flow = Flow(root.uuid, 'テストフローです', flow_data, user_id)
        test_flow.save()

        self.delete_uri('/api/v0/caches?of=%s.%s' % (test_flow.uuid, datum_id), user_id)


def setUpUser(self):
    user1 = 1
    model.create_user(user1, '', 'user1', '')
    return user1


def setUpProject(self):
    user1 = setUpUser(self)

    with self.client.session_transaction() as session:
        session['user_id'] = model.get_user_id_by_email(user1)['id']

    model.create_project('proj1', session)

    from kskp.web.backend.api.lib import get_library
    default_flow = get_library(session['user_id'])
    return (user1, None, default_flow.uuid)


def setUpFlow(self):
    from kskp.store import Datum, Flow

    # ユーザIDを取得する
    (user1, project_id, project_uuid) = setUpProject(self)

    # ルートストアフォルダを取得する
    root = Datum.find_root()

    # テスト用フローのラベル名を作成する
    flow_label = 'フローテスト用です' + str(uuid.uuid4()).upper()[0:6]

    # テスト用フローデータを作成する
    request_data = {
        'project_uuid': None,
        'name': flow_label,
        'datasouce': None
    }
    flow_data = model.create_flow(request_data, user1, None)
    test_flow = Flow(root.uuid, flow_label, flow_data, user1)
    test_flow_uuid = test_flow.uuid

    # フローデータをライブラリに保存する
    test_flow.save()

    return test_flow_uuid


if __name__ == '__main__':
    unittest.main()
