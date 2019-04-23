from flask import Flask, jsonify
from flask.json import JSONEncoder
from .library import Store
from .library import Folder
from .library import Frame

class LibraryJSONEncoder(JSONEncoder):
    """
    ライブラリにおいて定義したクラスのJSONへのデコード処理を定義する
    """
    def default(self, obj):
        if isinstance(obj, Store):
            return obj.to_json()
        elif isinstance(obj, Folder):
            return obj.to_json()
        elif isinstance(obj, Frame):
            return obj.to_json()
        else:
            # 上記以外のクラスはデフォルトのデコード処理とする
            return JSONEncoder.default(self, obj)
