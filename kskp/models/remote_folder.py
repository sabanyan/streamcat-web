# from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, ENUM
import json
from . import db, create_schema_if_first_use

class RemoteFolder():
    """
    Remote-Folderモデル
    """

    def __init__(self, id=None, parent_id=None, data=None, creator=None):
        self.id = id
        self.parent_id = parent_id
        self.type = 'remote-folder'
        self.data = data
        self.creator = creator
        self.modifier = creator

    @classmethod
    def create(cls
             , id=None
             , parent_id=None
             , label=None
             , user=None
             , password=None
             , server=None
             , port=None
             , domain=None
             , directory=None
             , creator=None):
        data = json.dumps({"label" : label,
                           "user"  : user,
                           "password" : password,
                           "server"   : server,
                           "port"     : port,
                           "domain"   : domain,
                           "directory": directory})
        return RemoteFolder(id, parent_id, data, creator)

    def to_json(self):
        pass