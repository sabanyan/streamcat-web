from flask.json import JSONEncoder

class SCatJSONEncoder(JSONEncoder):
    """
    ライブラリにおいて定義したクラスのJSONへのデコード処理を定義する
    """
    def default(self, obj):
        from streamcat.core import Datum
        from streamcat.store import StoreModel
        from streamcat.store import FlowData
        from streamcat.store import ProjectFolder
        from streamcat.store.lock import Lock
        from streamcat.store.auth import User, Role
        from .vis_converter import VisConverter

        if isinstance(obj, VisConverter):
            return obj.to_html()
        elif isinstance(obj, (StoreModel, Lock, Datum, FlowData, User, Role, ProjectFolder.Member, Role.Member)):
            return obj.to_json()
        else:
            # 上記以外のクラスはデフォルトのデコード処理とする
            return JSONEncoder.default(self, obj)
