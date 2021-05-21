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

        # フローをインポートする
        with open(root.path/'フローファイル.tgz', mode='rb') as f:
            self.post_flows(f, self.USER1)

        # フローはインポートされていること
        children = root.find_children_by_label('フローファイル')
        result = self.get_uri(f'/api/v0/projects/{children[0].uuid}', self.USER1)

        # プロジェクトフォルダが作成されていること
        self.assertEqual(result['data']['label'], 'フローファイル')
        self.assertEqual(result['data']['type'], 'project')
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
            self.post_flows(f, self.USER1)

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
