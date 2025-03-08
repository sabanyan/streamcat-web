import unittest
from .api_test_case_base import ApiTestCaseBase

class SchedulerTest(ApiTestCaseBase):

    def test_simple(self):
        """
        スケジュールの登録と削除ができること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()
        # ゴミ箱のUUID
        trash_folder_uuid = self.factory.data.load_trash_folder().uuid

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['uuid']

        # プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '自動実行したいフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)
        flow_uuid = result['uuid']

        # スケジュールを登録する
        data = {
            'parent': project_uuid,
            'label' : '私のスケジュール',
            'runnable' : flow_uuid,
            'trigger': {
                'type' : 'date',
                'date' : '2121-09-10 11:22:30'
            }
        }
        result = self.post_uri('/api/v0/schedules', data, self.USER1)
        schedule_uuid = result['uuid']

        # APIの返り値を検証する
        self.assertEqual(result['uuid'], schedule_uuid)
        self.assertEqual(result['type'], 'schedule')
        self.assertEqual(result['label'], '私のスケジュール')
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], project_uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertIsNotNone(result['modifiedAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # スケジュールをほかす
        result = self.delete_uri(f'/api/v0/schedules/{schedule_uuid}', self.USER1)

        # APIの返り値を検証する
        self.assertEqual(result['uuid'], schedule_uuid)
        self.assertEqual(result['type'], 'schedule')
        self.assertEqual(result['label'], '私のスケジュール')
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], trash_folder_uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertIsNotNone(result['modifiedAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_duplicate_schedule(self):
        """
        スケジュールを複製できること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()
        # ゴミ箱のUUID
        trash_folder_uuid = self.factory.data.load_trash_folder().uuid

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['uuid']

        # プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '自動実行したいフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)
        flow_uuid = result['uuid']

        # スケジュールを登録する
        data = {
            'parent': project_uuid,
            'label' : '私のスケジュール',
            'runnable' : flow_uuid,
            'trigger': {
                'type' : 'date',
                'date' : '2121-09-10 11:22:30'
            }
        }
        result = self.post_uri('/api/v0/schedules', data, self.USER1)
        schedule_uuid = result['uuid']

        # スケジュールを複製する
        result = self.post_uri(f'/api/v0/schedules', {'source':schedule_uuid}, self.USER2)

        # APIの返り値を検証する
        self.assertNotEqual(result['uuid'], schedule_uuid)
        self.assertEqual(result['type'], 'schedule')
        self.assertEqual(result['label'], '私のスケジュール のコピー')
        self.assertEqual(result['runnableUUID'], flow_uuid)
        self.assertEqual(result['args'], {})
        self.assertEqual(result['inputs'], {})
        self.assertEqual(result['trigger'], data['trigger'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], project_uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], self.USER2.name)
        self.assertIsNotNone(result['createdAt'])
        self.assertIsNotNone(result['modifiedAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_optimistic_lock(self):
        """
        スケジュールの楽観的ロックが機能すること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['uuid']

        # プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '自動実行したいフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)
        flow_uuid = result['uuid']

        # スケジュールを登録する
        data = {
            'parent': project_uuid,
            'label' : '私のスケジュール',
            'runnable' : flow_uuid,
            'trigger': {
                'type' : 'date',
                'date' : '2121-09-10 11:22:30'
            }
        }
        result = self.post_uri('/api/v0/schedules', data, self.USER1)
        schedule_uuid = result['uuid']

        # スケジュールを更新する
        update_data = {
            'label' : '私のスケジュール ver2.0',
            'runnable' : flow_uuid,
            'trigger': {
                'type' : 'date',
                'date' : '3121-08-09 21:24:23'
            },
            # lastModifiedAtに古い値を指定する
            'lastModifiedAt' : '2025-01-14 08:07:06.962031'
        }
        # 例外が送出されること
        with self.assertRaises(Exception):
            self.put_uri(f'/api/v0/schedules/{schedule_uuid}', update_data, self.USER1)

        # スケジュールは更新されていないこと
        result = self.get_uri(f'/api/v0/schedules/{schedule_uuid}', self.USER1)
        self.assertEqual(result['uuid'], schedule_uuid)
        self.assertEqual(result['type'], 'schedule')
        self.assertEqual(result['label'], '私のスケジュール')
        self.assertEqual(result['runnableUUID'], flow_uuid)
        self.assertEqual(result['args'], {})
        self.assertEqual(result['inputs'], {})
        self.assertEqual(result['trigger'], data['trigger'])
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], project_uuid)
        self.assertEqual(result['prevFolderPath'], None)
        self.assertEqual(result['creator'], self.USER1.name)
        self.assertIsNotNone(result['createdAt'])
        self.assertIsNotNone(result['modifiedAt'])
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        self.delete_uri('/api/v0/trashes', self.USER1)
