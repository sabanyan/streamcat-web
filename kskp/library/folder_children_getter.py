from .abc_command import AbcCommand
from .stores.folder_store import FolderStore
from .stores.remote_folder_store import RemoteFolderStore
from .stores.database_store import DatabaseStore
from .stores.document_store import DocumentStore



class FolderChildrenGetter(AbcCommand):

    def execute(self, args, inputs):
        folder = inputs
        ret = []
        
        folders = FolderStore.find_by_parent_uuid(folder.uuid)
        # remote_folders = RemoteFolderStore.find_by_parent_uuid(folder.uuid)
        # databases = DatabaseStore.find_by_parent_uuid(folder.uuid)
        documents = DocumentStore.find_by_parent_uuid(folder.uuid)
        # frames = FrameStore.find_by_parent_uuid(folder.uuid)
        
        ret.extend(folders)
        # ret.extend(remote_folders)
        # ret.extend(databases)
        ret.extend(documents)
        # ret.extend(frames)
        return ret
        