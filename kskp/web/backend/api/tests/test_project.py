import os
import unittest
import pprint

from .api_test_case_base import ApiTestCaseBase

class ProjectTestCase(ApiTestCaseBase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def get_record_by_sql(self, sql):
        """
        指定したSQL文を発行し、一つの結果行を取得する
        """
        from sqlalchemy import text
        results = self.factory._session.execute(text(sql))
        # 結果行の最初の1件目を返す
        for result in results:
            return result
        # 結果行が0件の場合はNoneを返す
        return None

    def test_new_project(self):
        """
        POST /projects APIをテストする
        """
        from kskp.core import Datum

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
        self.assertEqual(len(results['data']), 4)
        self.assertEqual(results['data'][0]['label'], 'MyProject ')
        self.assertEqual(results['data'][1]['label'], 'myproject')
        self.assertEqual(results['data'][2]['label'], 'MyProject')
        self.assertEqual(results['data'][3]['label'], 'データデスト📂')

        # MyProjectを除外して取得できること
        results = self.get_uri('/api/v0/projects?except_myproject=on', self.USER1)
        self.assertEqual(len(results['data']), 3)
        self.assertEqual(results['data'][0]['label'], 'MyProject ')
        self.assertEqual(results['data'][1]['label'], 'myproject')
        self.assertEqual(results['data'][2]['label'], 'データデスト📂')

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
