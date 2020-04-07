import os
import json
import unittest
import pprint
from pathlib import Path

from kskp.web.backend import app
from kskp.store import ss as session

class TestCaseBase(unittest.TestCase):
    """
    各テストケースで使用する前処理と共通関数を定義する
    """

    # テストで使用するユーザのID
    USER1 = None
    USER2 = None
        
    @classmethod
    def setUpClass(cls):
        from kskp.store.auth import User, Group
        # 管理者ユーザをSessionに設定する
        cls.USER1 = User.find_by_id(1)
        # Session変数に設定する
        session.user = cls.USER1
        # テストユーザを作成する
        cls.USER2 = User('test@kskp.io', 'testpass', 'Test')
        cls.USER2.save()
        # EveryOneグループにテストユーザを加える
        everyone_group = Group.load_everyone_group()
        everyone_group.join_user(cls.USER2)

        # ユーザを作成する
        # from kskp.store import create_user
        # with app.app_context():
        #     create_user('anonymous@aaa.bbb', '', 'user1', '')

        # # SQLAlchemyで使用するテーブルが存在しない場合は作成する
        # from kskp.store import BaseModel
        # from kskp.store import engine
        # # ルートデータストアを作成する
        # from kskp.store import Library
        # Library.load_root(creator=cls.USER1)

    @classmethod
    def tearDownClass(cls):
        # ライブラリフォルダを削除する
        from kskp.store import Datum, STORE_DIR
        library_path = STORE_DIR / Datum.find_root().path
        import shutil
        # shutil.rmtree(library_path.as_posix())
        # Sessionを閉じる
        from kskp.store import engine, ss as session
        session.close()
        # スキーマを破棄する
        from sqlalchemy import DDL
        engine.execute(DDL('DROP SCHEMA IF EXISTS %s CASCADE' % os.environ['KSKP_POSTGRESQL_SCHEMA_NAME']))

    def create_data(self, file_path_obj, data=None):
        """
        テストデータ作成用
        frameのuuidが返る
        """
        import uuid
        from kskp.store import Library, Datum

        if data is not None:
            with file_path_obj.open('w') as f:
                import csv
                writer = csv.writer(f, lineterminator='\n')
                writer.writerows(data)
        
        root = Library.load_root()
        frame = Library.save_frame(root.uuid,
                                   str(uuid.uuid4()),
                                   Path(Datum._to_rel_path(file_path_obj.as_posix())))
        return frame.uuid

    def save_frame_to_library(self, frame_uuid, frame_file_path):
        """
        指定したパスのフレームを、指定したUUIDでライブラリに登録する
        """
        from flask import g

        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = self.USER1.id
                from kskp.store import AuthzSession, Session
                g.factory = AuthzSession(Session, user=self.USER1)


                # from kskp.store import get_frame_dir_path
                from kskp.web.backend.api.lib import get_library
                # テストで用いるテスト用フレームをライブラリに登録する
                from kskp.store import Frame
                if not Frame.exists(frame_uuid):
                    # テストで用いるテスト用フレームをライブラリに登録する
                    frame_folder = get_library(user=self.USER1)
                    class_name = self.__class__.__name__
                    new_frame = Frame(frame_folder.uuid, 'テスト用フレーム(%s)' % class_name, None)
                    new_frame.uuid = frame_uuid
                    new_frame.add_entry_from_path(Path(frame_file_path))

    def remove_frame_from_library(self, frame_uuid):
        """
        指定したUUIDのフレームをライブラリから削除する
        (実ファイルは削除しない)
        """
        # from kskp.store import Frame
        # frame = Frame.find_by_uuid(frame_uuid)
        # if frame is not None:
        #     frame.remove_reference_only()
        pass

    def save_flow_to_library(self, flow_uuid, flow_file_path):
        """
        指定したパスのフローを、指定したUUIDでライブラリに登録する
        """
        # テストで用いるテスト用フローをライブラリに登録する
        from kskp.store import Flow
        if not Flow.exists(flow_uuid):
            # テストで用いるテスト用フローをライブラリに登録する
            from kskp.store import Library
            flow_folder = Library.load_flow_folder(self.USER1)
            class_name = self.__class__.__name__
            # フローJSONファイルからフローデータを取得する
            import pathlib
            flow_path = pathlib.Path(app.root_path).parent / flow_file_path
            flow_data = json.loads(flow_path.read_text(encoding='utf-8'))
            # フローオブジェクトを作成する
            test_flow = Flow(flow_folder.uuid, 'テストフロー！(%s)' % class_name, flow_data, self.USER1)
            # フローをライブラリに保存する
            test_flow.uuid = flow_uuid
            test_flow.save()


    def remove_flow_from_library(self, flow_uuid):
        """
        指定したUUIDのフローをライブラリから削除する
        (もちろん登録元フローファイルは削除されない)
        """
        from kskp.store import Flow
        flow = Flow.find_by_uuid(flow_uuid)
        if flow is not None:
            flow.delete()


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
