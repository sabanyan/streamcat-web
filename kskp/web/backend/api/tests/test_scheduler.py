import unittest
from flask import template_rendered
from kskp.web.backend import app
from .api_test_case_base import ApiTestCaseBase

class SchedulerTest(ApiTestCaseBase):
 

    def test_simple(self):
        """
        
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'プロジェクトだよ'}, self.USER2)
        project_uuid = result['data']['uuid']

        # フローを作成する
        result = self.post_uri('/api/v0/flows', data1, self.USER1)

        # スケジュールを登録する



        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # プロジェクトを削除する
        # (RemoteFolderを削除(unmount)する)
        self.delete_uri('/api/v0/trashes', self.USER1)
