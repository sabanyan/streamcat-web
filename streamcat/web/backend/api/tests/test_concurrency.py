import io
import pprint
from .api_async_test_case_base import ApiAsyncTestCaseBase

class ConcurrencyTest(ApiAsyncTestCaseBase):

    simple_flow = {
        'label': 'flow',
        'nodes': [
            {
                'id': 'c',
                'label': 'c',
                'type': 'command',
                'commandId': 'mnewnumber',
                'args': {
                    'I': '1',
                    'S': '1',
                    'a': 'num',
                    'l': '100'
                },
                'srcs': {
                },
                'dsts': {
                    'o': 'd'
                },
            },
            {
                'id': 'd',
                'label': 'd',
                'type': 'frame',
                'dataSource': 'csv'
            },
            {
                'id': 'c1',
                'label': 'c1',
                'type': 'command',
                'commandId': 'msetstr',
                'args': {
                    'a': 'flg',
                    'v': 'true'
                },
                'srcs': {
                    'i': 'd'
                },
                'dsts': {
                    'o': 'd1'
                },
            },
            {
                'id': 'd1',
                'label': 'd1',
                'type': 'frame',
                'dataSource': 'csv'
            },
        ],
        'ports': [
            [],
            []
        ],
        'params': []
    }

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
        self.run_until_complete(
            self.async_delete_uri(f'/api/v0/folders/{folder1_uuid}', self.USER1),
            self.async_delete_uri(f'/api/v0/folders/{folder2_uuid}', self.USER1),
            self.async_delete_uri(f'/api/v0/folders/{folder3_uuid}', self.USER1),
            self.async_delete_uri(f'/api/v0/folders/{folder4_uuid}', self.USER1),
        )

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

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project1_uuid}', self.USER3)

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

    def test_concurrent_vizs(self):
        """
        プレビューを同時に取得できること
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
            'flow': self.simple_flow
        }
        result = self.post_uri('/api/v0/flows', data, self.USER3)
        flow_uuid = result['uuid']

        # フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER3)
        lock_uuid = result['uuid']

        # Vizを作成する
        data = {
            'uuid': flow_uuid,
            'args': {
                'use_cache': True,
                'vis': {
                    'd1': {
                        'command_id': 'csvtohtmltable',
                        'args': {
                            'limit': 100
                        }
                    }
                }
            },
            'lock': lock_uuid
        }

        # プレビューを同時に取得する
        viz1, viz2, viz3 = self.run_until_complete(
            self.aync_post_uri('/api/v0/vizs', data, self.USER3),
            self.aync_post_uri('/api/v0/vizs', data, self.USER3),
            self.aync_post_uri('/api/v0/vizs', data, self.USER3),
        )

        # プレビュー結果を検証する
        outs0 = viz1['outs'][0]
        self.assertEqual(outs0['id'], 'd1')
        self.assertEqual(outs0['label'], 'd1')
        self.assertIn('datum', outs0)
        self.assertIsNone(outs0['parent'])
        self.assertEqual(outs0['args']['column_names'][0], 'num')
        self.assertEqual(outs0['args']['column_names'][1], 'flg')
        self.assertIn('contents', outs0)

        # プレビュー結果を検証する
        outs1 = viz2['outs'][0]
        self.assertEqual(outs1['id'], 'd1')
        self.assertEqual(outs1['label'], 'd1')
        self.assertIn('datum', outs1)
        self.assertIsNone(outs1['parent'])
        self.assertEqual(outs1['args']['column_names'][0], 'num')
        self.assertEqual(outs1['args']['column_names'][1], 'flg')
        self.assertIn('contents', outs1)

        # プレビュー結果を検証する
        outs2 = viz3['outs'][0]
        self.assertEqual(outs2['id'], 'd1')
        self.assertEqual(outs2['label'], 'd1')
        self.assertIn('datum', outs2)
        self.assertIsNone(outs2['parent'])
        self.assertEqual(outs2['args']['column_names'][0], 'num')
        self.assertEqual(outs2['args']['column_names'][1], 'flg')
        self.assertIn('contents', outs2)

        # フローの排他ロックを解除する
        self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER3)

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

        # ゴミ箱を空にする
        self.empty_trash()

    def test_concurrent_update_auser(self):
        """
        同じユーザーを同時に更新できること
        """
        # ユーザを作成する
        result = self.post_uri('/api/v0/users', {'email':'google@gmail.com', 'name':'一人のユーザ', 'password':'sdrtgbnjkjh'}, self.USER1)
        user_uuid = result['uuid']

        # 作成したユーザを登録状態にする
        new_user = self.factory.user.find_by_uuid(user_uuid)
        new_user.update_password('asginfof85')

        # 登録を確定する
        self.factory.end()

        # ユーザ管理者は、ユーザ情報を変更する
        data = {
            'email': 'new@gmail.com',
            'name' : 'アイアムユーザ',
        }

        # ユーザを同時に更新する
        result1, result2, result3  = self.run_until_complete(
            self.async_put_uri(f'/api/v0/users/{user_uuid}', data, self.USER1),
            self.async_put_uri(f'/api/v0/users/{user_uuid}', data, self.USER1),
            self.async_put_uri(f'/api/v0/users/{user_uuid}', data, self.USER1),
        )

        # 更新結果を検証する
        self.assertEqual(result1['uuid'], user_uuid)
        self.assertEqual(result1['type'], 'user')
        self.assertEqual(result1['email'], data['email'])
        self.assertEqual(result1['name'], data['name'])
        self.assertEqual(result1['state'], 'active')

        # 更新結果を検証する
        self.assertEqual(result2['uuid'], user_uuid)
        self.assertEqual(result2['type'], 'user')
        self.assertEqual(result2['email'], data['email'])
        self.assertEqual(result2['name'], data['name'])
        self.assertEqual(result2['state'], 'active')

        # 更新結果を検証する
        self.assertEqual(result3['uuid'], user_uuid)
        self.assertEqual(result3['type'], 'user')
        self.assertEqual(result3['email'], data['email'])
        self.assertEqual(result3['name'], data['name'])
        self.assertEqual(result3['state'], 'active')

        # ユーザを削除する
        self.delete_uri(f'/api/v0/users/{user_uuid}', self.USER1)

    def test_cuncurrent_empty_trash(self):
        """
        ゴミ箱を同時に空にできること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する(POST /projects)
        project = self.post_uri('/api/v0/projects', {'label': 'プロジェクトですよ', 'parent': root.uuid}, self.USER1)
        project_uuid = project['uuid']

        # フォルダ1を作成する(POST /folders)
        folder1 = self.post_uri('/api/v0/folders', {'label': 'フォルダですよ1!!!!', 'parent': project_uuid}, self.USER1)
        folder1_uuid = folder1['uuid']

        # フレームを作成する(POST /frames)
        frame1 = self.post_frames('新しいフレームファイル!', folder1_uuid, io.BytesIO(b'abcdef'), self.USER1)
        frame1_uuid = frame1['uuid']

        # フレームを複製する
        frame2_uuid, frame3_uuid = self.run_until_complete(
            self.aync_post_uri('/api/v0/frames', {'source': frame1_uuid}, self.USER1),
            self.aync_post_uri('/api/v0/frames', {'source': frame1_uuid}, self.USER1)
        )

        # プロジェクトをほかす
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を同時に空にする
        self.run_until_complete(
            self.async_delete_uri('/api/v0/trashes', self.USER0),
            self.async_delete_uri('/api/v0/trashes', self.USER1),
            self.async_delete_uri('/api/v0/trashes', self.USER2),
            self.async_delete_uri('/api/v0/trashes', self.USER3)
        )

        # ゴミ箱が空になっていることを検証する
        trash_can = self.factory.data.load_trash_folder()
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    def test_open_floweditor(self):
        """
        フローエディタ画面を開くときのAPI発行を再現する
        """
        import time

        # ルートを取得する
        root = self.factory.data.load_root()

        # 処理時間の計測を開始する
        start = time.process_time()

        # ユーザを同時に更新する
        self.run_until_complete(
            self.async_get_uri(f'/api/v0/subflows', self.USER0),
            self.async_get_uri(f'/api/v0/datasrcs', self.USER1),
            self.async_get_uri(f'/api/v0/datadsts', self.USER2),
            self.async_get_uri(f'/api/v0/commands', self.USER3),
            self.async_get_uri(f'/api/v0/vcommands', self.USER0),
        )

        # 処理時間の計測を終了する
        end = time.process_time()

        # 処理時間を出力する
        print(end-start)
