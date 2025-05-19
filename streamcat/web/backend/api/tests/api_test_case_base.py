import pprint
import unittest
from fastapi.testclient import TestClient
from streamcat.store.tests.test_case_base import TestCaseBase
from streamcat.web.backend import app, logger
from ..utils import make_access_token, is_ok

class ApiTestCaseBase(TestCaseBase, unittest.TestCase):
    """
    各テストケースで使用する前処理と共通関数を定義する
    """

    # テストで使用するユーザのID
    # USER1 = None
    # USER2 = None
        
    @classmethod
    def setUpClass(cls):
        # 親クラスのsetUpClass()を実行する
        TestCaseBase.setUpClass()
        # テスト実行時はログ出力しない
        logger.disabled = True

    @classmethod
    def tearDownClass(cls):
        # 親クラスのtearDownClass()を実行する
        TestCaseBase.tearDownClass()

    def setUp(self) -> None:
        # テスト環境を構築する
        TestCaseBase.event_loop.run_until_complete(self.asyncSetUp())

    def tearDown(self) -> None:
        # テスト環境を破棄する
        TestCaseBase.event_loop.run_until_complete(self.asyncTearDown())

    def create_data(self, file_path_obj, data=None):
        """
        テストデータ作成用
        frameのuuidが返る
        """
        if data is not None:
            with file_path_obj.open('w') as f:
                import csv
                writer = csv.writer(f, lineterminator='\n')
                writer.writerows(data)
        
        with file_path_obj.open('rb') as f:
            root = self.finder.data.load_root()
            frame = root.create_frame(file_path_obj.name, f)
            frame.save()

        # 作成を確定する
        self.finder.end()

        # save()によりreadable=Noneになるため再取得する
        return self.finder.data.find_by_uuid(frame.uuid).uuid

    def save_frame_to_library(self, frame_uuid, frame_file_path):
        """
        指定したパスのフレームを、指定したUUIDでライブラリに登録する
        """
        # from flask import g
        # with app.test_client() as client:
        #     with client.session_transaction() as session:
        #         session['userId'] = self.USER1.id
        #         from streamcat.store.auth.authz_session import AuthzSession, Session
        #         g.factory = AuthzSession(Session, user=self.USER1)

        # テストで用いるテスト用フレームをライブラリに登録する
        if not self.finder.data.exists(frame_uuid):
            # テストで用いるテスト用フレームをライブラリに登録する
            frame_folder = self.finder.data.load_root()
            class_name = self.__class__.__name__
            new_frame = frame_folder.create_frame(f'テスト用フレーム({class_name})', None)
            new_frame.uuid = frame_uuid
            new_frame.save(file_path=frame_file_path)

    def get_uri(self, uri, user):
        """
        URIをGETする
        """
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S':token}
            response = client.get(uri)
            result = response.json()
        error_detail = result.get('message') if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'GET {uri} is failed. {error_detail}')
        return result

    def get_file(self, uri, charset, user):
        """
        URIからファイルをダウンロードする
        """
        accept_charset = f';charset={charset}' if charset else ''
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S':token}
            # response = client.get(uri)
            response = client.get(uri, headers={'Accept':'text/csv'+ accept_charset})
            content_type = response.headers.get('content-yype')
            if content_type == 'application/json':
                result = response.json() or {}
                error_detail = result.get('message') if 'message' in result else ''
                self.assertTrue(is_ok(response.status_code), f'GET {uri} is failed. {error_detail}')
                return result
            else:
                self.assertTrue(is_ok(response.status_code), f'GET {uri} is failed.')
                return response.content

    def post_uri(self, uri, json_data, user):
        """
        URIへPOSTする
        """
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S': token}
            response = client.post(uri,
                                   headers={'content_type': 'application/json'},
                                   json=json_data)
            result = response.json() or {}
        error_detail = result.get('message') if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'POST {uri} is failed. {error_detail}')
        return result

    def post_locks(self, uri, json_data, user):
        """
        URIへPOSTする
        """
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S':token}
            response = client.post(uri,
                                   headers={'content_type': 'application/json'},
                                   json=json_data)
            result = response.json() or {}
        error_detail = result.get('message') if 'message' in result else ''
        return result

    def post_files(self, uri, label, parent_uuid, frame_stream, user):
        """
        指定するストリームをアップロードする
        """
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S':token}
            if label is None:
                data = {'parent':parent_uuid}
            else:
                data = {'label':label, 'parent':parent_uuid}
            response = client.post(uri,
                                    headers={'content_type': 'multipart/form-data'},
                                    data=data,
                                    files={
                                        'file': frame_stream
                                    }
                                  )
            result = response.json() or {}
        error_detail = result.get('message') if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), msg=f'POST {uri} is failed. {error_detail}')
        return result

    def post_frames(self, label, parent_uuid, frame_stream, user):
        """
        URI(/api/v0/frames)へPOSTする
        """
        return self.post_files('/api/v0/frames', label, parent_uuid, frame_stream, user)

    def post_documents(self, label, parent_uuid, frame_stream, user):
        """
        URI(/api/v0/documents)へPOSTする
        """
        return self.post_files('/api/v0/documents', label, parent_uuid, frame_stream, user)

    def post_flows(self, label, parent_uuid, stream, user):
        """
        URI(/api/v0/archives/flows)へPOSTする
        指定するストリームをフローとしてアップロードする
        """
        return self.post_files('/api/v0/archives/flows', label, parent_uuid, stream, user)

    def put_uri(self, uri, json_data, user):
        """
        URIへPUTする
        """
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S':token}
            response = client.put(uri,
                                  headers={'content_type': 'application/json'},
                                  json=json_data)
            # Silence parsing errors and return None instead.
            result = response.json() or {}
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'PUT {uri} is failed. {error_detail}')
        return result

    def delete_uri(self, uri, user):
        """
        URIへDELETEする
        """
        # テストクライアントから例外を送出させない
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S': token}
            response = client.delete(uri)
            # Silence parsing errors and return None instead.
            result = response.json() or {}
        # error_detail = result['msg'] if 'message' in result else ''
        error_detail = result.get('message') if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'DELETE {uri} is failed. {error_detail}')
        return result

    def delete_uri_with_json(self, uri, json_data, user):
        """
        URIへDELETEする
        """
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user.uuid)
            client.cookies = {'S':token}
            request = client.build_request(
                'delete',
                uri,
                json=json_data,
                headers={'content_type': 'application/json'},
                cookies={'S':token}
            )
            response = client.send(request)
            # Silence parsing errors and return None instead.
            result = response.json() or {}
        error_detail = result.get('message') if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'DELETE {uri} is failed. {error_detail}')
        return result

    def post_login(self, email, password):
        """
        POST /library?session=on でログインする
        """
        uri = '/library?session=on'
        with TestClient(app, raise_server_exceptions=False) as client:
            response = client.post(uri,
                                   headers={'content_type': 'multipart/form-data'},
                                   data={'email'   : email,
                                         'password': password},
                                   # リダイレクトを追わない
                                   follow_redirects=False)
        self.assertEqual(response.status_code, 307, msg=f'POST {uri} is failed. response status: {response.status_code}')
        return response.text


    def post_register_complete(self, user_uuid, new_password):
        """
        POST /signup/complete でユーザを登録状態にする
        """
        uri = '/signup/complete'
        with TestClient(app, raise_server_exceptions=False) as client:
            token = make_access_token(user_uuid)
            client.cookies = {'S':token}
            response = client.post(uri,
                                   headers={'content_type': 'multipart/form-data'},
                                   data={'password': new_password},
                                   # リダイレクトを追わない
                                   follow_redirects=False)
        self.assertEqual(response.status_code, 307, msg=f'POST {uri} is failed. response status: {response.status_code}')
        return response.text
