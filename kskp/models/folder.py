import json
from .library import Library

class Folder():
    def __init__(self, uuid, parent_uuid, label, creator=None, modifier=None, created_at=None):
        self.uuid = uuid
        self.parent_uuid = parent_uuid
        self.label = label
        self.creator = creator
        self.modifier = modifier
        self.created_at = created_at

    def get_children(self):
        from .remote_folder import RemoteFolder
        from .database import Database
        from .frame import Frame
        from .document import Document
        #  DB検索
        children = Library.find_by_parent_uuid(self.uuid)
        ret = []
        for child in children:
            if child.type == 'folder':
                ret.append(Folder.create_by_library(child))
            elif child.type == 'remote-folder':
                ret.append(RemoteFolder.create_by_library(child))
            elif child.type == 'database':
                ret.append(Database.create_by_library(child))
            elif child.type == 'frame':
                ret.append(Frame.create_by_library(child))
            elif child.type == 'document':
                ret.append(Document.create_by_library(child))
        return ret

    def get_folder_path(self):
        return Library.get_folder_path2(self.uuid)

    @classmethod
    def create_by_library(cls, library):
        label = json.loads(library.data)['label']
        return Folder(library.uuid, library.get_parent_uuid(), label, library.creator, library.modifier, library.created_at)

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'folder'
               ,'label'     : self.label
               ,'creator'   : self.creator
               ,'createdAt' : self.created_at }


