import os
import json
import unittest
import pprint
from pathlib import Path

from kskp.web.backend import app
from kskp.store.tests.test_case_base import TestCaseBase

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
        # save()によりreadable=Noneになるため再取得する
        return self.factory.data.find_by_uuid(frame.uuid).uuid

    def save_frame_to_library(self, frame_uuid, frame_file_path):
        """
        指定したパスのフレームを、指定したUUIDでライブラリに登録する
        """
        # from flask import g

        # with app.test_client() as client:
        #     with client.session_transaction() as session:
        #         session['user_id'] = self.USER1.id
        #         from kskp.store.auth.authz_session import AuthzSession, Session
        #         g.factory = AuthzSession(Session, user=self.USER1)

        # テストで用いるテスト用フレームをライブラリに登録する
        if not self.factory.data.exists(frame_uuid):
            # テストで用いるテスト用フレームをライブラリに登録する
            frame_folder = self.factory.data.load_root()
            class_name = self.__class__.__name__
            new_frame = frame_folder.create_frame('テスト用フレーム(%s)' % class_name, None)
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
            flow_path = pathlib.Path(app.root_path).parent / flow_file_path
            flow_json = json.loads(flow_path.read_text(encoding='utf-8'))
            # フローオブジェクトを作成する
            test_flow = flow_folder.create_flow('テストフロー！(%s)' % class_name, flow_json)
            # フローをライブラリに保存する
            test_flow.uuid = flow_uuid
            test_flow.save()


    def get_uri(self, uri, user):
        """
        URIをGETする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.get(uri)
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'GET %s is failed. %s' % (uri, error_detail))
        return result

    def get_file(self, uri, user):
        """
        URIからファイルをダウンロードする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            # response = client.get(uri)
            with client.get(uri) as response:
                self.assertEqual(response.status_code, 200, msg=f'GET {uri} is failed. response status: {response.status}')

                if response.content_type == 'application/json':
                    result = json.loads(response.get_data())
                    error_detail = result['message'] if 'message' in result else ''
                    self.assertTrue(result['success'], f'GET {uri} is failed. {error_detail}')
                    return result
                else:
                    return response.get_data()

    def post_uri(self, uri, json_data, user):
        """
        URIへPOSTする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.post(uri,
                                   content_type='application/json',
                                   data=json.dumps(json_data))
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'POST %s is failed. %s' % (uri, error_detail))
        return result

    def post_frames(self, label, parent_uuid, frame_stream, user):
        """
        URI(/api/v0/frames)へPOSTする
        指定するストリームをフレームデータとしてアップロードする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.post('/api/v0/frames',
                                   content_type='multipart/form-data',
                                   data={
                                        'label' : label,
                                        'parent': parent_uuid,
                                        'file'  : frame_stream
                                        }
                                  )
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'POST %s is failed. %s' % ('/api/v0/frames', error_detail))
        return result

    def post_flows(self, stream, user):
        """
        URI(/api/v0/flow_files)へPOSTする
        指定するストリームをフローとしてアップロードする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.post('/api/v0/flow_files',
                                   content_type='multipart/form-data',
                                   data={
                                        'file' : stream
                                        }
                                  )
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'POST %s is failed. %s' % ('/api/v0/flow_files', error_detail))
        return result

    def put_uri(self, uri, json_data, user):
        """
        URIへPUTする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.put(uri,
                                  content_type='application/json',
                                  data=json.dumps(json_data))
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'PUT %s is failed. %s' % (uri, error_detail))
        return result

    def delete_uri(self, uri, user):
        """
        URIへDELETEする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.delete(uri)
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'DELETE %s is failed. %s' % (uri, error_detail))
        return result

    def delete_uri_with_json(self, uri, json_data, user):
        """
        URIへDELETEする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            response = client.delete(uri,
                                     content_type='application/json',
                                     data=json.dumps(json_data))
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'DELETE %s is failed. %s' % (uri, error_detail))
        return result

    def post_register_complete(self, email, new_password, user):
        """
        POST /signup/complete でユーザの登録状態にする
        """
        uri = '/signup/complete'
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
                session['signup_email'] = email
            response = client.post(uri,
                                   content_type='multipart/form-data',
                                   data={'password':new_password})
        self.assertEqual(response.status_code, 302, msg=f'POST {uri} is failed. response status: {response.status}')
        return response.get_data()
