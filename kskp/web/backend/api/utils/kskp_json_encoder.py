from flask.json import JSONEncoder
from kskp.store import StoreModel as Store
from kskp.store import Vis
from kskp.store import FlowData
from kskp.core import Datum
from kskp.store.lock_manager import Lock
from kskp.store.auth import User, Role

class KSKPJSONEncoder(JSONEncoder):
    """
    ライブラリにおいて定義したクラスのJSONへのデコード処理を定義する
    """
    def default(self, obj):
        # if isinstance(obj, Store):
        #     return obj.to_json()
        # elif isinstance(obj, Vis):
        #     return obj.to_html()
        # elif isinstance(obj, Lock):
        #     return obj.to_json()
        # elif isinstance(obj, Datum):
        #     return obj.to_json()
        # elif isinstance(obj, FlowData):
        #     return obj.to_json()
        # else:
        #     # 上記以外のクラスはデフォルトのデコード処理とする
        #     return JSONEncoder.default(self, obj)

        if isinstance(obj, (Store, Lock, Datum, FlowData, User, Role)):
            return obj.to_json()
        elif isinstance(obj, Vis):
            return obj.to_html()
        else:
            # 上記以外のクラスはデフォルトのデコード処理とする
            return JSONEncoder.default(self, obj)
