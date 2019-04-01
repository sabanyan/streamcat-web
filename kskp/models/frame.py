import json
from .document import Document
from .library import Library

class Frame(Document):
    def __init__(self, uuid, parent_uuid, label, stream, creator=None, modifier=None, created_at=None):
        super().__init__(uuid, parent_uuid, label, stream, creator, modifier, created_at)

    @classmethod
    def create_by_library(cls, library):
        label = json.loads(library.data)['label']
        stream = open(library.dir_path, mode='rb')
        return Frame(library.uuid, library.get_parent_uuid(), label, stream, library.creator, library.modifier, library.created_at)

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'frame'
               ,'label'     : self.label
               ,'creator'   : self.creator
               ,'createdAt' : self.created_at }
