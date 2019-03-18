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
        #  DB検索
        child_libraries = Library.find_by_parent_uuid(self.uuid)
        ret = []
        for child_library in child_libraries:
            ret.append(Folder.create_by_library(child_library))
        return ret

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


# ローダ、セーバがFolderストアからアクセスする方法
# Loader.load(folder)
# Saver.save(folder)
#
# Loader.load(database)
# Saver.save(database)
#


