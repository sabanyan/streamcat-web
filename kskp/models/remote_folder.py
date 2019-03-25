import json
import shlex
import subprocess
import platform
from time import sleep
from pathlib import Path
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

    def __set_children(self):
        # ここで登録するファイルのTypeはどうやって決めるのだろう？？
        library = Library.find_by_uuid(self.uuid)        
        for path in Path(library.dir_path).iterdir():
            label = path.stem

    def get_folder_path(self):
        return Library.get_folder_path2(self.uuid)

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

    def mount(self, mount_dir):
        try:
            remote_dir = '{}/{}'.format(self.server, self.directory)
            platform_system = platform.system()
            if platform_system == 'Linux':
                comline = 'sudo mount -t cifs -o username={},password={},vers=2.1,iocharset=utf8 //{} {}' \
                          .format(self.user, self.password, remote_dir, mount_dir)
            elif platform_system == 'Darwin':
                # macOSの場合(unittestはmacOSで実行しているため)
                comline = 'sudo mount -t smbfs //{}:{}@{} {}' \
                          .format(self.user, self.password, remote_dir, mount_dir )
            else:
                raise Exception('This os(%s) may has no mount command.' % platform_system)

            res = subprocess.check_output(shlex.split(comline))
            # すぐ操作するとビジーになっていることがあるため、マウント・アンマウントの前後でスリープtime.sleep()を入れています
            sleep(2)
        except Exception as e:
            import pprint
            pprint.pprint(comline)
            pprint.pprint(str(e))    
            raise e
 
    def unmount(self, mount_dir):
        try:
            import pprint
            sleep(2)
            comline = "sudo umount {}".format(mount_dir)
            res = subprocess.check_output(shlex.split(comline))
        except Exception as e:
            import pprint
            pprint.pprint(comline)
            pprint.pprint(str(e))    
            raise e