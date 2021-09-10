import os
import json
import tempfile
import pprint
from pathlib import Path

from kskp.web.backend import app
from .api_test_case_base import ApiTestCaseBase

class FileTestCase(ApiTestCaseBase):

    def setUp(self):
        app.testing = True
        self.TESTDATA_DIR = self.factory.data.load_root().path

    def test_upload_frame(self):
        """
        upload_frame APIをテストする
        """
        root_uuid = self.factory.data.load_root().uuid

        # アップロード用に一時ファイルを作成する
        i, file_name = tempfile.mkstemp()

        # ファイルをアップロードする
        with open(file_name, mode='rb') as f:
            result = self.post_frames('UPロードファイル', root_uuid, f, self.USER1)

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
        os.environ['KSKP_FRAME_CHARACTER_CODE'] = 'cp932'
        
        # テストデータをダウンロードする
        result = self.get_file(f'/api/v0/files?type=frame&uuid={frame_uuid}&ext=csv', self.USER1)

        # 作成したテストデータがS_JISに変換されていること
        self.assertEqual(result,
                         b'\x8c\xda\x8bq,\x90\x94\x97\xca,\x8b\xe0\x8az\r\n'
                         b'A,1,10\r\nA,2,20\r\nB,1,30\r\nB,3,40\r\nB,1,50\r\n')

        # 後片付け
        frame = self.factory.data.find_by_uuid(frame_uuid)
        frame.delete()

    def _save_file(self, path, stream):
        # 1MB
        READ_BUFFER_SIZE = 1 * 1024 * 1024
        with open(path, mode='wb') as f:
            while True:
                buff = stream.read(READ_BUFFER_SIZE)
                f.write(buff)
                if buff is None or len(buff)==0:
                    break

    def test_export_import_flow(self):
        """
        フローをエクスポート/インポートできること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # データソースを作成する
        import io
        frame = root.create_frame('データソース', io.BytesIO(b'abcdef'))
        frame.save()

        # フローを作成する
        flow = root.create_simple_flow('Export用フロー', frame)
        flow.save()

        # フローをエクスポートする
        result = self.get_file(f'/api/v0/flow_files/{flow.uuid}', self.USER1)
        self._save_file(root.path/'フローファイル.tgz', io.BytesIO(result))

        # インポート先のフォルダを作成する
        data = {'parent': root.uuid,
                'label' : '午後正午'}
        result = self.post_uri(f'/api/v0/projects', data, self.USER1)
        project_uuid = result['data']['uuid']

        # フローをインポートする
        with open(root.path/'フローファイル.tgz', mode='rb') as f:
            self.post_flows('宇宙ヤバイ', project_uuid, f, self.USER1)

        # フローはインポートされていること
        project = self.factory.data.find_by_uuid(project_uuid)
        children = project.find_children_by_label('宇宙ヤバイ')
        result = self.get_uri(f'/api/v0/projects/{children[0].uuid}', self.USER1)

        # フォルダが作成されていること
        self.assertEqual(result['data']['label'], '宇宙ヤバイ')
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['creator'], self.USER1.name)
        # プロジェクトフォルダ以下にフローとフレームが作成されていること
        self.assertEqual(result['data']['children'][0]['label'], 'Export用フロー')
        self.assertEqual(result['data']['children'][0]['type'], 'flow')
        self.assertEqual(result['data']['children'][0]['creator'], self.USER1.name)
        self.assertEqual(result['data']['children'][1]['label'], 'データソース')
        self.assertEqual(result['data']['children'][1]['type'], 'frame')
        self.assertEqual(result['data']['children'][1]['creator'], self.USER1.name)

        # インポートしたプロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{children[0].uuid}', self.USER1)
        # 作成したフローを削除する
        result = self.post_uri('/api/v0/locks', {'target':flow.uuid}, self.USER1)
        lock_uuid = result['data']['uuid']
        self.delete_uri_with_json(f'/api/v0/flows/{flow.uuid}', {'lock':lock_uuid}, self.USER1)

        # 編集者は、フローの排他ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

        # 作成したフレームを削除する
        self.delete_uri(f'/api/v0/frames/{frame.uuid}', self.USER1)
        # 作成したファイルを削除する
        (root.path/'フローファイル.tgz').unlink()
        # 作成したプロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)
        
    def test_export_import_folder(self):
        """
        フォルダ以下の全てのフローをエクスポート/インポートできること
        """
        # ルートを取得する
        root = self.factory.data.load_root()

        # ルートの下にプロジェクト1を作成する
        project1 = root.create_project_folder('プロジェクト')
        project1.save()

        # プロジェクト1の下にデータソース1を作成する
        import io
        frame1 = project1.create_frame('データソース1', io.BytesIO(b'abcdef0123'))
        frame1.save()

        # プロジェクト1の下にフロー1を作成する
        flow1 = project1.create_simple_flow('Export用フロー1', frame1)
        flow1.save()

        # プロジェクト1の下にフォルダ2を作成する
        folder2 = project1.create_folder('フォルダ！！')
        folder2.save()

        # フォルダ2の下にデータソース2を作成する
        frame2 = folder2.create_frame('データソース2', io.BytesIO(b'abcdef0123'))
        frame2.save()

        # フォルダ2の下にフロー2を作成する
        flow2 = folder2.create_simple_flow('Export用フロー2', frame2)
        flow2.save()

        # フローをエクスポートする
        result = self.get_file(f'/api/v0/flow_files/{project1.uuid}', self.USER1)
        self._save_file(root.path/'フォルダ丸ごと.tgz', io.BytesIO(result))

        # インポートしたプロジェクトと区別するため、エクスポート元のプロジェクトのラベル名を変更する
        project1.update_data('うごげ〜')

        # フローをインポートする
        with open(root.path/'フォルダ丸ごと.tgz', mode='rb') as f:
            self.post_flows(None, root.uuid, f, self.USER1)

        # フローはインポートされていること
        children = root.find_children_by_label('プロジェクト')
        result = self.get_uri(f'/api/v0/projects/{children[0].uuid}', self.USER1)

        # プロジェクトフォルダが作成されていること
        self.assertEqual(result['data']['label'], 'プロジェクト')
        self.assertEqual(result['data']['type'], 'project')
        self.assertEqual(result['data']['creator'], self.USER1.name)
        # プロジェクトフォルダ以下にフローとフレームが作成されていること
        folder2_uuid = result['data']['children'][0]['uuid']
        self.assertEqual(result['data']['children'][0]['label'], 'フォルダ！！')
        self.assertEqual(result['data']['children'][0]['type'], 'folder')
        self.assertEqual(result['data']['children'][0]['creator'], self.USER1.name)
        self.assertEqual(result['data']['children'][1]['label'], 'Export用フロー1')
        self.assertEqual(result['data']['children'][1]['type'], 'flow')
        self.assertEqual(result['data']['children'][1]['creator'], self.USER1.name)
        self.assertEqual(result['data']['children'][2]['label'], 'データソース1')
        self.assertEqual(result['data']['children'][2]['type'], 'frame')
        self.assertEqual(result['data']['children'][2]['creator'], self.USER1.name)

        # フォルダ2もインポートされていること
        result = self.get_uri(f'/api/v0/projects/{folder2_uuid}', self.USER1)

        # フォルダ2が作成されていること
        self.assertEqual(result['data']['label'], 'フォルダ！！')
        self.assertEqual(result['data']['type'], 'folder')
        self.assertEqual(result['data']['creator'], self.USER1.name)
        # フォルダ2以下にフローとフレームが作成されていること
        self.assertEqual(result['data']['children'][0]['label'], 'Export用フロー2')
        self.assertEqual(result['data']['children'][0]['type'], 'flow')
        self.assertEqual(result['data']['children'][0]['creator'], self.USER1.name)
        self.assertEqual(result['data']['children'][1]['label'], 'データソース2')
        self.assertEqual(result['data']['children'][1]['type'], 'frame')
        self.assertEqual(result['data']['children'][1]['creator'], self.USER1.name)

        # 作成したプロジェクト等を削除する
        self.delete_uri(f'/api/v0/projects/{children[0].uuid}', self.USER1)
        self.delete_uri(f'/api/v0/projects/{project1.uuid}', self.USER1)
        (root.path/'フォルダ丸ごと.tgz').unlink()

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_export_import_library_store(self):
        """
        ライブラリストアとその入力CSVファイルをエクスポート/インポートできること
        インラインサブフローをエクスポート/インポートできること
        """
        import io
        from kskp.core import KSKPBaseModel

        flow_json = {
            "label": "test用",
            "creator": "開発用",
            "createdAt": "2021-06-17 08:23:00",
            "projectId": None,
            "description": "",
            "ports": [[],[]],
            "params": [],
            "nodes": [
                {
                    "id": "d",
                    "label": "京阪乗る人おけいはん",
                    "type": "frame",
                    "dataSource": "csv"
                }
            ]
        }

        # ROOTを取得する
        root = self.factory.data.load_root()

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'お京阪'}, self.USER1)
        project_uuid0 = result['data']['uuid']
        project_modified_at = result['data']['modifiedAt']

        # CSVデータを作成する
        l = [['会社名','デザイン','線形','速度'],
             ['お京阪','イマイチ','bad','slow'], 
             ['半休','良い','good','slow'], 
             ['菌鉄','まあ','normal','slow']]
        csv_str = '\n'.join([KSKPBaseModel.join(line) for line in l])
        f = io.StringIO(csv_str)
        f = io.BytesIO(bytes(f.read(), encoding='utf-8'))

        # 入力フレームを作成する
        result = self.post_frames('電車🚆', project_uuid0, (f, 'train.csv'), self.USER1)
        frame_uuid = result['data']['uuid']

        # リモートフォルダを作成する
        data = {
            "parent"   : project_uuid0,
            "label"    : "リモートフォルダ",
            "protocol" : "smb",
            "hostname" : "18.178.64.116",
            "domain"   : "WORKGROUP",
            "directory": "share",
            "user_id"  : "samba",
            "password" : "kskanalytics"
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER1)

        # データソースの一覧を取得する
        results = self.get_uri('/api/v0/datasrcs', self.USER1)

        # ライブラリデータソースを作成する
        library_data_src = {}
        library_data_src['id'] = 'f0'
        library_data_src['type'] = 'flow'
        library_data_src['args'] = {'uuid':frame_uuid}
        library_data_src['dsts'] = {'d':'d'}
        library_data_src['flow'] = results['data'][0]['flow']

        # データデストの一覧を取得する
        results = self.get_uri('/api/v0/datadsts', self.USER1)

        # リモートフォルダデータデストを作成する
        rfolder_data_dst = {}
        rfolder_data_dst['id'] = 'f1'
        rfolder_data_dst['type'] = 'flow'
        rfolder_data_dst['args'] = {'file_path':'電車🚃'}
        rfolder_data_dst['srcs'] = {'d':'d'}
        rfolder_data_dst['flow'] = results['data'][1]['flow']

        # フローJSONを作成する
        flow_json['nodes'].append(library_data_src)
        flow_json['nodes'].append(rfolder_data_dst)

        # 編集者は、プロジェクト内にFlowを作成する
        data = {
            'parent': project_uuid0,
            'label': '半休電車',
            'flow': flow_json
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)
        flow_uuid = result['data']['uuid']

        # フローをエクスポートする
        result = self.get_file(f'/api/v0/flow_files/{flow_uuid}', self.USER1)
        self._save_file(root.path/'電車🚃.tgz', io.BytesIO(result))

        # インポート先のプロジェクトを作成する
        data = {'parent': root.uuid,
                'label' : '半休'}
        result = self.post_uri(f'/api/v0/projects', data, self.USER1)
        project_uuid1 = result['data']['uuid']

        # フローをインポートする
        with open(root.path/'電車🚃.tgz', mode='rb') as f:
            result = self.post_flows('阪急電車', project_uuid1, f, self.USER1)

        # フローはインポートされていること
        project = self.factory.data.find_by_uuid(project_uuid1)
        children = project.find_children_by_label('阪急電車')
        children = children[0].find_children_by_label('半休電車')
        self.assertEqual(children[0].type, 'flow')
        flow_uuid1 = children[0].uuid

        # インポート元のプロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid0}', self.USER1)
        self.delete_uri('/api/v0/trashes', self.USER1)

        # インポートしたフローを実行できること
        result = self.post_uri(f'/api/v0/activities', {'uuid':flow_uuid1}, self.USER1)
        data = result['data']
        outs = data['outs']

        # POST /activitiesの結果を検証する
        self.assertIsNotNone(data['uuid'])
        self.assertEqual(data['label'], '半休電車')
        self.assertEqual(data['type'], 'activity')
        self.assertEqual(len(outs), 1)
        self.assertEqual(outs[0]['id'], 'f1_d1')
        self.assertEqual(outs[0]['label'], 'f1_d1')
        self.assertIsNotNone(outs[0]['uuid'])
        self.assertIsNotNone(outs[0]['parent'])

        # フローの実行結果が出力されていること
        result = self.get_uri(f"/api/v0/flows/{outs[0]['uuid']}", self.USER1)
        self.assertEqual(result['data']['type'], 'flow')
        self.assertTrue(result['data']['label'].startswith('京阪乗る人おけいはん'))

        # インポート先のプロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid1}', self.USER1)
        self.delete_uri('/api/v0/trashes', self.USER1)

