import json
import shlex
import subprocess
import platform
from time import sleep
from pathlib import Path
from .library import Library
from .folder import Folder
from .database import Database
from .frame import Frame
from .document import Document

class RemoteFolder(Folder):
    """
    Remote-Folderモデル
    引数portとdomainは現在は用いていない(将来pysmbなどを利用するときのために残しています)
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
        super().__init__(uuid, parent_uuid, label, creator, modifier, created_at)
        self.user = user
        self.password = password
        self.server = server
        self.port = port
        self.domain = domain
        self.directory = directory                

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
                          .format(self.user, self.password, remote_dir, mount_dir)
            else:
                raise Exception('This os(%s) may has no mount command.' % platform_system)
            # マウントを実行する
            sub = subprocess.run(shlex.split(comline), stderr=subprocess.PIPE)
            # サブプロセスのリターンコードがNGの場合は例外を送出する
            sub.check_returncode()
            # すぐ操作するとビジーになっていることがあるため、マウント・アンマウントの前後でスリープtime.sleep()を入れています
            sleep(2)      
        except subprocess.CalledProcessError as e:
            path = Path(mount_dir)
            if not path.exists():
                error_message = 'mount point(%s) does not exist' % mount_dir
            elif not path.is_dir():
                error_message = 'mount point(%s) is not directory' % mount_dir
            # python3.7でis_mount()は追加される
            # elif path.is_mount():
            #     error_message = 'mount point(%s) already mounted on' % mount_dir
            else:
                error_message = sub.stderr.decode('utf-8')
            raise Exception('"mount" command returned error --> ' + error_message)
 
    def unmount(self, mount_dir):
        try:
            sleep(2)
            comline = "sudo umount {}".format(mount_dir)
            # マウント解除を実行する
            sub = subprocess.run(shlex.split(comline), stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            path = Path(mount_dir)
            if not path.exists():
                error_message = 'mount point(%s) does not exist' % mount_dir
            else:
                error_message = sub.stderr.decode('utf-8')
            raise Exception('"umount" command returned error --> ' + error_message)