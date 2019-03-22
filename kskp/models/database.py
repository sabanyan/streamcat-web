import json
from .library import Library

class Database():
    def __init__(self, uuid, parent_uuid, label, dbms, connection_string, creator=None, modifier=None, created_at=None):
        self.uuid = uuid
        self.parent_uuid = parent_uuid
        self.label = label
        self.dbms = dbms
        self.connection_string = connection_string
        self.creator = creator
        self.modifier = modifier
        self.created_at = created_at

    def get_children(self):
        return []

    @classmethod
    def create_by_library(cls, library):
        label = json.loads(library.data)['label']
        dbms = json.loads(library.data)['dbms']
        connection_string = json.loads(library.data)['connectionString']
        return Database(library.uuid, library.get_parent_uuid(), label, dbms, connection_string, library.creator, library.modifier, library.created_at)

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'database'
               ,'label'     : self.label
               ,'dmbs'      : self.dbms
               ,'connectionString' : self.connection_string
               ,'creator'   : self.creator
               ,'createdAt' : self.created_at }
