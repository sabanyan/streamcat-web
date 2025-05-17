import io
import os
import json
import uuid
import unittest
import pprint

from streamcat.web.backend import app
from streamcat.store import Flow, FlowData
from .api_test_case_base import ApiTestCaseBase

class FlowTest(ApiTestCaseBase):

    in_subflow = {
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

    out_subflow = {
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

    def test_new_flow(self):
        """
        new_flow APIをテストする
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()

        # データソースを作成する
        import io
        f = io.BytesIO(b"abcdef")
        result = self.post_frames('データソース', root.uuid, f, self.USER1)
        frame_uuid= result['uuid']

        # フローを作成する
        data_source = {
            "id": "i",
            "type": "frame",
            "dataSource": "csv",
            "uuid": frame_uuid,
            "label": "test"
        }

        data1 = {
            'parent': root.uuid,
            'label': '新しいフローです',
            'flow': {'nodes':[data_source]}
        }

        result = self.post_uri('/api/v0/flows', data1, self.USER1)

        # APIの返り値を検証する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['label'], '新しいフローです')
        self.assertFalse(result['editLock'])
        self.assertEqual(result['folderPath'], f'/{root.label}')
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['modifiedAt'])
        self.assertIsNotNone(result['createdAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertTrue(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

    def test_new_flow_nothing_datasource(self):
        """
        new_flow APIをテストする
        """
        # まずプロジェクトを作る
        project_uuid = self.factory.data.load_root().uuid

        # 必要最低限の項目だけを送る
        self.assertIsNotNone(project_uuid)

        data = {
            'parent': project_uuid,
            'label': '新しいフローです',
            'flow': {}
        }

        # フローを作成する
        result = self.post_uri(f'/api/v0/flows', data, self.USER1)

        # result_project_id = model.get_project_id_by_uuid(project_uuid)

        # フローJsonのprojectIdはもやは利用していない
        # self.assertEqual(result['projectId'], result_project_id)
        self.assertEqual(result['label'], '新しいフローです')

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
        test_flow_uuid = setUpFlow(self)
        test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'source': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # APIの返り値を検証する
        self.assertIsNotNone(result['uuid'])
        self.assertNotEqual(result['uuid'], test_flow_uuid)
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['label'], test_flow_label + ' のコピー')
        self.assertFalse(result['editLock'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['modifiedAt'])
        self.assertIsNotNone(result['createdAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertTrue(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

    def test_new_flow_for_copy_multi(self):
        """
        new_flow APIをテストする
        フローコピー用
        """
        # ルートフォルダを取得する
        root = self.factory.data.load_root()

        # まずユーザとプロジェクトとフローを作る
        test_flow_uuid = setUpFlow(self)
        test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # フローをコピーする
        data_copy_flow = {'source': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する

        # APIの返り値を検証する
        self.assertIsNotNone(result['uuid'])
        self.assertNotEqual(result['uuid'], test_flow_uuid)
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['label'], test_flow_label + ' のコピー')
        self.assertFalse(result['editLock'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['modifiedAt'])
        self.assertIsNotNone(result['createdAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertTrue(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # 同じフローを2回コピーする
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)

        # コピーされていることを検証する
        self.assertIsNotNone(result['uuid'])
        self.assertNotEqual(result['uuid'], test_flow_uuid)
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['label'], test_flow_label + ' のコピー_2')
        self.assertFalse(result['editLock'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], root.uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['modifiedAt'])
        self.assertIsNotNone(result['createdAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertTrue(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

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
                },
                {
                    "id": 'o0', 
                    "label": "ライブラリ出力🖨", 
                    "type": "flow", 
                    "classification": "data_dest",
                    "srcs": {
                        "i": 'd'
                    },
                    "dsts": {}, 
                    "uuid": self.data_dst.uuid
                }
            ]
        }

        # フローを新規作成する
        test_flow_uuid = setUpFlow(self, flow_json=flow_json)

        # 新規作成したフローを実行してキャッシュを生成する
        self.post_uri('/api/v0/activities', {'uuid':test_flow_uuid}, self.USER1)

        # 生成したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)
        cache_uuid1 = result['flow']['nodes'][1]['uuid']

        # フローをコピーする
        data_copy_flow = {'source': test_flow_uuid}
        result = self.post_uri('/api/v0/flows', data_copy_flow, self.USER1)
        flow_uuid = result['uuid']

        # コピー元のUUIDとは異なる値であること
        self.assertNotEqual(flow_uuid, test_flow_uuid)

        # 複製したキャッシュのUUIDを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)
        cache_uuid2 = result['flow']['nodes'][1]['uuid']

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
        self.assertEqual(result['uuid'], test_flow_uuid)
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['label'], test_flow_label)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        # self.assertEqual(result['flow']['projectId'], None)
        # self.assertEqual(result['flow']['label'], test_flow_label)
        # self.assertEqual(result['flow']['params'], [])
        # self.assertEqual(result['flow']['ports'], [[],[]])

    def test_fetch_flow2(self):
        """
        fecth_flowをテストする
        """
        # まずユーザとプロジェクトを作る
        test_flow_uuid = setUpFlow(self)

        # フロー格納フォルダを取得する
        flow_folder = self.factory.data.load_flow_folder()

        # 参照先フレームを作成する
        frame1 = flow_folder.create_frame('CSV1', io.BytesIO(b''))
        frame1.uuid = 'aca1c51f-ee97-43ca-bc6e-cd151220c518'
        frame1.save()

        # 参照先サブフローを作成する
        sub_flow1 = flow_folder.create_flow('サブフロー1', FlowData({}))
        sub_flow1.uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'
        sub_flow1.save()

        # 作成を確定する
        self.factory.end()

        # フレームを、フロー格納フォルダに格納する
        f = io.BytesIO(b"thisisaframefile")
        self.post_frames('適当なフレーム', flow_folder.uuid, f, self.USER1)

        # GET /Flows
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)

        # 格納したフローが取得できることを検証する
        # self.assertEqual(results[0]['projectId'], 1)
        self.assertIsNotNone(result['label'])
        # self.assertEqual(results[0]['description'],'')
        # self.assertEqual(results[0]['params'], [])
        # self.assertEqual(results[0]['ports'], [[],[]])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])

    def test_update_flow(self):
        """
        update_flow APIをテストする
        """
        # まずユーザとプロジェクトを作る
        test_flow_uuid = setUpFlow(self)

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':test_flow_uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローを変更する
        updated_flow_name = '変更後のフローラベル名!'
        data = {
            'flow': {'label': updated_flow_name, 'description':'vjq@aer'},
            'label': updated_flow_name,
            'lock' : lock_uuid
        }
        result = self.put_uri(f'/api/v0/flows/{test_flow_uuid}', data, self.USER1)

        # PUT /flowsの戻り値を検証する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['label'], updated_flow_name)
        self.assertEqual(result['editLock'], False)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['creator'], self.USER1.name)
        self.assertIsNotNone(result['createdAt'])

        # フローJsonを取得する
        result = self.get_uri(f'/api/v0/flows/{test_flow_uuid}', self.USER1)

        # GET /flowsの戻り値を検証する
        self.assertIsNotNone(result['uuid'])
        self.assertEqual(result['label'], updated_flow_name)
        self.assertEqual(result['editLock'], False)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['creator'], self.USER1.name)
        self.assertIsNotNone(result['createdAt'])

        # フローJsonが更新さていること
        self.assertEqual(result['flow']['label'], updated_flow_name)
        self.assertEqual(result['flow']['description'], 'vjq@aer')

        # フローを削除する
        self.delete_uri_with_json(f'/api/v0/flows/{test_flow_uuid}', {'lock':lock_uuid}, self.USER1)

        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

    def test_update_flow_label(self):
        """
        PUT /flows でラベル名だけを指定すればラベル名だけを変更できること
        """
        # ROOTを取得する
        root = self.factory3.data.load_root()

        # ROOTの下にプロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'flows1'}, self.USER3)
        project_uuid = result['uuid']

        # プロジェクトの下にフローを作成する
        data = {
            'parent': project_uuid,
            'label': '金さん',
            'flow': {'label':'金さん'}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)
        # POST /flowsの戻り値を検証する
        self.assertNotIn('nodes', result)
        self.assertEqual(result['label'], '金さん')

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project_uuid}?roles=on', self.USER3)
        flow_uuid = result['children'][0]['uuid']

        # フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)
        # GET /flowsの戻り値を検証する
        self.assertEqual(result['flow']['label'], '金さん')

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # フローを編集する
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', {'label':'遠山金四郎🌸', 'lock':lock_uuid}, self.USER3)

        # フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)

        # GET /flowsの戻り値を検証する
        self.assertEqual(result['uuid'], flow_uuid)
        self.assertEqual(result['label'], '遠山金四郎🌸')
        self.assertEqual(result['editLock'], False)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['creator'], self.USER3.name)
        self.assertIsNotNone(result['createdAt'])
        # フローJsonにあるlabelは廃止予定だが、label列と同期されること
        self.assertEqual(result['flow']['label'], '遠山金四郎🌸')
        # label以外のフローJsonは変更されないこと
        self.assertNotIn('nodes', result['flow'])
        self.assertNotIn('ports', result['flow'])
        self.assertNotIn('params', result['flow'])
        self.assertNotIn('description', result['flow'])
        self.assertNotIn('creator', result['flow'])
        self.assertNotIn('createdAt', result['flow'])

        # プロジェクトフォルダを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER3)

    def test_move_flow(self):
        # ルートを取得する
        root = self.factory.data.load_root()

        # 移動先フォルダを作成する(POST /folders)
        folder_dst = self.post_uri('/api/v0/folders', {"label" : "新しいフォルダ1C", "parent": root.uuid}, self.USER1)
        folder_dst_uuid = folder_dst['uuid']

        # ユーザとプロジェクトを作る
        flow_uuid = setUpFlow(self)

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER1)
        lock_uuid = result['uuid']

        # 移動元から移動先へフォルダを移動する
        result = self.put_uri(f'/api/v0/flows/{flow_uuid}', {"parent":folder_dst_uuid, 'lock':lock_uuid}, self.USER1)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'フロー1C'
            ,'type'     : 'flow'
            ,'creator'  : 'ユーザー管理者'
        }

        # PUT /frames apiの戻り値が正しいことを検証する(createdAtは検証できない)
        self.assertEqual(result['uuid'], flow_uuid)
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)

    def test_delete_flow(self):
        """
        delete_flow APIをテストする
        """
        # まずユーザとプロジェクトを作る
        test_flow_uuid = setUpFlow(self)
        test_flow_label = self.factory.data.find_by_uuid(test_flow_uuid).label

        # APIを投げる前はフローは存在するはず
        self.assertTrue(self.factory.data.exists(test_flow_uuid))

        # 削除前にフローのロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':test_flow_uuid}, self.USER1)
        lock_uuid = result['uuid']

        # フローを削除する
        result = self.delete_uri_with_json(f'/api/v0/flows/{test_flow_uuid}', {'lock':lock_uuid}, self.USER1)

        # ゴミ箱のUUID
        trash_folder_uuid = self.factory.data.load_trash_folder().uuid

        # APIの返り値を検証する
        self.assertEqual(result['uuid'], test_flow_uuid)
        self.assertEqual(result['type'], 'flow')
        self.assertEqual(result['label'], test_flow_label)
        self.assertFalse(result['editLock'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], trash_folder_uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['modifiedAt'])
        self.assertIsNotNone(result['createdAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertTrue(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER1)
 
        # フローはゴミ箱に移動していること
        flow = self.factory.data.find_by_uuid(test_flow_uuid)
        self.assertEqual(flow.find_parent().uuid, trash_folder_uuid)

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
            data1 = {'project_uuid': project_uuid, 'name': 'サブフローテスト用', 'flow': {}}
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

        # テストで作成した以外のフローもあるので、テスト対象のサブフローを探す
        for subflow in result:
            if subflow['uuid'] == flow1_datasource_name:
                self.assertEqual(subflow['label'], 'サブフローテスト用')
                self.assertEqual(subflow['projectName'], 'proj1')
                self.assertEqual(subflow['ports'][0], {"name": "i","type": "frame"})
                self.assertEqual(subflow['ports'][1], {"name": "o","type": "frame"})

        # 作成したサブフローを削除する
        os.unlink(flow_path)

    def test_fetch_subflows(self):
        # ROOTを取得する
        root = self.factory.data.load_root()

        # ROOTの下にプロジェクト1を作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'flows1'}, self.USER3)
        project1_uuid = result['uuid']

        # プロジェクト1の下にフローを作成する
        data = {
            'parent': project1_uuid,
            'label': 'INPUTだけがあるサブフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # サブフロー1を取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project1_uuid}?roles=on', self.USER3)
        flow1_uuid = result['children'][0]['uuid']

        # サブフロー1の排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow1_uuid}, self.USER3)
        lock1_uuid = result['uuid']

        # サブフロー1を編集する
        self.put_uri(f'/api/v0/flows/{flow1_uuid}', {'flow': self.in_subflow, 'lock':lock1_uuid}, self.USER3)

        # サブフロー1の編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock1_uuid
        }
        self.put_uri(f'/api/v0/flows/{flow1_uuid}', data, self.USER3)

        # サブフロー1の排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock1_uuid}', self.USER3)

        # ROOTの下にプロジェクト2を作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'flows2'}, self.USER3)
        project2_uuid = result['uuid']

        # プロジェクト2の下にフロー2を作成する
        data = {
            'parent': project2_uuid,
            'label': 'OUTPUTだけがあるサブフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)

        # サブフロー2を取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/projects/{project2_uuid}?roles=on', self.USER3)
        flow2_uuid = result['children'][0]['uuid']

        # サブフロー2の排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow2_uuid}, self.USER3)
        lock2_uuid = result['uuid']

        # サブフロー2を編集する
        self.put_uri(f'/api/v0/flows/{flow2_uuid}', {'flow': self.out_subflow, 'lock':lock2_uuid}, self.USER3)

        # サブフロー1の編集ロックする
        data = {
            'editLock' : True,
            'lock' : lock2_uuid
        }
        self.put_uri(f'/api/v0/flows/{flow2_uuid}', data, self.USER3)

        # サブフロー2の排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock2_uuid}', self.USER3)

        # 全てのサブフローを取得する
        # (no_inputs=onの引数指定はおかしい気がする)
        results = self.get_uri(f'/api/v0/subflows', self.USER3)

        # サブフローが2つ取得できること
        self.assertEqual(len(results), 2)
        # サブフロー1
        self.assertEqual(results[0]['uuid'], flow1_uuid)
        self.assertEqual(results[0]['label'], 'INPUTだけがあるサブフロー')
        self.assertEqual(results[0]['projectName'], '')
        self.assertEqual(results[0]['ports'][0], [{'type':'frame','label':'testData','nodeId':'d'}])
        self.assertEqual(results[0]['ports'][1], [])
        self.assertEqual(results[0]['params'], [])
        self.assertEqual(results[0]['description'], '')
        self.assertEqual(results[0]['creator'], self.USER3.name)
        self.assertIsNotNone(results[0]['createdAt'])
        # サブフロー2
        self.assertEqual(results[1]['uuid'], flow2_uuid)
        self.assertEqual(results[1]['label'], 'OUTPUTだけがあるサブフロー')
        self.assertEqual(results[1]['projectName'], '')
        self.assertEqual(results[1]['ports'][0], [])
        self.assertEqual(results[1]['ports'][1], [{'type':'frame','label':'d1','nodeId':'d1'}])
        self.assertEqual(results[1]['params'], [])
        self.assertEqual(results[1]['description'], '')
        self.assertEqual(results[1]['creator'], self.USER3.name)
        self.assertIsNotNone(results[1]['createdAt'])

        # サブフロー1の排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow1_uuid}, self.USER3)
        lock1_uuid = result['uuid']

        # サブフロー2の排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow2_uuid}, self.USER3)
        lock2_uuid = result['uuid']

        # サブフロー1の編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : lock1_uuid
        }
        self.put_uri(f'/api/v0/flows/{flow1_uuid}', data, self.USER3)

        # サブフロー2の編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : lock2_uuid
        }
        self.put_uri(f'/api/v0/flows/{flow2_uuid}', data, self.USER3)

        # サブフロー1の排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock1_uuid}', self.USER3)

        # サブフロー2の排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock2_uuid}', self.USER3)

        # プロジェクトフォルダを削除する
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER3)
        self.delete_uri(f'/api/v0/projects/{project2_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER3)

    def test_trashed_subflows(self):
        """
        ゴミ箱にほかされたサブフローは取得されないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'わっちのプロジェクト'}, self.USER2)
        project_uuid = result['uuid']

        # プロジェクトの下にフローを作成する
        data = {
            'parent': project_uuid,
            'label': 'INPUTだけがあるサブフロー',
            'flow': self.in_subflow
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)
        in_subflow_uuid = result['uuid']

        # プロジェクトの下にフローを作成する
        data = {
            'parent': project_uuid,
            'label': 'OUTPUTだけがあるサブフロー',
            'flow': self.out_subflow
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)
        out_subflow_uuid = result['uuid']

        # 編集ロックが掛けられてないのでサブフローは取得できないこと
        result = self.get_uri(f'/api/v0/subflows', self.USER2)
        self.assertEqual(len(result), 0)

        # サブフローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':in_subflow_uuid}, self.USER2)
        in_lock_uuid = result['uuid']
        result = self.post_uri('/api/v0/locks', {'target':out_subflow_uuid}, self.USER2)
        out_lock_uuid = result['uuid']

        # サブフローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : in_lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{in_subflow_uuid}', data, self.USER2)
        # サブフローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : out_lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{out_subflow_uuid}', data, self.USER2)

        # サブフローを取得する
        result = self.get_uri(f'/api/v0/subflows', self.USER2)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['uuid'], in_subflow_uuid)
        self.assertEqual(result[0]['label'], 'INPUTだけがあるサブフロー')
        self.assertEqual(result[1]['uuid'], out_subflow_uuid)
        self.assertEqual(result[1]['label'], 'OUTPUTだけがあるサブフロー')

        # サブフローの編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : in_lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{in_subflow_uuid}', data, self.USER2)
        # サブフローの編集ロックを解除する
        data = {
            'editLock' : False,
            'lock' : out_lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{out_subflow_uuid}', data, self.USER2)

        # 編集ロックが掛けられてないのでサブフローは取得できないこと
        result = self.get_uri(f'/api/v0/subflows', self.USER2)
        self.assertEqual(len(result), 0)

        # サブフローをゴミ箱へほかす
        result = self.delete_uri_with_json(f'/api/v0/flows/{in_subflow_uuid}', {'lock':in_lock_uuid}, self.USER2)
        result = self.delete_uri_with_json(f'/api/v0/flows/{out_subflow_uuid}', {'lock':out_lock_uuid}, self.USER2)

        # ゴミ箱へほかされたサブフローは取得されないこと
        result = self.get_uri(f'/api/v0/subflows', self.USER2)
        self.assertEqual(len(result), 0)

        # サブフローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : in_lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{in_subflow_uuid}', data, self.USER2)
        # サブフローを編集ロックする
        data = {
            'editLock' : True,
            'lock' : out_lock_uuid
        }
        self.put_uri(f'/api/v0/flows/{out_subflow_uuid}', data, self.USER2)

        # 編集ロックされていても、ゴミ箱へほかされたサブフローは取得されないこと
        result = self.get_uri(f'/api/v0/subflows', self.USER2)
        self.assertEqual(len(result), 0)

        # サブフローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{in_lock_uuid}', self.USER2)
        self.delete_uri(f'/api/v0/locks/{out_lock_uuid}', self.USER2)

        # プロジェクトフォルダを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)

def setUpFlow(self, flow_json={}):
    # ルートストアフォルダを取得する
    root = self.factory.data.load_root()

    # テスト用フローのラベル名を作成する
    flow_label = 'フローテスト用です' + str(uuid.uuid4()).upper()[0:6]

    # テスト用フローデータを作成する
    test_flow = root.create_flow(flow_label, FlowData(flow_json))
    test_flow_uuid = test_flow.uuid

    # フローデータをライブラリに保存する
    test_flow.save()

    # 作成を確定する
    self.factory.end()

    return test_flow_uuid
