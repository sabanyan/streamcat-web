from flask import Flask, jsonify
from flask.json import JSONEncoder
from kskp.store import StoreModel as Store
from kskp.store import Preview
from kskp.core import Datum as Datum

class KSKPJSONEncoder(JSONEncoder):
    """
    ライブラリにおいて定義したクラスのJSONへのデコード処理を定義する
    """
    def default(self, obj):
        if isinstance(obj, Store):
            return obj.to_json()
        elif isinstance(obj, Preview):
            return obj.to_html()
        elif isinstance(obj, Datum):
            return obj.to_json()
        else:
            # 上記以外のクラスはデフォルトのデコード処理とする
            return JSONEncoder.default(self, obj)
