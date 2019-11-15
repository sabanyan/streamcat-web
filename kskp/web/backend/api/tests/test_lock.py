import os
import json
import uuid
import pprint
from pathlib import Path
import unittest

from kskp.web.backend import app
from kskp.store import ss
from kskp.store import StoreModel as Store
from kskp.store import Datum, Frame, AwsS3, STORE_DIR
from kskp.web.backend.api.tests.test_case_base import TestCaseBase

class LockFlowTestCase(TestCaseBase):

    def create_flow(self, parent_uuid, source_uuid):
        new_flow_name = '新しいフローでーす！'

        data_source = {
            "id": "i1",
            "type": "frame",
            "dataSource": "csv",
            "uuid": source_uuid,
            "label": "test",
            "makeCache": False,
            "cacheCreatedAt": None
        }

        data1 = {
            'project_uuid': parent_uuid,
            'name': new_flow_name,
            'datasource': data_source
        }
        return self.post_uri('/api/v0/flows', data1, self.USER_ID)

    def update_flow(self, flow_uuid, source_uuid, lock_uuid=None):
        data_source = {
            "id": "i1",
            "type": "frame",
            "dataSource": "csv",
            "uuid": source_uuid,
            "label": "test",
            "makeCache": False,
            "cacheCreatedAt": None
        }

        data1 = {
            'name': '変更後のフローでーす',
            'datasource': data_source
        }

        if lock_uuid==None:
            d = {'label': 'ラベル', 'flow': data1}
        else:
            d = {'label': 'ラベル', 'flow': data1, 'lock': lock_uuid}
        return self.put_uri(f'/api/v0/flows/{flow_uuid}', d, self.USER_ID)

    def delete_uri_with_json(self, uri, json_data, user_id):
        """
        URIへDELETEする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user_id
            response = client.delete(uri,
                                     content_type='application/json',
                                     data=json.dumps(json_data))
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        self.assertTrue(result['success'], 'DELETE %s is failed. %s' % (uri, error_detail))
        return result

    def post_locks(self, uri, json_data, user_id):
        """
        URIへPOSTする
        """
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user_id
            response = client.post(uri,
                                   content_type='application/json',
                                   data=json.dumps(json_data))
            result = json.loads(response.get_data())
        error_detail = result['message'] if 'message' in result else ''
        return result

    # @unittest.skip
    def test_lock(self):
        """
        フローのロックをテストする
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER_ID)
        root_uuid = result['data']['uuid']
        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyD.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1D', root_uuid, f, self.USER_ID)
        frame_uuid = result['data']['uuid']
        # フォルダを作成する
        result = self.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー1'}, self.USER_ID)
        folder_uuid = result['data']['uuid']
        # フローを作成する
        result = self.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid)
        # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER_ID)
        flow_uuid = result['data']['children'][0]['uuid']
        # フローをロックする
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid}, self.USER_ID)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']
        # ロックUUIDなしで更新を試みる
        with self.assertRaises(Exception):
            result = self.update_flow(flow_uuid, source_uuid=frame_uuid)
            self.assertFalse(result['success'])
            self.assertEqual(result['code'], -2)
        # ロックUUIDなしで削除を試みる
        with self.assertRaises(Exception):
            result = self.delete_uri(f'/api/v0/flows/{flow_uuid}', self.USER_ID)
            self.assertFalse(result['success'])
            self.assertEqual(result['code'], -2)
        # 適当なロックUUIDで更新を試みる
        with self.assertRaises(Exception):
            result = self.update_flow(flow_uuid, source_uuid=frame_uuid, lock_uuid=str(uuid.uuid4()))
            self.assertFalse(result['success'])
            self.assertEqual(result['code'], -2)
        # 適当なロックUUIDで削除を試みる
        with self.assertRaises(Exception):
            result = self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}',
                                                {'lock': str(uuid.uuid4())},
                                                self.USER_ID)
            self.assertFalse(result['success'])
            self.assertEqual(result['code'], -2)
        # 正しいロックUUIDで更新する
        result = self.update_flow(flow_uuid, source_uuid=frame_uuid, lock_uuid=lock_uuid)
        # 正しいロックUUIDで削除する
        result = self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}',
                                            {'lock' : lock_uuid},
                                            self.USER_ID)
        # フローのロックを解除する
        result = self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER_ID)

    # @unittest.skip
    def test_conflict(self):
        """
        ロックのかかっているフローは更新・削除できない
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER_ID)
        root_uuid = result['data']['uuid']
        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyE.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root_uuid, f, self.USER_ID)
        frame_uuid = result['data']['uuid']

        # フォルダ1を作成する
        result = self.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー1'}, self.USER_ID)
        folder_uuid1 = result['data']['uuid']
        # フロー1を作成する
        result = self.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid1)
        # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
        result = self.get_uri(f'/api/v0/folders/{folder_uuid1}', self.USER_ID)
        flow_uuid1 = result['data']['children'][0]['uuid']
        
        # フローをロックする
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid1}, self.USER_ID)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']

        # 再び同じフローのロックを試みる
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid1}, self.USER_ID)
        self.assertFalse(result['success'], 'POST locks is failed.')
        self.assertEqual(result['code'], -2)

        # フローのロックを解除する
        result = self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER_ID)

        # ロックの取得を諦めないぞ
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid1}, self.USER_ID)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']

        # フローのロックを解除する
        result = self.delete_uri(f'/api/v0/locks/{lock_uuid}', self.USER_ID)

    @unittest.skip
    def test_simulutaneous_lock(self):
        """
        同時にロック取得と解除を繰り返す
        """ 
        class Worker():
            def __init__(self, testCaseBase):
                self.base = testCaseBase

            def create_lock_in_thread(self, flow_uuid):
                result = self.base.post_locks('/api/v0/locks', {'target' : flow_uuid}, self.base.USER_ID)
                self.base.assertTrue(result['success'], 'POST locks is failed.')
                lock_uuid = result['data']['uuid']
                return lock_uuid

            def create_unlock_in_thread(self, lock_uuid):
                # フローのロックを解除する
                self.base.delete_uri(f'/api/v0/locks/{lock_uuid}', self.base.USER_ID)

            def create_flow_in_thread(self, ):
                # ルートフォルダを作成する
                result = self.base.get_uri('/api/v0/library', self.base.USER_ID)
                root_uuid = result['data']['uuid']
                # フレームを作成する(POST /frames)
                import io
                f = (io.BytesIO(b"abcdef"), 'dummyE.csv')
                # フレームデータを作成する(POST /frames)
                result = self.base.post_frames('フレームファイル_1E', root_uuid, f, self.base.USER_ID)
                frame_uuid = result['data']['uuid']
                # フォルダ1を作成する
                result = self.base.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー1'}, self.base.USER_ID)
                folder_uuid1 = result['data']['uuid']
                # フロー1を作成する
                result = self.base.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid1)
                # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
                result = self.base.get_uri(f'/api/v0/folders/{folder_uuid1}', self.base.USER_ID)
                flow_uuid1 = result['data']['children'][0]['uuid']
                return flow_uuid1
            
            def run(self, q):
                # フローを作成する
                flow_uuid = self.create_flow_in_thread()
                # flow_uuid = str(uuid.uuid4())
                # ロックする
                print(f'Lock')
                lock_uuid = self.create_lock_in_thread(flow_uuid)
                # 寝る
                import time
                # time.sleep(1)
                # ロックを解除する
                print(f'Unlock')
                self.create_unlock_in_thread(lock_uuid)
                # 
                q.get()
                q.task_done()


        import threading
        from queue import Queue

        worker = Worker(self)
        q = Queue()

        # テストを実行する
        # for i in range(100):
        #     q.put(i)
        #     thread = threading.Thread(target=worker.run, name=str(i), args=(q, ))
        #     thread.start()

        import multiprocessing

        for i in range(1):
            q.put(i)
            process = multiprocessing.Process(target=worker.run, name=str(i), args=(q, ))
            process.start()

        # 全てのスレッドが終了するのを待つ
        # (全て終了してからテスト環境を削除する必要があるため)
        # q.join()
        process.join()