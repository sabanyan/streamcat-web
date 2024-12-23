import io
import asyncio
import unittest
import pprint
from .api_async_test_case_base import ApiAsyncTestCaseBase

class ConcurrencyTest(ApiAsyncTestCaseBase):

    def test_concurrent_delete_duplicated_folders(self):
        """
        複製した複数のフォルダを同時に削除できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {'label': 'フォルダですよ1!!!!', 'parent': root.uuid}, self.USER1)
        folder1_uuid = folder1['uuid']
        folder1_label = folder1['label']

        # フォルダ1を複製する
        folder2 = self.post_uri('/api/v0/folders', {'source': folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']
        folder2_label = folder2['label']

        # フォルダ1を複製する
        folder3 = self.post_uri('/api/v0/folders', {'source': folder1_uuid}, self.USER1)
        folder3_uuid = folder3['uuid']
        folder3_label = folder3['label']

        # フォルダ1を複製する
        folder4 = self.post_uri('/api/v0/folders', {'source': folder1_uuid}, self.USER1)
        folder4_uuid = folder4['uuid']
        folder4_label = folder4['label']

        # 複製した全てのフォルダを同時に削除する
        self.run_until_complete(
            self.async_delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1),
            self.async_delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1),
            self.async_delete_uri(f'/api/v0/folders/{folder3_uuid}', self.USER1),
            self.async_delete_uri(f'/api/v0/folders/{folder4_uuid}', self.USER1)
        )

        # ゴミ箱を空にする
        self.empty_trash()

    def test_concurrent_update_folders(self):
        """
        複製した複数のフォルダのラベルを同時に更新できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {'label': 'フォルダですよ1!!!!', 'parent': root.uuid}, self.USER1)
        folder1_uuid = folder1['uuid']

        # フォルダ2を複製する
        folder2 = self.post_uri('/api/v0/folders', {'source': folder1_uuid}, self.USER1)
        folder2_uuid = folder2['uuid']

        # フォルダ3を複製する
        folder3 = self.post_uri('/api/v0/folders', {'source': folder1_uuid}, self.USER1)
        folder3_uuid = folder3['uuid']

        # フォルダ4を複製する
        folder4 = self.post_uri('/api/v0/folders', {'source': folder1_uuid}, self.USER1)
        folder4_uuid = folder4['uuid']

        # 複製した全てのフォルダを同時に更新する
        self.run_until_complete(
            self.async_put_uri(f'/api/v0/folders/{folder1_uuid}', {'label': 'AAA'}, self.USER1),
            self.async_put_uri(f'/api/v0/folders/{folder2_uuid}', {'label': 'BBB'}, self.USER1),
            self.async_put_uri(f'/api/v0/folders/{folder3_uuid}', {'label': 'CCC'}, self.USER1),
            self.async_put_uri(f'/api/v0/folders/{folder4_uuid}', {'label': 'DDD'}, self.USER1)
        )

        # フォルダをほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)
        self.delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1)
        self.delete_uri(f'/api/v0/folders/{folder3_uuid}', self.USER1)
        self.delete_uri(f'/api/v0/folders/{folder4_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.empty_trash()

    def test_concurrent_update_afolder(self):
        """
        同じフォルダのラベルを同時に更新できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {'label': 'フォルダですよ1!!!!', 'parent': root.uuid}, self.USER1)
        folder1_uuid = folder1['uuid']

        # 同じフォルダを同時に更新する
        self.run_until_complete(
            self.async_put_uri(f'/api/v0/folders/{folder1_uuid}', {'label': 'AAA'}, self.USER1),
            self.async_put_uri(f'/api/v0/folders/{folder1_uuid}', {'label': 'BBB'}, self.USER1),
            self.async_put_uri(f'/api/v0/folders/{folder1_uuid}', {'label': 'CCC'}, self.USER1),
            self.async_put_uri(f'/api/v0/folders/{folder1_uuid}', {'label': 'DDD'}, self.USER1)
        )

        # フォルダをほかす
        self.delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.empty_trash()

    def test_concurrent_update_aproject(self):
        """
        同じプロジェクトのラベルとメンバーを同時に更新できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクト1を作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {'label': 'プロジェクト1', 'parent': root.uuid}, self.USER3)
        project1_uuid = project1['uuid']
        project1_modified_at = project1['modifiedAt']

        data = {
            'members': [{'uuid' : self.USER2.uuid, 'type': 'Writer'},
                        {'uuid' : self.USER3.uuid, 'type': 'Owner'}],
            'lastModifiedAt' : project1_modified_at
        }

        # 同じプロジェクトを同時に更新する
        self.run_until_complete(
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', {'label': 'AAA'}, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', {'label': 'BBB'}, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', {'label': 'CCC'}, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', {'label': 'DDD'}, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', {'label': 'EEE'}, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', {'label': 'FFF'}, self.USER3),
            self.async_put_uri(f'/api/v0/projects/{project1_uuid}', data, self.USER3),
        )

        # ゴミ箱を空にする
        self.empty_trash()

    def test_coucurrent_update_aframe(self):
        """
        同じフレームのラベルと文字コードを同時に更新できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクト1を作成する(POST /projects)
        project1 = self.post_uri('/api/v0/projects', {'label': 'プロジェクト1', 'parent': root.uuid}, self.USER3)
        project1_uuid = project1['uuid']

        # Frameを作成する(POST /frames)
        frame1 = self.post_frames('新しいフレームファイル!', project1_uuid, io.BytesIO(b"abcdef"), self.USER3)
        frame1_uuid = frame1['uuid']

        data = {
            'encoding': 'UTF-32',
            'newline' : 'CR+LF'
        }

        # 複製した全てのフレームを同時に更新する
        self.run_until_complete(
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', {'label': 'upd_label1'}, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', {'label': 'upd_label2'}, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', {'label': 'upd_label3'}, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', {'label': 'upd_label4'}, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', {'label': 'upd_label5'}, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', data, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', {'label': 'upd_label6'}, self.USER3),
            self.async_put_uri(f'/api/v0/frames/{frame1_uuid}', data, self.USER3),
        )

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.empty_trash()

    def test_concurrent_update_aflow(self):
        """
        同じフローを同時に更新できること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクト1を作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label': 'プロジェクト1', 'parent': root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # プロジェクトの下にフローを作成する
        data = {
            'parent': project_uuid,
            'label': '私のフロー',
            'flow': {'label':'私のフロー'}
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)
        flow_uuid = result['uuid']

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # フローを同時に更新する
        result1, result2, result3 = self.run_until_complete(
            self.async_put_uri(f'/api/v0/flows/{flow_uuid}', {'label':'私のフロー1', 'lock':lock_uuid}, self.USER3),
            self.async_put_uri(f'/api/v0/flows/{flow_uuid}', {'label':'私のフロー2', 'lock':lock_uuid}, self.USER3),
            self.async_put_uri(f'/api/v0/flows/{flow_uuid}', {'label':'私のフロー3', 'lock':lock_uuid}, self.USER3),
        )

        # フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER3)

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.empty_trash()
