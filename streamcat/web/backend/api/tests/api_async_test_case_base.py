import asyncio
from typing import Coroutine
from concurrent.futures import ThreadPoolExecutor
from .api_test_case_base import ApiTestCaseBase

class ApiAsyncTestCaseBase(ApiTestCaseBase):
    """
    非同期のAPI呼び出しをテストするためのベースクラス
    """

    @classmethod
    def setUpClass(cls):
        # 親クラスのsetUpClass()を実行する
        ApiTestCaseBase.setUpClass()
        # イベントループを作成する
        cls._loop = asyncio.new_event_loop()
        # カレントイベントループに設定する
        asyncio.set_event_loop(cls._loop)
        # 
        cls._executor = ThreadPoolExecutor(4)

    @classmethod
    def tearDownClass(cls):
        # スレッドプールを閉じる
        cls._executor.shutdown()
        # イベントループを閉じる
        cls._loop.close()
        # 親クラスのtearDownClass()を実行する
        ApiTestCaseBase.tearDownClass()

    def run_until_complete(self, *args:Coroutine):
        """
        コルーチンを実行する
        """
        if len(args) == 1:
            return self._loop.run_until_complete(args[0])
        else:
            # NOTE: FutureのListを登録すると以下の例外が送出される
            # RuntimeError: There is no current event loop in thread 'MainThread'
            return self._loop.run_until_complete(self._gather(*args))

    async def _gather(self, *coroutines):
        """
        複数のコルーチンをまとめる
        """
        return await asyncio.gather(*coroutines)

    def empty_trash(self):
        """
        ゴミ箱を空にする
        """
        self.delete_uri('/api/v0/trashes', self.USER1)
        trash_can = self.factory.data.load_trash_folder()
        trashed = trash_can.find_children()
        self.assertEqual(len(trashed), 0)

    async def async_get_uri(self, uri, user):
        print(f'stt GET by {user.name}')
        result = await self._loop.run_in_executor(self._executor, self.get_uri, uri, user)
        print(f'end GET by {user.name}')
        return result

    async def aync_post_uri(self, uri, json_data, user):
        print(f'stt POST by {user.name}')
        result = await self._loop.run_in_executor(self._executor, self.post_uri, uri, json_data, user)
        print(f'end POST by {user.name}')
        return result

    async def async_put_uri(self, uri, json_data, user):
        print(f'stt PUT by {user.name}')
        result = await self._loop.run_in_executor(self._executor, self.put_uri, uri, json_data, user)
        print(f'end PUT by {user.name}')
        return result

    async def async_delete_uri(self, uri, user):
        print(f'stt DELETE by {user.name}')
        result = await self._loop.run_in_executor(self._executor, self.delete_uri, uri, user)
        print(f'end DELETE by {user.name}')
        return result
