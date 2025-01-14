import functools # wraps for decorator
from typing import Callable

def encoder(obj):
    from streamcat.core import SavableDatum
    from streamcat.store import StoreModel
    from streamcat.store import FlowData
    from streamcat.store import ProjectFolder
    from streamcat.store.lock import Lock
    from streamcat.store.auth import User, Role
    from .vis_converter import VisConverter

    if isinstance(obj, VisConverter):
        # orjsonはbytesをdumpしないのでdecodeでstr型に変換する
        return obj.to_html().decode('utf-8')
    elif isinstance(obj, (StoreModel, Lock, SavableDatum, FlowData, User, Role, ProjectFolder.Member, Role.Member)):
        return obj.to_json()
    else:
        raise TypeError(f'{type(obj).__name__} is not JSON serializable')

def jsonify(func:Callable):
    """
    Convert the return value of the endpoint function to JSON
    """
    import orjson
    from fastapi.responses import Response

    @functools.wraps(func)
    async def wrapper(**kwargs):
        # エンドポイント関数を呼び出す
        result = await func(**kwargs)

        if isinstance(result, Response):
            # FastAPIのResponse型が返された場合はそのまま返す
            return result
        else:
            # NOTE: 標準のjsonは、カスタムエンコード処理を指定しても
            # オブジェクトの子孫要素を再帰的にエンコードしてくれない、そのためorjsonを用いる
            # NOTE: orjsonの初期設定
            # ・キーの並び順はソートされない
            # ・UTF-8にエンコードされる
            content = orjson.dumps(result, default=encoder)
            # orjsonが生成するJSON文字列をエンドポイントの戻り値にするため、Responseオブジェクトに格納して返す
            return Response(content=content, media_type='application/json')

    return wrapper
