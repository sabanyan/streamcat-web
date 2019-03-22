import json
from .library import Library

class Document():
    def __init__(self, uuid, parent_uuid, label, creator=None, modifier=None, created_at=None):
        self.uuid = uuid
        self.parent_uuid = parent_uuid
        self.label = label
        self.creator = creator
        self.modifier = modifier
        self.created_at = created_at

    @classmethod
    def create_by_library(cls, library):
        label = json.loads(library.data)['label']
        return Document(library.uuid, library.get_parent_uuid(), label, library.creator, library.modifier, library.created_at)

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'document'
               ,'label'     : self.label
               ,'creator'   : self.creator
               ,'createdAt' : self.created_at }




