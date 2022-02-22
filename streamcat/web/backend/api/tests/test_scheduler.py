import unittest
from .api_test_case_base import ApiTestCaseBase

class SchedulerTest(ApiTestCaseBase):

    def test_simple(self):
        """
        スケジュールの登録と削除ができること
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['data']['uuid']

        # プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid,
            'label': '自動実行したいフロー',
            'flow': {}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)
        flow_uuid = result['data']['uuid']

        # スケジュールを登録する
        data = {
            'parent': project_uuid,
            'label' : '私のスケジュール',
            'flow'  : flow_uuid,
            'trigger': {
                'type' : 'date',
                'date' : '2121-09-10 11:22:30'
            }
        }
        result = self.post_uri('/api/v0/schedules', data, self.USER1)
        schedule_uuid = result['data']['uuid']

        # APIの返り値を検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'schedule')
        self.assertEqual(result['data']['label'], '私のスケジュール')
        self.assertIsNone(result['data']['folderPath'])
        self.assertEqual(result['data']['folderUuid'], project_uuid)
        self.assertEqual(result['data']['prevFolderPath'], None)
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertTrue(result['data']['allowlist']['read'])
        self.assertTrue(result['data']['allowlist']['update'])
        self.assertTrue(result['data']['allowlist']['delete'])
        self.assertFalse(result['data']['allowlist']['execute'])
        self.assertTrue(result['data']['allowlist']['download'])
        self.assertFalse(result['data']['allowlist']['export'])
        self.assertTrue(result['data']['allowlist']['copy'])
        self.assertTrue(result['data']['allowlist']['move'])
        self.assertFalse(result['data']['allowlist']['lock'])
        self.assertFalse(result['data']['allowlist']['findMember'])
        self.assertFalse(result['data']['allowlist']['updateMember'])

        # スケジュールをほかす
        self.delete_uri(f'/api/v0/schedules/{schedule_uuid}', self.USER1)

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        # (RemoteFolderを削除(unmount)する)
        self.delete_uri('/api/v0/trashes', self.USER1)
