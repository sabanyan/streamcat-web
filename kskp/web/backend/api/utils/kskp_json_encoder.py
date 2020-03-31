from flask import Flask, jsonify
from flask.json import JSONEncoder
from kskp.store import StoreModel as Store
from kskp.store import Vis
from kskp.core import Datum as Datum
from kskp.store.lock_manager import Lock

class KSKPJSONEncoder(JSONEncoder):
    """
    ライブラリにおいて定義したクラスのJSONへのデコード処理を定義する
    """
    def default(self, obj):
        if isinstance(obj, Store):
            return obj.to_json()
        elif isinstance(obj, Vis):
            return obj.to_html()
        elif isinstance(obj, Lock):
            return obj.to_json()
        elif isinstance(obj, Datum):
            return obj.to_json()
        else:
            # 上記以外のクラスはデフォルトのデコード処理とする
            return JSONEncoder.default(self, obj)
