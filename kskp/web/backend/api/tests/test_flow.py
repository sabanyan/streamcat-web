import io
import os
import json
import uuid
import unittest
import tempfile
import pprint

from kskp.web.backend import app
from kskp.store import Flow, FlowData
from .api_test_case_base import ApiTestCaseBase

class FlowTestCase(ApiTestCaseBase):

    def setUp(self):
        app.testing = True
        self.client = app.test_client()

    def tearDown(self):
        pass

    def test_new_flow(self):
        """
        new_flow APIをテストする
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()

        # データソースを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummy.csv')
        result = self.post_frames('データソース', root.uuid, f, self.USER1)
        frame_uuid= result['data']['uuid']

        # フローを作成する
        data_source = {
            "id": "i",
            "type": "frame",
            "dataSource": "csv",
            "uuid": frame_uuid,
            "label": "test"
        }

        data1 = {
            'project_uuid': root.uuid,
            'name': '新しいフローです',
            'datasource': data_source
        }

        result = self.post_uri('/api/v0/flows', data1, self.USER1)

        # APIの返り値を検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['label'], '新しいフローです')
        self.assertFalse(result['data']['editLock'])
        self.assertEqual(result['data']['folderPath'], f'/{root.label}')
        self.assertEqual(result['data']['folderUuid'], root.uuid)
        self.assertEqual(result['data']['prevFolderPath'], None)
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['modifiedAt'])
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertTrue(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertTrue(result['data']['allowlist']['export'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['lock'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])

    def test_new_flow_nothing_datasource(self):
        """
        new_flow APIをテストする
        """
        # まずプロジェクトを作る
        project_uuid = self.factory.data.load_root().uuid

        # 必要最低限の項目だけを送る
        self.assertIsNotNone(project_uuid)

        data = {
            'project_uuid': project_uuid,
            'name': '新しいフローです'
        }

        # フローを作成する
        result = self.post_uri(f'/api/v0/flows', data, self.USER1)

        # result_project_id = model.get_project_id_by_uuid(project_uuid)

        self.assertEqual(result['success'], True)
        # フローJsonのprojectIdはもやは利用していない
        # self.assertEqual(result['data']['projectId'], result_project_id)
        self.assertEqual(result['data']['label'], '新しいフローです')

        # 後片付け
        # app.config['FLOW_PATH'] = flow_path

    def test_new_flow_for_copy(self):
        """
        new_flow APIをテストする
        フローコピー用
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()
        
        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # APIの返り値を検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertNotEqual(result['data']['uuid'], test_flow_uuid)
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー')
        self.assertFalse(result['data']['editLock'])
        self.assertEqual(result['data']['folderPath'], f'/{root.label}')
        self.assertEqual(result['data']['folderUuid'], root.uuid)
        self.assertEqual(result['data']['prevFolderPath'], None)
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['modifiedAt'])
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertTrue(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertTrue(result['data']['allowlist']['export'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['lock'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])

    def test_new_flow_for_copy_multi(self):
        """
        new_flow APIをテストする
        フローコピー用
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()

        # まずユーザとプロジェクトとフローを作る
        with app.app_context():
            test_flow_uuid = setUpFlow(self)
            test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する

        # APIの返り値を検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertNotEqual(result['data']['uuid'], test_flow_uuid)
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー')
        self.assertFalse(result['data']['editLock'])
        self.assertEqual(result['data']['folderPath'], f'/{root.label}')
        self.assertEqual(result['data']['folderUuid'], root.uuid)
        self.assertEqual(result['data']['prevFolderPath'], None)
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['modifiedAt'])
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertTrue(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertTrue(result['data']['allowlist']['export'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['lock'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])

        # 同じフローを2回コピーする
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertNotEqual(result['data']['uuid'], test_flow_uuid)
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['label'], test_flow_label + ' のコピー_2')
        self.assertFalse(result['data']['editLock'])
        self.assertEqual(result['data']['folderPath'], f'/{root.label}')
        self.assertEqual(result['data']['folderUuid'], root.uuid)
        self.assertEqual(result['data']['prevFolderPath'], None)
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['modifiedAt'])
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertTrue(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertTrue(result['data']['allowlist']['export'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertTrue(result['data']['allowlist']['lock'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])

    def test_copy_flow_using_cache(self):
        """
        キャッシュデータを持つフローをコピーした場合は、
        そのキャッシュデータもコピーすることを確認する
        """
        # mnewstrコマンド1つのフロー
        flow_json = {
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
        test_flow_uuid = setUpFlow(self, flow_json=flow_json)

        # 新規作成したフローを実行してキャッシュを生成する
        self.get_uri(f'/api/v0/frames?from={test_flow_uuid}', self.USER1)

        # 生成したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)
        cache_uuid1 = result['data']['flow']['nodes'][1]['uuid']

        # フローをコピーする
        data_copy_flow = {'original_flow_uuid': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)
        flow_uuid = result['data']['uuid']

        # コピー元のUUIDとは異なる値であること
        self.assertNotEqual(flow_uuid, test_flow_uuid)

        # 複製したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)
        cache_uuid2 = result['data']['flow']['nodes'][1]['uuid']

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
        # フローを作成する
        test_flow_uuid = setUpFlow(self)
        test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローを取得する
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)

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
        self.assertEqual(results['data'][0]['label'], 'テストフロー！(FlowTestCase)')
        # self.assertEqual(results['data'][0]['description'],'')
        # self.assertEqual(results['data'][0]['params'], [])
        # self.assertEqual(results['data'][0]['ports'], [[],[]])
        self.assertEqual(results['data'][0]['creator'], 'ユーザー管理者')
        self.assertIsNotNone(results['data'][0]['createdAt'])

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

        # フローを変更する
        updated_flow_name = '変更後のフローラベル名!'
        data = {
            'flow': {'label': updated_flow_name, 'description':'vjq@aer'},
            'label': updated_flow_name,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{test_flow_uuid}', data, self.USER1)

        # PUT /flowsの戻り値を検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['label'], updated_flow_name)
        self.assertEqual(result['data']['editLock'], False)
        self.assertIsNone(result['data']['prevFolderPath'])
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['creator'], self.USER1.name)
        self.assertIsNotNone(result['data']['createdAt'])

        # フローJsonを取得する
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)

        # GET /flowsの戻り値を検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['label'], updated_flow_name)
        self.assertEqual(result['data']['editLock'], False)
        self.assertIsNone(result['data']['prevFolderPath'])
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['creator'], self.USER1.name)
        self.assertIsNotNone(result['data']['createdAt'])

        # フローJsonが更新さていること
        self.assertEqual(result['data']['flow']['label'], updated_flow_name)
        self.assertEqual(result['data']['flow']['description'], 'vjq@aer')

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{test_flow_uuid}', {'lock':lock_uuid}, self.USER1)

        # ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

    def test_update_flow_label(self):
        """
        PUT /flows でラベル名だけを指定すればラベル名だけを変更できること
        """
        # ROOTを取得する
        root = self.factory3.data.load_root()

        # ROOTの下にプロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'flows1'}, self.USER3)
        project_uuid = result['data']['uuid']

        # プロジェクトの下にフローを作成する
        data = {
            'project_uuid': project_uuid,
            'name': '金さん',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)
        # POST /flowsの戻り値を検証する
        self.assertNotIn('nodes', result['data'])
        self.assertEqual(result['data']['label'], '金さん')

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['data']['children'][0]['uuid']

        # フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        # GET /flowsの戻り値を検証する
        self.assertEqual(result['data']['flow']['label'], '金さん')

        flow_json_ports = result['data']['flow']['ports']
        flow_json_params = result['data']['flow']['params']
        flow_json_description = result['data']['flow']['description']
        flow_json_creator = result['data']['flow']['creator']
        flow_json_created_at = result['data']['flow']['createdAt']

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['data']['uuid']

        # フローを編集する
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', {'label':'遠山金四郎🌸', 'lock':lock_uuid}, self.USER3)

        # フローの排他ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER3)

        # フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)

        # GET /flowsの戻り値を検証する
        self.assertEqual(result['data']['uuid'], flow_uuid)
        self.assertEqual(result['data']['label'], '遠山金四郎🌸')
        self.assertEqual(result['data']['editLock'], False)
        self.assertIsNone(result['data']['prevFolderPath'])
        self.assertEqual(result['data']['type'], 'flow')
        self.assertEqual(result['data']['creator'], self.USER3.name)
        self.assertIsNotNone(result['data']['createdAt'])
        # フローJsonにあるlabelは廃止予定だが、label列と同期されること
        self.assertEqual(result['data']['flow']['label'], '遠山金四郎🌸')
        # label以外のフローJsonは変更されないこと
        self.assertNotIn('nodes', result['data']['flow'])
        self.assertEqual(result['data']['flow']['ports'], flow_json_ports)
        self.assertEqual(result['data']['flow']['params'], flow_json_params)
        self.assertEqual(result['data']['flow']['description'], flow_json_description)
        self.assertEqual(result['data']['flow']['creator'], flow_json_creator)
        self.assertEqual(result['data']['flow']['createdAt'], flow_json_created_at)

        # プロジェクトフォルダを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER3)

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
    def test_fetch_subflows0(self):
        """
        fetch_subflows APIをテストする
        """
        from pathlib import Path

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
                session['user_uuid'] = user1.uuid
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

    def test_fetch_subflows(self):
        flow1_json = {
            "label": "INPUTだけがあるサブフロー", 
            "nodes": [
                {
                "id": "d", 
                "type": "frame", 
                "uuid": None, 
                "label": "testData",
                "makeCache": False, 
                "dataSource": "csv", 
                "cacheCreatedAt": None
                }, 
                {
                "id": "d1", 
                "type": "frame", 
                "uuid": None, 
                "label": "d1", 
                "makeCache": False, 
                "dataSource": "csv", 
                "cacheCreatedAt": None
                }, 
                {
                "id": "c1", 
                "args": {
                    "d": "^^"
                }, 
                "dsts": {
                    "o": "d1"
                }, 
                "srcs": {
                    "i": "d"
                }, 
                "type": "command", 
                "label": "c1", 
                "commandId": "column_unique_name", 
                "srcsOrder": [
                    "i"
                ]
                }
            ], 
            "ports": [
                [
                {
                    "type": "frame", 
                    "label": "testData", 
                    "nodeId": "d"
                }
                ], 
                []
            ], 
            "params": [], 
            "creator": "ユーザ管理者", 
            "createdAt": "2020-11-19 11:31:10", 
            "projectId": None, 
            "description": ""
        }

        flow2_json = {
            "label": "OUTPUTだけがあるサブフロー", 
            "nodes": [
                {
                "id": "d", 
                "type": "frame", 
                "uuid": None, 
                "label": "testData", 
                "makeCache": False, 
                "dataSource": "csv", 
                "cacheCreatedAt": None
                }, 
                {
                "id": "d1", 
                "type": "frame", 
                "uuid": None, 
                "label": "d1", 
                "makeCache": False, 
                "dataSource": "csv", 
                "cacheCreatedAt": None
                }, 
                {
                "id": "c1", 
                "args": {
                    "d": "^^"
                }, 
                "dsts": {
                    "o": "d1"
                }, 
                "srcs": {
                    "i": "d"
                }, 
                "type": "command", 
                "label": "c1", 
                "commandId": "column_unique_name", 
                "srcsOrder": [
                    "i"
                ]
                }
            ], 
            "ports": [
                [], 
                [
                {
                    "type": "frame", 
                    "label": "d1", 
                    "nodeId": "d1"
                }
                ]
            ], 
            "params": [], 
            "creator": "ユーザ管理者", 
            "createdAt": "2020-11-19 11:31:10", 
            "projectId": None, 
            "description": ""
        }
    
        # ROOTを取得する
        root = self.factory.data.load_root()

        # ROOTの下にプロジェクト1を作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'flows1'}, self.USER3)
        project1_uuid = result['data']['uuid']

        # プロジェクト1の下にフローを作成する
        data = {
            'project_uuid': project1_uuid,
            'name': 'INPUTだけがあるサブフロー',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # サブフロー1を取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project1_uuid}?roles=on', self.USER3)
        flow1_uuid = result['data']['children'][0]['uuid']

        # サブフロー1の排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow1_uuid}, self.USER3)
        lock1_uuid = result['data']['uuid']

        # サブフロー1を編集する
        self.put_uri(f'/api/v0/flows/{flow1_uuid}', {'flow': flow1_json, 'lock':lock1_uuid}, self.USER3)

        # サブフロー2の排他ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock1_uuid}', {}, self.USER3)

        # ROOTの下にプロジェクト2を作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'flows2'}, self.USER3)
        project2_uuid = result['data']['uuid']

        # プロジェクト2の下にフロー2を作成する
        data = {
            'project_uuid': project2_uuid,
            'name': 'OUTPUTだけがあるサブフロー',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # サブフロー2を取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project2_uuid}?roles=on', self.USER3)
        flow2_uuid = result['data']['children'][0]['uuid']

        # サブフロー2の排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow2_uuid}, self.USER3)
        lock2_uuid = result['data']['uuid']

        # サブフロー2を編集する
        self.put_uri(f'/api/v0/flows/{flow2_uuid}', {'flow': flow2_json, 'lock':lock2_uuid}, self.USER3)

        # サブフロー2の排他ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock2_uuid}', {}, self.USER3)

        # 全てのサブフローを取得する
        # (no_inputs=onの引数指定はおかしい気がする)
        results = self.get_uri(f'/api/v0/subflows', self.USER3)

        # サブフローが2つ取得できること
        self.assertEqual(len(results['data']), 2)
        # サブフロー1
        self.assertEqual(results['data'][0]['uuid'], flow1_uuid)
        self.assertEqual(results['data'][0]['label'], 'INPUTだけがあるサブフロー')
        self.assertEqual(results['data'][0]['projectName'], '')
        self.assertEqual(results['data'][0]['ports'][0], [{'type':'frame','label':'testData','nodeId':'d'}])
        self.assertEqual(results['data'][0]['ports'][1], [])
        self.assertEqual(results['data'][0]['params'], [])
        self.assertEqual(results['data'][0]['description'], '')
        self.assertEqual(results['data'][0]['creator'], 'ユーザ管理者')
        self.assertIsNotNone(results['data'][0]['createdAt'])
        # サブフロー2
        self.assertEqual(results['data'][1]['uuid'], flow2_uuid)
        self.assertEqual(results['data'][1]['label'], 'OUTPUTだけがあるサブフロー')
        self.assertEqual(results['data'][1]['projectName'], '')
        self.assertEqual(results['data'][1]['ports'][0], [])
        self.assertEqual(results['data'][1]['ports'][1], [{'type':'frame','label':'d1','nodeId':'d1'}])
        self.assertEqual(results['data'][1]['params'], [])
        self.assertEqual(results['data'][1]['description'], '')
        self.assertEqual(results['data'][1]['creator'], 'ユーザ管理者')
        self.assertIsNotNone(results['data'][1]['createdAt'])

        # プロジェクトフォルダを削除する
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER3)
        self.delete_uri(f'/api/v0/projects/{project2_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER3)

def setUpFlow(self, flow_json=None):
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

    if flow_json is None:
        flow_data = Flow.create_flow(request_data, self.USER1, None)
    else:
        flow_data = FlowData(flow_json)

    test_flow = root.create_flow(flow_label, flow_data)
    test_flow_uuid = test_flow.uuid

    # フローデータをライブラリに保存する
    test_flow.save()

    return test_flow_uuid
