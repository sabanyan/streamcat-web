# from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, ENUM
import json
from . import db, create_schema_if_first_use

class Library(db.Model):
    """
    Libraryモデル
    """

    # テーブル名
    __tablename__ = 'library'
    
    id          = db.Column(db.Integer, primary_key=True)
    parent_id   = db.Column(db.Integer, unique=True)
    type        = db.Column(db.String)
    data        = db.Column(db.String)
    create_at   = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    modified_at = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    creator     = db.Column(db.Integer)
    modifier    = db.Column(db.Integer)

    def __init__(self, id=None, parent_id=None, type=None, data=None, creator=None):
        self.id = id
        self.parent_id = parent_id
        self.type = type
        self.data = data
        self.creator = creator
        self.modifier = creator

    @classmethod
    def create_folder(cls, id, parent_id=None, uuid=None, label=None, creator=None):
        data = json.dumps({'uuid'  : uuid,
                           'label' : label})
        return Library(id, parent_id, 'folder', data, creator)

    @classmethod
    def create_remote_folder(cls
                           , id
                           , parent_id=None
                           , uuid=None
                           , label=None
                           , user=None
                           , password=None
                           , server=None
                           , port=None
                           , domain=None
                           , directory=None
                           , creator=None):
        data = json.dumps({'uuid'  : uuid
                         , 'label' : label
                         , 'user'  : user
                         , 'password' : password
                         , 'server'   : server
                         , 'port'     : property
                         , 'domain'   : domain
                         , 'directory': directory})
        return Library(id, parent_id, 'remote-folder', data, creator)

    @classmethod
    def create_database(cls
                      , id
                      , parent_id=None
                      , uuid=None
                      , label=None
                      , dbms=None
                      , connection_string=None
                      , creator=None):
        data = json.dumps({'uuid'  : uuid
                         , 'label' : label
                         , 'dbms'  : dbms
                         , 'connectionString' : connection_string})
        return Library(id, parent_id, 'database', data, creator)

    @classmethod
    def find_by_uuid(cls, uuid):
        pass

    @classmethod
    def find_by_parent_uuid(cls, parent_uuid):
        pass

    def save(self):
        pass

    def delete(self):
        pass

    def to_json(self):
        return {'id'          : self.id,
                'parent'      : self.parent_id,
                'version'     : json.loads(self.data)['version'],
                'label'       : json.loads(self.data)['label'],
                'description' : json.loads(self.data)['description'],
                'url'         : json.loads(self.data)['url'],
                'params'      : json.loads(self.data)['params']
                }