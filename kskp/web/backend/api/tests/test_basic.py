import os
import io
import unittest
import tempfile
import json
import uuid
import pprint

from pathlib import Path

from kskp.web.backend import app
from kskp.store import Datum, Flow
from .api_test_case_base import ApiTestCaseBase

# 
# クラス毎にテストケースを実行してください。
# このファイルのテストケースを一括で実行するとTearDown()でエラーになります！
# 

class ProjectApiTestCase(ApiTestCaseBase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def get_record_by_sql(self, sql):
        """
        指定したSQL文を発行し、一つの結果行を取得する
        """
        results = self.factory._session.execute(sql)
        # 結果行の最初の1件目を返す
        for result in results:
            return result
        # 結果行が0件の場合はNoneを返す
        return None

    def test_new_project(self):
        """
        POST /projects APIをテストする
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        project_name = 'プロジェクトです'
        data = {'parent': root.uuid,
                'label'  : project_name}

        # POST /projects
        result = self.post_uri('/api/v0/projects', data, self.USER1)
        project_uuid = result['data']['uuid']

        # 保存されたプロジェクトを取得する
        sql = f"""
        select * from data D
        where D.type = 'project'
          and D.uuid = '{project_uuid}'
          and creator = {self.USER1.id}
          and exists (select * from Data P
                      where P.id = D.parent_id
                        and P.uuid = '{root.uuid}')
        order by id
        """
        result = self.get_record_by_sql(sql)

        # フォルダが期待どうりに保存されていることを検証する
        self.assertIsNotNone(result['id'])
        self.assertEqual(result['parent_id'], root.id)
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['path'], (Datum._to_rel_path(root.path) / 'プロジェクトです').as_posix())
        self.assertEqual(result['type'], 'project')
        self.assertEqual(result['label'], project_name)
        self.assertEqual(result['creator'], self.USER1.id)
        self.assertEqual(result['modifier'], self.USER1.id)
        self.assertIsNotNone(result['created_at'])
        self.assertIsNotNone(result['modified_at'])

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

    def test_get_projects_api(self):
        """
        GET /projects APIをテストする
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : '新しいプロジェクト'}
        result = self.post_uri('/api/v0/projects', data, self.USER2)
        project_uuid = result['data']['uuid']

        # プロジェクトを取得する
        results = self.get_uri('/api/v0/projects', self.USER2)

        # 結果の件数は1件以上である
        self.assertGreater(len(results['data']), 0)

        # 作成したプロジェクトが取得できることを検証する
        result0 = results['data'][0]
        self.assertIsNotNone(result0['uuid'])
        self.assertEqual(result0['type'], 'project')
        self.assertIsNotNone(result0['creator'])
        self.assertIsNotNone(result0['createdAt'])

        # ナビが取得できることを検証する
        navi = results['navigation']
        self.assertEqual(navi['flow_name'], '')
        self.assertEqual(navi['flow_uuid'], '')
        self.assertEqual(navi['project_name'], '')
        self.assertEqual(navi['project_uuid'], '')
        self.assertEqual(navi['user_id'], self.USER2.id)
        self.assertEqual(navi['user_name'], self.USER2.name)
        self.assertEqual(navi['depo_name'], 'Unit Test')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

    def test_get_project_except_my_project(self):
        """
        GET /projects?except_myproject=on APIをテストする
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : 'MyProject'}
        result = self.post_uri('/api/v0/projects', data, self.USER2)
        project1_uuid = result['data']['uuid']

        data = {'parent': root.uuid,
                'label' : 'myproject'}
        result = self.post_uri('/api/v0/projects', data, self.USER2)
        project2_uuid = result['data']['uuid']

        data = {'parent': root.uuid,
                'label' : 'MyProject '}
        result = self.post_uri('/api/v0/projects', data, self.USER2)
        project3_uuid = result['data']['uuid']

        # 作成したプロジェクトが取得できること
        results = self.get_uri('/api/v0/projects?except_myproject=off', self.USER1)
        self.assertEqual(len(results['data']), 3)
        self.assertEqual(results['data'][0]['label'], 'MyProject ')
        self.assertEqual(results['data'][1]['label'], 'myproject')
        self.assertEqual(results['data'][2]['label'], 'MyProject')

        # MyProjectを除外して取得できること
        results = self.get_uri('/api/v0/projects?except_myproject=on', self.USER1)
        self.assertEqual(len(results['data']), 2)
        self.assertEqual(results['data'][0]['label'], 'MyProject ')
        self.assertEqual(results['data'][1]['label'], 'myproject')

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER2)
        self.delete_uri(f'/api/v0/projects/{project2_uuid}', self.USER2)
        self.delete_uri(f'/api/v0/projects/{project3_uuid}', self.USER2)

    def test_get_project(self):
        """
        GET /projects APIをテストする
        """
        # プロジェクトを作成する
        root = self.factory.data.load_root()
        project = root.create_project_folder('フロー格納フォルダA')
        project.save()

        # プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project.uuid}', self.USER1)

        # 期待するJSONが返ることを確認する
        self.assertEqual(result['data']['uuid'], project.uuid)
        self.assertEqual(result['data']['type'], 'project')
        self.assertEqual(result['data']['label'], 'フロー格納フォルダA')
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root.uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project.uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_update_project(self):
        """
        PUT /projects APIをテストする
        """
        # フォルダを作成する
        root = self.factory.data.load_root()
        project = root.create_project_folder('フロー格納フォルダ')
        project.save()

        # PUT /projects
        new_label = '変更後のフォルダ名'
        json_data = {'label': new_label, "description": ""}
        self.put_uri(('/api/v0/projects/%s' % project.uuid), json_data, self.USER1)

        # ラベル名が修正されていることを確認する
        # GET /projects/[uuid] が無いので GET /folders/[uuid] で確認する
        result = self.get_uri(f'/api/v0/folders/{project.uuid}', self.USER1)
        self.assertEqual(result['data']['label'], new_label)

        # フォルダを削除する
        project = self.factory.data.find_by_uuid(project.uuid)
        self.assertFalse(project.delete())

    @unittest.skip('Projectの移動は禁止する仕様に変更した')
    def test_move_project(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動元フォルダを作成する(POST /projects)
        folder_src = self.post_uri('/api/v0/projects', {"label" : "新しいフォルダ1", "parent": root.uuid}, self.USER1)
        folder_src_uuid = folder_src['data']['uuid']

        # 移動先フォルダを作成する(POST /projects)
        folder_dst = self.post_uri('/api/v0/projects', {"label" : "新しいフォルダ2", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri('/api/v0/projects/%s' % folder_src_uuid, {"parent": folder_dst_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいフォルダ1'
            ,'type'     : 'project'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /projects apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /projects apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], folder_src_uuid)
        self.assertEqual(result['data']['label'], expected_result['label'])
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # フォルダに対応するディレクトリが存在することを検証する
        self.assertTrue(os.path.isdir((root.path / '新しいフォルダ2' / '新しいフォルダ1').as_posix()))

    def test_delete_project(self):
        """
        DELETE /projects APIをテストする
        """
        # ルートフォルダを取得する(GET /library)
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']

        # プロジェクトを作成する(POST /project)
        data = {'parent': root_uuid,
                'label' : 'フロー格納フォルダ'}
        result = self.post_uri('/api/v0/projects', data, self.USER1)
        project_uuid = result['data']['uuid']

        # DELETE /projects
        self.delete_uri((f'/api/v0/projects/{project_uuid}'), self.USER1)

        # プロジェクトはゴミ箱に移動していること
        project = self.factory.data.find_by_uuid(project_uuid)
        self.assertEqual(project.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

class FrameApiTestCase(ApiTestCaseBase):

    def setUp(self):
        app.testing = True

        # frameを作る ファイル名はUUID
        self.frame_uuid = str(uuid.uuid4())
        csv_contents = 'a,b,c\n1,2,3\n0,1,2'
        self.path = app.root_path / Path('api/tests/frames/%s.csv' % self.frame_uuid)
        os.makedirs(self.path.parent, exist_ok=True)
        self.path.write_text(csv_contents, encoding='utf-8')

        self.TESTDATA_DIR = self.factory.data.load_root().path

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
        frame_uuid = self.create_data(Path(self.TESTDATA_DIR) / 'test_data.csv', data)

        # テストデータをダウンロードする
        result = self.get_file(f'/api/v0/files?type=frame&uuid={frame_uuid}&ext=csv', self.USER1)

        # 作成したテストデータとダウンロードしたデータが一致すること
        self.assertEqual(result,
                         b'\xe9\xa1\xa7\xe5\xae\xa2,\xe6\x95\xb0\xe9\x87\x8f,'
                         b'\xe9\x87\x91\xe9\xa1\x8d\nA,1,10\nA,2,20\nB,1,30\nB,3,40\nB,1,50\n')

        # 後片付け
        frame = self.factory.data.find_by_uuid(frame_uuid)
        frame.delete()

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
        frame_uuid = self.create_data(Path(self.TESTDATA_DIR) / 'test_data.csv', data)

        # S_JISに変換してダウンロードするため、環境変数を設定する
        os.environ['FRAME_CHARACTER_CODE'] = 'cp932'
        
        # テストデータをダウンロードする
        result = self.get_file(f'/api/v0/files?type=frame&uuid={frame_uuid}&ext=csv', self.USER1)

        # 作成したテストデータがS_JISに変換されていること
        self.assertEqual(result,
                         b'\x8c\xda\x8bq,\x90\x94\x97\xca,\x8b\xe0\x8az\r\n'
                         b'A,1,10\r\nA,2,20\r\nB,1,30\r\nB,3,40\r\nB,1,50\r\n')

        # 後片付け
        frame = self.factory.data.find_by_uuid(frame_uuid)
        frame.delete()

class FlowApiTestCase(ApiTestCaseBase):

    # フロー(833fdb62-2bb6-4a77-a0e1-77941ad951a3)の入力フレーム
    INPUT_FRAME_UUID = '86365ce9-9b01-4ec3-b672-7739e8f1e507'
    INPUT_FRAME_UUID2 = '2c72275f-2019-49ae-b36d-a29d1507f8dd'

    def setUp(self):
        self.db_fd, os.environ['SQLITE_PATH'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        # with app.app_context():
        #     model.init_db()

        # # テスト用フレームをライブラリに登録する
        # # input_frame_path = os.path.join('kskp/data/frames', self.INPUT_FRAME_UUID + '.csv')
        # input_frame_path = 'kskp/web/backend/api/tests/frames/test_frame.csv'
        # self.save_frame_to_library(self.INPUT_FRAME_UUID, input_frame_path)

        # # テスト用フレームをライブラリに登録する
        # input_frame_path2 = 'kskp/web/backend/api/tests/flows/2C72275F-2019-49AE-B36D-A29D1507F8DD.json'
        # self.save_frame_to_library(self.INPUT_FRAME_UUID2, input_frame_path2)

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(os.environ['SQLITE_PATH'])

    def test_new_flow(self):
        """
        new_flow APIをテストする
        """

        # まずプロジェクトを作る
        project_uuid = self.factory.data.load_root().uuid

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

        result = self.post_uri('/api/v0/flows', data1, self.USER1)

        self.assertEqual(result['data']['description'], "")
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['params'], [])
        self.assertEqual(result['data']['ports'], [[],[]])
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
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
        # まずプロジェクトを作る
        project_uuid = self.factory.data.load_root().uuid

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER1.id

            new_flow_name = '新しいフローです'
            new_flow_data_source_name = str(uuid.uuid4())

            # 必要最低限の項目だけを送る
            self.assertIsNotNone(project_uuid)

            data = {
                'project_uuid': project_uuid,
                'name': new_flow_name
            }

            with tempfile.TemporaryDirectory() as temp_dir:
                # app.config['FLOW_PATH'] = temp_dir

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
            test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー')
        self.assertEqual(result['data']['description'],'')
        self.assertEqual(result['data']['params'], [])
        self.assertEqual(result['data']['ports'], [[],[]])
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])


    def test_new_flow_for_copy_multi(self):
        """
        new_flow APIをテストする
        フローコピー用
        """

        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する
        self.assertEqual(result['data']['projectId'], None)
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー')
        self.assertEqual(result['data']['description'],'')
        self.assertEqual(result['data']['params'], [])
        self.assertEqual(result['data']['ports'], [[],[]])
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # 同じフローを2回コピーする
        result2 = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する
        self.assertEqual(result2['data']['projectId'], None)
        self.assertEqual(result2['data']['label'], test_flow_label + ' のコピー_2')
        self.assertEqual(result2['data']['description'],'')
        self.assertEqual(result2['data']['params'], [])
        self.assertEqual(result2['data']['ports'], [[],[]])
        self.assertEqual(result2['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result2['data']['createdAt'])

    def test_copy_flow_using_cache(self):
        """
        キャッシュデータを持つフローをコピーした場合は、
        そのキャッシュデータもコピーすることを確認する
        """

        # mnewstrコマンド1つのフロー
        test_flow = {
            "label": "テストフロ",
            "params": [],
            "description": "",
            "ports": [
                [],
                [
                    {
                        "type": "frame", 
                        "label": "d", 
                        "nodeId": "d"
                    }
                ]
            ],
            "nodes": [
                {
                    "id": "c", 
                    "args": {
                    "I": "1", 
                    "S": "1", 
                    "a": "i", 
                    "l": "10"
                    }, 
                    "dsts": {
                    "o": "d"
                    },
                    "srcs": {}, 
                    "type": "command", 
                    "error": {}, 
                    "label": "連番データの新規生成", 
                    "commandId": "mnewnumber", 
                    "srcsOrder": []
                },
                {
                    "id": "d", 
                    "size": {
                    "width": 38, 
                    "height": 38
                    }, 
                    "type": "frame", 
                    "uuid": None, 
                    "label": "d", 
                    "makeCache": True, 
                    "dataSource": "csv", 
                    "cacheCreatedAt": ""
                }
            ]
        }

        # フローを新規作成する
        test_flow_uuid = setUpFlow(self, save_flow=test_flow)

        # 新規作成したフローを実行してキャッシュを生成する
        self.get_uri(f'/api/v0/frames?from={test_flow_uuid}', self.USER1)

        # 生成したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)
        cache_uuid1 = result['data']['flow']['nodes'][1]['uuid']

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # 複製したキャッシュのUUIDを取得する
        cache_uuid2 = result['data']['nodes'][1]['uuid']

        # キャッシュが存在することを検証する
        # (no frame existsの例外が送出されたいことを検証する)
        self.get_uri(f'/api/v0/frames/{cache_uuid1}', self.USER1)
        self.get_uri(f'/api/v0/frames/{cache_uuid2}', self.USER1)

        # キャッシュがコピーされていることを検証する
        # (フローJSONに記録されたキャッシュのUUIDが異なることを検証する)
        self.assertNotEqual(cache_uuid2, cache_uuid1)

    def test_fetch_flow(self):
        """
        fetch_flowをテストする
        """
        # まずユーザとプロジェクトを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER1.id
            endpoint = '/api/v0/flows/%s' % test_flow_uuid
            response = client.get(endpoint)
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)

        # self.assertEqual(flow_path.stem, data_source_name)

        # GET /flows/<uuid>の結果を検証する
        self.assertEqual(result['data']['uuid'], test_flow_uuid)
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['label'], test_flow_label)
        self.assertEqual(result['data']['prevFolderPath'], None)
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertEqual(result['data']['flow']['projectId'], None)
        self.assertEqual(result['data']['flow']['label'], test_flow_label)
        self.assertEqual(result['data']['flow']['params'], [])
        self.assertEqual(result['data']['flow']['ports'], [[],[]])
        self.assertEqual(result['navigation']['user_id'], self.USER1.id)
        self.assertEqual(result['navigation']['user_name'], 'ユーザー管理者')
        # self.assertEqual(result['navigation']['project_uuid'], )
        self.assertEqual(result['navigation']['project_name'], 'ライブラリ')
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
        flow_folder = root_flow_folder = self.factory.data.load_flow_folder()

        # フローを、フロー格納フォルダに格納する
        flow_uuid = str(uuid.uuid4())
        flow_path = 'backend/api/tests/flows/168d23c2-f835-4392-ba0e-76e94a08b719.json'
        self.save_flow_to_library(flow_uuid, flow_path)

        # フレームを、フロー格納フォルダに格納する
        f = (io.BytesIO(b"thisisaframefile"), 'wearetestmen.csv')
        self.post_frames('適当なフレーム', flow_folder.uuid, f, self.USER1)

        # GET /Flows
        results = self.get_uri('/api/v0/flows?project=%s' % flow_folder.uuid, self.USER1)

        # 結果の件数は1件以上である
        self.assertGreater(len(results['data']), 0)

        # 格納したフローが取得できることを検証する
        # self.assertEqual(results['data'][0]['projectId'], 1)
        self.assertEqual(results['data'][0]['label'], 'テストフロー！(FlowApiTestCase)')
        # self.assertEqual(results['data'][0]['description'],'')
        # self.assertEqual(results['data'][0]['params'], [])
        # self.assertEqual(results['data'][0]['ports'], [[],[]])
        self.assertEqual(results['data'][0]['creator'], 'ユーザー管理者')
        self.assertIsNotNone(results['data'][0]['createdAt'])

        # ナビゲーションを検証する
        self.assertEqual(results['navigation']['user_id'], self.USER1.id)
        self.assertEqual(results['navigation']['user_name'], 'ユーザー管理者')
        self.assertEqual(results['navigation']['project_uuid'], flow_folder.uuid)
        self.assertEqual(results['navigation']['project_name'], flow_folder.label)


    def test_fetch_flows_project_uuid_Nothing(self):
        """
        fetch_flowのprojectuuidが指定されていない場合のテスト
        """
        # 実際のAPIを投げるテストを開始する
        result = self.get_uri('/api/v0/flows', self.USER1)

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

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':test_flow_uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER1.id
            endpoint = '/api/v0/flows/%s' % test_flow_uuid
            updated_flow_name = '変更後だよ'
            new_item = 'vjq@aer'
            response = client.put(endpoint,
                content_type='application/json',
                data=json.dumps({
                    'flow': {'label': updated_flow_name, 'b':new_item},
                    'label': updated_flow_name,
                    'lock' : lock_uuid
                })
            )
            result = json.loads(response.get_data())

        self.assertEqual(result['success'], True)
        # self.assertEqual(result['data']['projectId'], None)
        # 名前は正しく変更されている
        self.assertEqual(result['data']['label'], updated_flow_name)
        # 新しい内容も入っている
        self.assertEqual(result['data']['b'], new_item)

        # ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

    def test_move_flow(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1C", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['data']['uuid']

        # ユーザとプロジェクトを作る
        with app.app_context():
            flow_uuid = setUpFlow(self)

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', {"parent":folder_dst_uuid, 'lock':lock_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フロー1C'
            ,'type'     : 'flow'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /frames apiが正常終了することを検証する
        self.assertEqual(result['success'], True)
        # PUT /frames apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['data']['uuid'], flow_uuid)
        self.assertEqual(result['data']['type'], expected_result['type'])
        self.assertEqual(result['data']['creator'], expected_result['creator'])
        self.assertNotEqual(result['data']['createdAt'], None)

        # ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

    def test_delete_flow(self):
        """
        delete_flow APIをテストする
        """
        # まずユーザとプロジェクトを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)

        # APIを投げる前はフローは存在するはず
        self.assertTrue(self.factory.data.exists(test_flow_uuid))

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':test_flow_uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{test_flow_uuid}', {'lock':lock_uuid}, self.USER1)
            
        # ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)
 
        # フローはゴミ箱に移動していること
        flow = self.factory.data.find_by_uuid(test_flow_uuid)
        self.assertEqual(flow.find_parent().uuid, self.factory.data.load_trash_folder().uuid)

    @unittest.skip('とりあえず手動でテストする')
    def test_fetch_subflows(self):
        """
        fetch_subflows APIをテストする
        """

        # まずユーザとプロジェクトを作る
        with app.app_context():
            # まずプロジェクトを作る
            project_uuid = self.factory.data.load_root().uuid

            flow1_datasource_name = str(uuid.uuid4())
            data1 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用', 'datasource': None}
            created_flow = Flow.create_flow(data1, self.USER1, flow1_datasource_name)

            # サブフロー化
            created_flow['ports'][0] = {"name": "i","type": "frame"}
            created_flow['ports'][1] = {"name": "o","type": "frame"}
            # フローを更新
            def make_flow_path(file_name):
                """
                フローファイルのパス作成用ヘルパー
                """
                return Path(FLOW_PATH) / Path('%s.json' % file_name)

            flow_path = model.make_flow_path(flow1_datasource_name)
            model.write_data_to_json(flow_path, created_flow)

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user1.id
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
            # サブフロー1を作成する
            data1 = {'project_uuid': None, 'name': 'INPUTだけがあるサブフロー', 'datasource': None}
            subflow1_data = Flow.create_flow(data1, self.USER1)
            subflow1_data['ports'][0] = {"name": "i","type": "frame"}
            # サブフロー1をライブラリに保存する
            root = self.factory.data.load_root()
            subflow1 = root.create_flow('INPUTだけがあるサブフローA', subflow1_data)
            subflow1_uuid = subflow1.uuid
            subflow1.save()

            # サブフロー2を作成する
            data2 = {'project_uuid': None, 'name': 'OUTPUTだけがあるサブフロー', 'datasource': None}
            subflow2_data = Flow.create_flow(data2, self.USER1)
            subflow2_data['ports'][1] = {"name": "o","type": "frame"}
            # サブフロー2をライブラリに保存する
            root = self.factory.data.load_root()
            subflow2 = root.create_flow('OUTPUTだけがあるサブフローA', subflow2_data)
            subflow2_uuid = subflow2.uuid
            subflow2.save()

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER1.id
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
                self.assertEqual(subflow['projectName'], 'ライブラリ')
                self.assertEqual(subflow['ports'][0], {"name": "i","type": "frame"})

        self.assertEqual(found_flag, True)


    def test_fetch_subflows_has_outputs(self):
        """
        fetch_subflows APIをテストする
        portにoutputがあるものを取得する
        """
        with app.app_context():
            # サブフロー1を作成する
            data1 = {'project_uuid': None, 'name': 'OUTPUTだけがあるサブフローです', 'datasource': None}
            subflow1_data = Flow.create_flow(data1, self.USER1)
            subflow1_data['ports'][1] = {"name": "o","type": "frame"}
            # サブフロー1をライブラリに保存する
            root = self.factory.data.load_root()
            subflow1 = root.create_flow('OUTPUTだけがあるサブフローAA', subflow1_data)
            subflow1_uuid = subflow1.uuid
            subflow1.save()

            # サブフロー2を作成する
            data2 = {'project_uuid': None, 'name': 'INPUTだけがあるサブフローです', 'datasource': None}
            subflow2_data = Flow.create_flow(data2, self.USER1)
            subflow2_data['ports'][0] = {"name": "i","type": "frame"}
            # サブフロー2をライブラリに保存する
            root = self.factory.data.load_root()
            subflow2 = root.create_flow('INPUTだけがあるサブフローAA', subflow2_data)
            subflow2_uuid = subflow2.uuid
            subflow2.save()

        # 実際のAPIを投げるテストを開始する
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER1.id
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
                self.assertEqual(subflow['projectName'], 'ライブラリ')
                self.assertEqual(subflow['ports'][1], {"name": "o","type": "frame"})

        self.assertEqual(found_flag, True)

class CacheApiTestCase(ApiTestCaseBase):

    def test_delete_cache(self):
        root = self.factory.data.load_root()

        datum_id = 'test'

        # キャッシュと見立てるフレームを作成する
        cache = root.create_frame('キャッシュです', io.BytesIO(b'0000'))
        cache.save()

        # テスト用フローデータを作成する
        flow_json = {
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
        flow_json['nodes']=[]
        flow_json['nodes'].append(node)

        # フローをライブラリに保存する
        test_flow = root.create_flow('テストフローです', flow_json)
        test_flow.save()

        self.delete_uri('/api/v0/caches?of=%s.%s' % (test_flow.uuid, datum_id), self.USER1)

class NavigationApiTestCase(ApiTestCaseBase):

    def test_get_navigation(self):
        root = self.factory.data.load_root()

        datum_id = 'test'

        # project_uuidなし, flow_uuidなし
        uri = '/api/v0/navigation'
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], '')
        self.assertEqual(data['project_name'], '')
        self.assertEqual(data['flow_uuid'], '')
        self.assertEqual(data['flow_name'], '')
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())
        
        # テスト用フローデータを作成する
        flow_json = {
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
            "uuid": "",
            "cacheCreatedAt": '2019/01/01'
        }
        flow_json['nodes']=[]
        flow_json['nodes'].append(node)

        test_flow = root.create_flow('テストフローです', flow_json)
        test_flow.save()

        flow_uuid = test_flow.uuid
        # project_uuidなし, flow_uuidあり
        uri = '/api/v0/navigation?flow_uuid=' + flow_uuid
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], root.uuid)
        self.assertEqual(data['project_name'], root.label)
        self.assertEqual(data['flow_uuid'], flow_uuid)
        self.assertEqual(data['flow_name'], test_flow.label)
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())

        project_uuid = data['project_uuid']
        # project_uuidあり, flow_uuidなし
        uri = '/api/v0/navigation?project_uuid=' + project_uuid
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], root.uuid)
        self.assertEqual(data['project_name'], root.label)
        self.assertEqual(data['flow_uuid'], '')
        self.assertEqual(data['flow_name'], '')
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())

        # project_uuidあり, flow_uuidあり
        uri = '/api/v0/navigation?project_uuid=' + project_uuid + '&flow_uuid=' + flow_uuid
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], root.uuid)
        self.assertEqual(data['project_name'], root.label)
        self.assertEqual(data['flow_uuid'], flow_uuid)
        self.assertEqual(data['flow_name'], test_flow.label)
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())

    def test_get_sys_admin_navi(self):
        """
        システム管理者のnavigationを検証する
        """
        result = self.get_uri('/api/v0/navigation', self.USER0)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER0.id)
        self.assertEqual(data['user_name'], self.USER0.name)
        self.assertEqual(data['project_uuid'], '')
        self.assertEqual(data['project_name'], '')
        self.assertEqual(data['flow_uuid'], '')
        self.assertEqual(data['flow_name'], '')
        self.assertDictEqual(data['user'], self.USER0.to_json())
        self.assertDictEqual(data['allowlist'], self.USER0.get_allowlist())


def setUpUser(self):
    from kskp.store.auth import User
    return User.find_by_id(1)


def setUpProject(self):
    user1 = setUpUser(self)

    with self.client.session_transaction() as session:
        session['user_id'] = user1.id

    # model.create_project('proj1', session)

    from kskp.web.backend.api.lib import get_library
    default_flow = get_library(user1)
    return (user1, None, default_flow.uuid)


def setUpFlow(self, save_flow=None):
    # ルートストアフォルダを取得する
    root = self.factory.data.load_root()

    # テスト用フローのラベル名を作成する
    flow_label = 'フローテスト用です' + str(uuid.uuid4()).upper()[0:6]

    # テスト用フローデータを作成する
    request_data = {
        'project_uuid': None,
        'name': flow_label,
        'datasouce': None
    }

    if save_flow is None:
        save_flow = Flow.create_flow(request_data, self.USER1, None)

    test_flow = root.create_flow(flow_label, save_flow)
    test_flow_uuid = test_flow.uuid

    # フローデータをライブラリに保存する
    test_flow.save()

    return test_flow_uuid


if __name__ == '__main__':
    unittest.main()
