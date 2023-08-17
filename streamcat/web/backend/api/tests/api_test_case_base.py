import json
import pprint

from streamcat.store.tests.test_case_base import TestCaseBase
from streamcat.web.backend import app
from ..utils import make_access_token, Status, is_ok

class ApiTestCaseBase(TestCaseBase):
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
        # テスト実行時はFlaskからログ出力しない
        app.logger.disabled = True

    @classmethod
    def tearDownClass(cls):
        # 親クラスのtearDownClass()を実行する
        TestCaseBase.tearDownClass()

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
            root = self.factory.data.load_root()
            frame = root.create_frame(file_path_obj.name, f)
            frame.save()

        # 作成を確定する
        self.factory.end()

        # save()によりreadable=Noneになるため再取得する
        return self.factory.data.find_by_uuid(frame.uuid).uuid

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
        if not self.factory.data.exists(frame_uuid):
            # テストで用いるテスト用フレームをライブラリに登録する
            frame_folder = self.factory.data.load_root()
            class_name = self.__class__.__name__
            new_frame = frame_folder.create_frame(f'テスト用フレーム({class_name})', None)
            new_frame.uuid = frame_uuid
            new_frame.save(file_path=frame_file_path)

    def save_flow_to_library(self, flow_uuid, flow_file_path):
        """
        指定したパスのフローを、指定したUUIDでライブラリに登録する
        """
        # テストで用いるテスト用フローをライブラリに登録する
        if not self.factory.data.exists(flow_uuid):
            # テストで用いるテスト用フローをライブラリに登録する
            flow_folder = self.factory.data.load_flow_folder()
            class_name = self.__class__.__name__
            # フローJSONファイルからフローデータを取得する
            import pathlib
            from streamcat.store import FlowData
            flow_path = pathlib.Path(app.root_path).parent / flow_file_path
            flow_json = json.loads(flow_path.read_text(encoding='utf-8'))
            flow_data = FlowData(flow_json)
            # フローオブジェクトを作成する
            test_flow = flow_folder.create_flow(f'テストフロー！({class_name})', flow_data)
            # フローをライブラリに保存する
            test_flow.uuid = flow_uuid
            test_flow.save()

    def get_uri(self, uri, user):
        """
        URIをGETする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.get(uri)
            result = response.get_json(silent=True)
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'GET {uri} is failed. {error_detail}')
        return result

    def get_file(self, uri, charset, user):
        """
        URIからファイルをダウンロードする
        """
        accept_charset = f';charset={charset}' if charset else ''
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            # response = client.get(uri)
            with client.get(uri, headers={'Accept':'text/csv'+ accept_charset}) as response:
                result = response.get_json(silent=True) or {}
                error_detail = result['message'] if 'message' in result else ''
                self.assertTrue(is_ok(response.status_code), f'GET {uri} is failed. {error_detail}')
                if response.content_type == 'application/json':
                    return result
                else:
                    return response.get_data()

    def post_uri(self, uri, json_data, user):
        """
        URIへPOSTする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.post(uri,
                                   content_type='application/json',
                                   data=json.dumps(json_data))
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'POST {uri} is failed. {error_detail}')
        return result

    def post_locks(self, uri, json_data, user):
        """
        URIへPOSTする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.post(uri,
                                   content_type='application/json',
                                   data=json.dumps(json_data))
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
        return result

    def post_files(self, uri, label, parent_uuid, frame_stream, user):
        """
        指定するストリームをアップロードする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.post(uri,
                                   content_type='multipart/form-data',
                                   data={
                                        'label' : label,
                                        'parent': parent_uuid,
                                        'file'  : frame_stream
                                        }
                                  )
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
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
        data = {
            'parent': parent_uuid,
            'file'  : stream
        }
        if label is not None:
            data['label'] = label
        
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.post('/api/v0/archives/flows',
                                   content_type='multipart/form-data',
                                   data=data
                                  )
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'POST {"/api/v0/archives/flows"} is failed. {error_detail}')
        return result

    def put_uri(self, uri, json_data, user):
        """
        URIへPUTする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.put(uri,
                                  content_type='application/json',
                                  data=json.dumps(json_data))
            # Silence parsing errors and return None instead.
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'PUT {uri} is failed. {error_detail}')
        return result

    def delete_uri(self, uri, user):
        """
        URIへDELETEする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.delete(uri)
            # Silence parsing errors and return None instead.
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'DELETE {uri} is failed. {error_detail}')
        return result

    def delete_uri_with_json(self, uri, json_data, user):
        """
        URIへDELETEする
        """
        with app.test_client() as client:
            token = make_access_token(user.uuid)
            client.set_cookie('S', token)
            response = client.delete(uri,
                                     content_type='application/json',
                                     data=json.dumps(json_data))
            # Silence parsing errors and return None instead.
            result = response.get_json(silent=True) or {}
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(is_ok(response.status_code), f'DELETE {uri} is failed. {error_detail}')
        return result

    def post_login(self, email, password):
        """
        POST /library?session=on でログインする
        """
        uri = '/library?session=on'
        with app.test_client() as client:
            response = client.post(uri,
                                   content_type='multipart/form-data',
                                   data={'email'   : email,
                                         'password': password})
        self.assertEqual(response.status_code, 302, msg=f'POST {uri} is failed. response status: {response.status}')
        return response.get_data()


    def post_register_complete(self, user_uuid, new_password):
        """
        POST /signup/complete でユーザを登録状態にする
        """
        uri = '/signup/complete'
        with app.test_client() as client:
            token = make_access_token(user_uuid)
            client.set_cookie('S', token)
            response = client.post(uri,
                                   content_type='multipart/form-data',
                                   data={'password': new_password})
        self.assertEqual(response.status_code, 302, msg=f'POST {uri} is failed. response status: {response.status}')
        return response.get_data()
