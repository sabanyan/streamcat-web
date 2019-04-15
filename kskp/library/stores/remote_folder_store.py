from .abc_store import AbcStore
from . import db

class RemoteFolderStore(AbcStore):

    @property
    def type(self):
        pass

    @staticmethod
    def find_by_uuid(uuid):
        pass

    @staticmethod
    def find_by_parent_uuid(parent_uuid):
        pass

    @staticmethod
    def find_root():
        pass

    def save(self):
        pass

    def update_data(self):
        pass

    def delete(self):
        pass