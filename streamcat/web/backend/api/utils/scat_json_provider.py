from flask.json.provider import DefaultJSONProvider

class SCatJSONProvider(DefaultJSONProvider):
    """
    ライブラリにおいて定義したクラスのJSONへのエンコード処理を定義する
    """
    @staticmethod
    def default(obj):
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
            raise TypeError(f'{type(obj).__name__} is not JSON serializable')
