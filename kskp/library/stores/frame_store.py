
from .document_store import DocumentStore
from .abc_store import AbcStore
from .folder_store import FolderStore
from . import db
from sqlalchemy.orm import aliased
import json
import uuid
import os
import pathlib
import random
import datetime
import pprint

class FrameStore(DocumentStore):

    def __init__(self, parent_uuid, label, stream, creator=None, modifier=None):
        super().__init__(parent_uuid, label, stream, creator, modifier)

    @staticmethod
    def find_by_uuid(uuid):
        # 指定されたuuidを持つDocumentStoreを取得する
        return db.session.query(DocumentStore).filter(DocumentStore.uuid==uuid).one_or_none()

    @staticmethod
    def find_by_parent_uuid(parent_uuid):
        # 指定されたuuidの親をもつdocumentsレコードを全て取得する
        F2 = aliased(FolderStore)
        sub_query = db.session.query(F2)
        documents = db.session.query(DocumentStore) \
                              .filter(sub_query.filter(F2.id==DocumentStore.parent_id)
                                               .filter(F2.uuid==parent_uuid).exists()).all()
        return documents

    @staticmethod
    def find_root():
        # 親を持たないfolderレコードを全て取得する
        roots = db.session.query(DocumentStore).filter(DocumentStore.parent_id == None).all()

        if len(roots) == 0 :
            # ルートフォルダがない場合はNoneを返す
            return None
        elif len(roots) > 1:
            raise Exception('More than 2 roots exist!!')

        return roots[0]

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'frame'
               ,'label'     : json.loads(self.data)['label']
               ,'creator'   : AbcStore.get_username_by_id(self.creator)
               ,'createdAt' : self.created_at}