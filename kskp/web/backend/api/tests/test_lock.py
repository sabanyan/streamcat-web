import os
import json
import uuid
import pprint
import unittest

from kskp.web.backend import app
from .api_test_case_base import ApiTestCaseBase

class LockFlowTestCase(ApiTestCaseBase):

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
        return self.post_uri('/api/v0/flows', data1, self.USER1)

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
        return self.put_uri(f'/api/v0/flows/{flow_uuid}', d, self.USER1)

    # @unittest.skip
    def test_lock(self):
        """
        フローのロックをテストする
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']
        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyD.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1D', root_uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']
        # フォルダを作成する
        result = self.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー1'}, self.USER1)
        folder_uuid = result['data']['uuid']
        # フローを作成する
        result = self.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid)
        # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)
        flow_uuid = result['data']['children'][0]['uuid']
        # フローをロックする
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid}, self.USER1)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']
        # ロックUUIDなしで更新を試みる
        with self.assertRaises(Exception):
            result = self.update_flow(flow_uuid, source_uuid=frame_uuid)
            self.assertFalse(result['success'])
            self.assertEqual(result['code'], -2)
        # ロックUUIDなしで削除を試みる
        with self.assertRaises(Exception):
            result = self.delete_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)
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
                                                self.USER1)
            self.assertFalse(result['success'])
            self.assertEqual(result['code'], -2)
        # 正しいロックUUIDで更新する
        result = self.update_flow(flow_uuid, source_uuid=frame_uuid, lock_uuid=lock_uuid)
        # 正しいロックUUIDで削除する
        result = self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}',
                                            {'lock' : lock_uuid},
                                            self.USER1)
        # フローのロックを解除する
        result = self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

    # @unittest.skip
    def test_conflict(self):
        """
        ロックのかかっているフローは更新・削除できない
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']
        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyE.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root_uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # フォルダ1を作成する
        result = self.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー1'}, self.USER1)
        folder_uuid1 = result['data']['uuid']
        # フロー1を作成する
        result = self.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid1)
        # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
        result = self.get_uri(f'/api/v0/folders/{folder_uuid1}', self.USER1)
        flow_uuid1 = result['data']['children'][0]['uuid']
        
        # フローをロックする
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid1}, self.USER1)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']

        # 再び同じフローのロックを試みる
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid1}, self.USER1)
        self.assertFalse(result['success'], 'POST locks is failed.')
        self.assertEqual(result['code'], -2)

        # フローのロックを解除する
        result = self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

        # ロックの取得を諦めないぞ
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid1}, self.USER1)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']

        # フローのロックを解除する
        result = self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

    def test_unlock_target(self):
        """
        指定したUUIDのフローのロックを解除する
        """
        # ルートフォルダを作成する
        result = self.get_uri('/api/v0/library', self.USER1)
        root_uuid = result['data']['uuid']
        # フレームを作成する(POST /frames)
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyE.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('フレームファイル_1E', root_uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']
        # フォルダを作成する
        result = self.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー2'}, self.USER1)
        folder_uuid = result['data']['uuid']
        # フローを作成する
        result = self.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid)
        # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)
        flow_uuid = result['data']['children'][0]['uuid']
        # フローをロックする
        result = self.post_locks('/api/v0/locks', {'target' : flow_uuid}, self.USER1)
        self.assertTrue(result['success'], 'POST locks is failed.')
        lock_uuid = result['data']['uuid']
        # 正しいロックUUIDで更新する
        result = self.update_flow(flow_uuid, source_uuid=frame_uuid, lock_uuid=lock_uuid)
        # フローのUUIDでロックを解除する
        result = self.post_uri(f'/api/v0/delete-locks?of={flow_uuid}', {}, self.USER1)

    def test_expire_lock(self):
        """
        有効期間を過ぎたロックは解除される
        """

    def test_delete_locked_flow(self):
        """
        排他ロックされたフローはゴミ箱にほかせないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # フォルダを作成する
        result = self.post_uri('/api/v0/folders', {'parent':root.uuid, 'label':'伊右衛門'}, self.USER1)
        folder_uuid = result['data']['uuid']

        # USER1は、フォルダ内にFlowを作成する
        data = {
            'project_uuid': folder_uuid,
            'name': 'お〜いお茶',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}?projects=on', self.USER1)
        flow_uuid = result['data']['children'][0]['uuid']

        # 排他ロックをせずに、フローをゴミ箱にほかせないこと
        with self.assertRaises(AssertionError):
            self.delete_uri(f'/api/v0/flows/{flow_uuid}', self.USER1)

        # USER1は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # 誤った排他ロックのUUIDで、フローをゴミ箱にほかせないこと
        with self.assertRaises(AssertionError):
            self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}', {'lock':None}, self.USER1)

        # 排他ロックを指定すれば、フローをゴミ箱にほかせること
        self.delete_uri_with_json(f'/api/v0/flows/{flow_uuid}', {'lock':lock_uuid}, self.USER1)

        # USER1は、フローの排他ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

    def test_delete_locked_flow_in_folder(self):
        """
        フォルダ内にある排他ロックされたフローを、フォルダごとゴミ箱にほかせないこと
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # フォルダを作成する
        result = self.post_uri('/api/v0/folders', {'parent':root.uuid, 'label':'三ツ矢サイダー'}, self.USER1)
        folder_uuid = result['data']['uuid']

        # USER1は、フォルダ内にFlowを作成する
        data = {
            'project_uuid': folder_uuid,
            'name': '養老サイダー',
            'datasource': None
        }
        result = self.post_uri('/api/v0/flows', data, self.USER1)

        # フローを取得する
        # (POST /flowsは作成したフローのUUIDを返さないので)
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}?projects=on', self.USER1)
        flow_uuid = result['data']['children'][0]['uuid']

        # USER1は、フォルダ内にFrameを作成する
        import io
        f = (io.BytesIO(b"abcdef"), 'dummyD.csv')
        # フレームデータを作成する(POST /frames)
        result = self.post_frames('コケかけコケかけコケコーラ', folder_uuid, f, self.USER1)
        frame_uuid = result['data']['uuid']

        # USER1は、フローの排他ロックを取得する
        result = self.post_uri('/api/v0/locks', {'target':flow_uuid}, self.USER1)
        lock_uuid = result['data']['uuid']

        # フォルダをゴミ箱にほかす
        self.delete_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)

        # ゴミ箱に形代が作成されていること
        result = self.get_uri(f'/api/v0/trashes', self.USER1)
        self.assertNotEqual(result['data']['children'][0]['uuid'], folder_uuid)
        self.assertEqual(result['data']['children'][0]['label'], '三ツ矢サイダー')
        katashiro_folder_uuid = result['data']['children'][0]['uuid']

        # フォルダはゴミ箱にほかされていないこと
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][1]['label'], '三ツ矢サイダー')
        # 排他ロック中のフローはゴミ箱にほかされていないこと
        self.assertEqual(result['data']['children'][0]['uuid'], flow_uuid)

        # フレームはゴミ箱にほかされていること
        result = self.get_uri(f'/api/v0/folders/{katashiro_folder_uuid}', self.USER1)
        self.assertEqual(result['data']['children'][0]['uuid'], frame_uuid)
        self.assertEqual(result['data']['children'][0]['label'], 'コケかけコケかけコケコーラ')

        # USER1は、フローの排他ロックを解除する
        self.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.USER1)

        # フォルダをゴミ箱にほかす
        self.delete_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)

        # フォルダはゴミ箱にほかされていること
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER1)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][1]['label'], 'ゴミ箱')
        self.assertEqual(result['data']['folderPath'][2]['label'], '三ツ矢サイダー_2')
        # 排他ロックが解除されたフローはゴミ箱にほかされていること
        self.assertEqual(result['data']['children'][0]['uuid'], flow_uuid)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER1)

        # ゴミ箱は空になっていること
        result = self.get_uri(f'/api/v0/trashes', self.USER1)
        self.assertEqual(len(result['data']['children']), 0)

    @unittest.skip
    def test_simulutaneous_lock(self):
        """
        同時にロック取得と解除を繰り返す
        """ 
        class Worker():
            def __init__(self, testCaseBase):
                self.base = testCaseBase

            def create_lock_in_thread(self, flow_uuid):
                result = self.base.post_locks('/api/v0/locks', {'target' : flow_uuid}, self.base.USER1)
                self.base.assertTrue(result['success'], 'POST locks is failed.')
                lock_uuid = result['data']['uuid']
                return lock_uuid

            def create_unlock_in_thread(self, lock_uuid):
                # フローのロックを解除する
                self.base.post_uri(f'/api/v0/delete-locks/{lock_uuid}', {}, self.base.USER1)

            def create_flow_in_thread(self, ):
                # ルートフォルダを作成する
                result = self.base.get_uri('/api/v0/library', self.base.USER1)
                root_uuid = result['data']['uuid']
                # フレームを作成する(POST /frames)
                import io
                f = (io.BytesIO(b"abcdef"), 'dummyE.csv')
                # フレームデータを作成する(POST /frames)
                result = self.base.post_frames('フレームファイル_1E', root_uuid, f, self.base.USER1)
                frame_uuid = result['data']['uuid']
                # フォルダ1を作成する
                result = self.base.post_uri('/api/v0/folders', {'parent':root_uuid, 'label':'フロー1'}, self.base.USER1)
                folder_uuid1 = result['data']['uuid']
                # フロー1を作成する
                result = self.base.create_flow(source_uuid=frame_uuid, parent_uuid=folder_uuid1)
                # POST /flowsでuuidを取得できないので GET /flowsで取得するしかない
                result = self.base.get_uri(f'/api/v0/folders/{folder_uuid1}', self.base.USER1)
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