import json
from .library import Library

class RemoteFolder():
    """
    Remote-Folderモデル
    """

    def __init__(self
                , uuid
                , parent_uuid
                , label
                , user
                , password
                , server
                , port
                , domain
                , directory
                , creator=None
                , modifier=None
                , created_at=None):
        self.uuid = uuid
        self.parent_uuid = parent_uuid
        self.label = label
        self.user = user
        self.password = password
        self.server = server
        self.port = port
        self.domain = domain
        self.directory = directory
        self.creator = creator
        self.modifier = modifier
        self.created_at = created_at

    def get_children(self):
        from .folder import Folder
        from .database import Database
        from .frame import Frame
        from .document import Document
        #  DB検索
        child_libraries = Library.find_by_parent_uuid(self.uuid)
        ret = []
        for child_library in child_libraries:
            if child_library.type == 'folder':
                ret.append(Folder.create_by_library(child_library))
            elif child_library.type == 'remote-folder':
                ret.append(RemoteFolder.create_by_library(child_library))
            elif child_library.type == 'database':
                ret.append(Database.create_by_library(child_library))
            elif child_library.type == 'frame':
                ret.append(Frame.create_by_library(child_library))
            elif child_library.type == 'document':
                ret.append(Document.create_by_library(child_library))
        return ret

    @classmethod
    def create_by_library(cls, library):
        label    = json.loads(library.data)['label']
        user     = json.loads(library.data)['user']
        password = json.loads(library.data)['password']
        server   = json.loads(library.data)['server']
        port     = json.loads(library.data)['port']
        domain   = json.loads(library.data)['domain']
        directory= json.loads(library.data)['directory']

        return RemoteFolder(library.uuid
                            , library.get_parent_uuid()
                            , label
                            , user
                            , password
                            , server
                            , port
                            , domain
                            , directory
                            , library.creator
                            , library.modifier
                            , library.created_at)

    def to_json(self):
        return {'uuid'       : self.uuid
                ,'type'      : 'remote-folder'
                ,'label'     : self.label
                ,'user'      : self.user
                ,'password'  : self.password
                ,'server'    : self.server
                ,'port'      : self.port
                ,'domain'    : self.domain
                ,'directory' : self.directory
                ,'creator'   : self.creator
                ,'createdAt' : self.created_at }