from flask import Flask, jsonify
from flask.json import JSONEncoder
from ..library import Store
from ..library import Datum

class KSKPJSONEncoder(JSONEncoder):
    """
    ライブラリにおいて定義したクラスのJSONへのデコード処理を定義する
    """
    def default(self, obj):
        ## types = [Store, Folder, Frame]
        ## if any(isinstance(obj, tp) for tp in types):
        ## とかの方がいいのでは？
        if isinstance(obj, Store):
            return obj.to_json()
        elif isinstance(obj, Datum):
            return obj.to_json()
        else:
            # 上記以外のクラスはデフォルトのデコード処理とする
            return JSONEncoder.default(self, obj)
