from fastapi.responses import JSONResponse

class SCatJSONResponse(JSONResponse):
    """
    ライブラリにおいて定義したクラスのJSONへのエンコード処理を定義する
    """
    def render(self, content) -> bytes:
        import orjson

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

        # NOTE: 標準のjsonは、カスタムエンコード処理を指定しても
        # オブジェクトの子孫要素を再帰的にエンコードしてくれない、そのためorjsonを用いる
        # NOTE: orjsonの初期設定
        # ・キーの並び順はソートされない
        # ・UTF-8にエンコードされる
        return orjson.dumps(content, default=encoder)
