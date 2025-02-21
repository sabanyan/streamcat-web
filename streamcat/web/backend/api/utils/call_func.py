from typing import Callable

async def call_func(func:Callable, **kwargs):
    """
    関数または非同期関数を実行する
    """
    import inspect
    # エンドポイント関数を実行する
    if inspect.iscoroutinefunction(func):
        # 非同期で定義された関数の場合はawaitをつけて呼び出す必要がある
        return await func(**kwargs)
    else:
        return func(**kwargs)
