import csv
import pprint

from streamcat.core import Tmp
from .api_test_case_base import ApiTestCaseBase

class DocumentTest(ApiTestCaseBase):

    def test_create_get_document(self):
        """
        Documentを取得できること
        """
        # プロジェクトを作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label' : '新しいプロジェクト', 'parent': self.root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"thisIsDocumentFile")

        # ドキュメントを作成する(POST /documents)
        result = self.post_documents('新しいドキュメント', project_uuid, f, self.USER3)
        document_uuid = result['uuid']

        # ドキュメントを取得する(GET /documents)
        result = self.get_uri(f'/api/v0/documents/{document_uuid}', self.USER3)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいドキュメント'
            ,'type'     : 'document'
            ,'creator'  : self.USER3.name
        }

        # GET /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['uuid'], None)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # ドキュメントの内容を取得する(GET /documents)
        result = self.get_file(f'/api/v0/documents/{document_uuid}?contents=on', charset=None, user=self.USER3)

        # ドキュメントの内容が取得できること
        self.assertEqual(result, b'thisIsDocumentFile')

        # 中のファイルをほかす(DELETE /documents)
        self.delete_uri(f'/api/v0/documents/{document_uuid}', self.USER3)

        # プロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

    def test_create_delete_document(self):
        """
        ドキュメントを作成して削除できること
        """
        # プロジェクトを作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label' : '新しいプロジェクト', 'parent': self.root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"abcdef")

        # ドキュメントを作成する(POST /documents)
        result = self.post_documents('新しいドキュメント!', project_uuid, f, self.USER3)
        document_uuid = result['uuid']

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいドキュメント!'
            ,'type'     : 'document'
            ,'creator'  : self.USER3.name
        }

        # Post /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])

        # 中のファイルごとプロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

    def test_update_document(self):
        """
        ドキュメントのラベル名を変更できること
        """
        # プロジェクトを作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label' : '新しいプロジェクト', 'parent': self.root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"thisisadocfile")

        # ドキュメントを作成する(POST /documents)
        result = self.post_documents('新しいドキュメント!', project_uuid, f, self.USER3)
        document_uuid = result['uuid']

        # フレームのラベル名を変更する(PUT /documents)
        result = self.put_uri(f'/api/v0/documents/{document_uuid}', {'label': ' DOCUMENT-F I L E '}, self.USER3)

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : ' DOCUMENT-F I L E '
            ,'type'     : 'document'
            ,'creator'  : self.USER3.name
        }

        # PUT /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['uuid'], None)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # 中のファイルごとプロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

    def test_delete_document(self):
        """
        ドキュメントを作成して削除できること
        """
        # プロジェクトを作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label' : '新しいプロジェクト', 'parent': self.root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"abcdefghijk")

        # ドキュメントを作成する(POST /documents)
        result = self.post_documents('新しいドキュメント!', project_uuid, f, self.USER3)
        document_uuid = result['uuid']

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : '新しいドキュメント!'
            ,'type'     : 'document'
            ,'creator'  : self.USER3.name
        }

        # Post /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])

        # ドキュメントをほかす(DELETE /projects)
        result = self.delete_uri(f'/api/v0/documents/{document_uuid}', self.USER3)

        # ゴミ箱のUUID
        trash_folder_uuid = self.finder.data.load_trash_folder().uuid

        # DELETE /documents apiの戻り値が正しいことを検証する
        self.assertEqual(result['uuid'], document_uuid)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['folderUuid'], trash_folder_uuid)
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

    def test_detect_content_type(self):
        """
        新規作成するドキュメントのファイルタイプを識別できること
        """
        # プロジェクトを作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label' : '新しいプロジェクト', 'parent': self.root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # 識別対象のファイル内容
        l = [[11, 12, 13, 14], [21, 22, 23, 24], [31, 32, 33, 34]]

        # アップロード用に一時ファイルを作成する
        tmp_file = Tmp.create_file()
        with tmp_file.open(mode='w') as f:
            writer = csv.writer(f)
            writer.writerows(l)

        # ドキュメントを作成する(POST /documents)
        with tmp_file.open(mode='rb') as f:
            result = self.post_documents('IamCSVfile', project_uuid, f, self.USER3)
            document_uuid = result['uuid']

        # 期待するAPIの戻り値
        expected_result = {
             'label'    : 'IamCSVfile'
            ,'type'     : 'frame'
            ,'creator'  : self.USER3.name
        }

        # PUT /documents apiの戻り値が正しいことを検証する(uuidとcreatedAtは検証できない)
        self.assertNotEqual(result['uuid'], None)
        self.assertEqual(result['label'], expected_result['label'])
        self.assertEqual(result['type'], expected_result['type'])
        self.assertEqual(result['creator'], expected_result['creator'])
        self.assertNotEqual(result['createdAt'], None)

        # 中のファイルごとプロジェクトをほかす(DELETE /projects)
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER3)

        # 一時ファイルを削除する
        tmp_file.unlink()

    def test_duplicate_document(self):
        """
        ドキュメントを複製できること
        """
        # プロジェクトを作成する(POST /projects)
        result = self.post_uri('/api/v0/projects', {'label' : '新しいプロジェクト', 'parent': self.root.uuid}, self.USER3)
        project_uuid = result['uuid']

        # アップロード用に一時ファイルを作成する
        import io
        f = io.BytesIO(b"abcdefghijk")

        # ドキュメントを作成する(POST /documents)
        result = self.post_documents('新しいドキュメント!', project_uuid, f, self.USER3)
        document_uuid = result['uuid']

        # ドキュメントを複製する(POST /documents)
        result = self.post_uri(f'/api/v0/documents', {'source':document_uuid}, self.USER1)

        # APIの返り値を検証する
        self.assertNotEqual(result['uuid'], document_uuid)
        self.assertEqual(result['type'], 'document')
        self.assertEqual(result['label'], '新しいドキュメント! のコピー')
        self.assertIsNone(result['folderPath'])
        self.assertEqual(result['folderUuid'], project_uuid)
        self.assertIsNone(result['prevFolderPath'])
        self.assertEqual(result['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['createdAt'])
        self.assertEqual(result['fileSize'], 11)
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['lock'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])

        # ドキュメントをほかす(DELETE /projects)
        result = self.delete_uri(f'/api/v0/documents/{result["uuid"]}', self.USER3)
        result = self.delete_uri(f'/api/v0/documents/{document_uuid}', self.USER3)
