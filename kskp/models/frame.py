import json
import pathlib
from .library import Library

class Frame():
    def __init__(self, uuid, parent_uuid, label, stream, creator=None, modifier=None, created_at=None):
        self.uuid = uuid
        self.parent_uuid = parent_uuid
        self.label = label
        self.stream = stream
        self.creator = creator
        self.modifier = modifier
        self.created_at = created_at

    @classmethod
    def create_by_library(cls, library):
        label = json.loads(library.data)['label']
        stream = open(library.dir_path, mode='rb')
        return Frame(library.uuid, library.get_parent_uuid(), label, stream, library.creator, library.modifier, library.created_at)

    def save(self, dir_path):
        with open(dir_path, mode='wb') as f:
            while True:
                buff = self.stream.read(4096)
                f.write(buff)
                if buff is None or len(buff)==0:
                    break

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'frame'
               ,'label'     : self.label
               ,'creator'   : self.creator
               ,'createdAt' : self.created_at }

    def close(self):
        if self.stream is not None and not self.stream.closed:
            self.stream.close()

    def __del__(self):
        self.close()