from .abc_store import AbcStore
from . import db
from sqlalchemy.orm import aliased
import json
import uuid
import os
import pathlib
import random
import datetime
import pprint

class FolderStore(db.Model, AbcStore):
    
    # テーブル名の定義
    __tablename__ = 'folders'
    
    # 列名と列のデータ型等の定義
    id          = db.Column(db.String, primary_key=True)
    parent_id   = db.Column(db.String)
    uuid        = db.Column(db.String, nullable=False, unique=True)
    path        = db.Column(db.String, nullable=False)
    type        = db.Column(db.String, nullable=False)
    data        = db.Column(db.String, nullable=False)
    creator     = db.Column(db.Integer)
    modifier    = db.Column(db.Integer)
    created_at  = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    modified_at = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))

    def __init__(self, parent_uuid, label, creator=None, modifier=None):
        # SQLiteではidは乱数で採番する
        self.id = random.randint(0,99999)
        
        # parent_uuidからparent_idを取得する
        parent = db.session.query(FolderStore.id, FolderStore.path)\
                           .filter(FolderStore.uuid==parent_uuid).one_or_none()
        if parent is None:
            self.parent_id = None
        else:
            self.parent_id = parent.id

        # UUIDを採番する
        self.uuid = str(uuid.uuid4())

        # pathは親フォルダのpathを引き継ぐ
        if parent is None:
            # 親フォルダがない場合はデフォルトパスとする
            self.path = 'kskp/data/library'
        else:
            self.path = os.path.join(parent.path, label)

        # type
        self.type = 'folder'

        # dataを作成する
        self.data = json.dumps({'label' : label})

        # creator, modifier
        self.creator = creator
        self.modifier = modifier

    @staticmethod
    def find_by_uuid(uuid):
        # 指定されたuuidを持つFolderStoreを取得する
        return db.session.query(FolderStore).filter(FolderStore.uuid==uuid).one_or_none()
    
    @staticmethod
    def find_by_parent_uuid(parent_uuid):
        # 指定されたuuidの親をもつfoldersレコードを全て取得する
        F2 = aliased(FolderStore)
        sub_query = db.session.query(F2)
        folders = db.session.query(FolderStore) \
                            .filter(sub_query.filter(FolderStore.type=='folder')
                                             .filter(F2.id==FolderStore.parent_id)
                                             .filter(F2.uuid==parent_uuid).exists()).all()
        return folders

        # # 指定されたuuidの親を持つremote-folderレコードを全て取得する
        # pass

        # # 指定されたuuidの親をもつdocumentsレコードを全て取得する
        # D2 = aliased(DocumentRecord)
        # sub_query = db.session.query(D2)
        # documents = db.session.query(DocumentRecord) \
        #                       .filter(sub_query.filter(D2.id==DocumentRecord.parent_id)
        #                                        .filter(D2.uuid==parent_uuid).exists()).all()

        # # 指定されたuuidの親を持つframeレコードを全て取得する
        # pass

        # # 指定されたuuidの親をもつdatabasesレコードを全て取得する
        # DB2 = aliased(DatabaseRecord)
        # sub_query = db.session.query(DB2)
        # databases = db.session.query(DatabaseRecord) \
        #                       .filter(sub_query.filter(DB2.id==DatabaseRecord.parent_id)
        #                                        .filter(DB2.uuid==parent_uuid).exists()).all()

        # rets = []
        # rets = rets.append(folders).append(documents).append(databases)
        # return rets

    @staticmethod
    def find_root():
        # 親を持たないfolderレコードを全て取得する
        roots = db.session.query(FolderStore).filter(FolderStore.parent_id == None).all()

        if len(roots) == 0 :
            # ルートフォルダがない場合はNoneを返す
            return None
        elif len(roots) > 1:
            raise Exception('More than 2 roots exist!')

        return roots[0]

    def save(self):
        db.session.add(self)
        db.session.commit()

    def update_data(self):
        # 更新時刻を設定する
        self.modified_at = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        # レコードを更新する
        db.session.commit()

    def delete(self):
        # 削除対象のフォルダの下にフォルダまたはファイルが存在する場合は例外を送出する
        if len(FolderStore.find_by_parent_uuid(self.uuid)) > 0:
            raise Exception('Can not delete folder that has child file or folder.')
        db.session.query(FolderStore).filter(FolderStore.id==self.id).delete()
        db.session.commit()

    def get_folder_path(self):
        # 指定されたUUIDのfolerレコードを取得する
        result = db.session.query(FolderStore.uuid, FolderStore.parent_id, FolderStore.data).filter(FolderStore.uuid==self.uuid).one_or_none()
        parent_id = result.parent_id
        path_to_root = [{'uuid':result.uuid, 'label':json.loads(result.data)['label'] }]
        # 取得したレコードから外部キー’parent_id’をたどり、途中のfolderレコードをリストに順に保存する
        while parent_id != None:
            result = db.session.query(FolderStore.uuid, FolderStore.parent_id, FolderStore.data).filter(FolderStore.id==parent_id).one_or_none()
            path_to_root.append({'uuid':result.uuid, 'label':json.loads(result.data)['label'] })
            parent_id = result.parent_id
        # 保存したリストの並びを逆にする
        path_to_root.reverse()
        return path_to_root

    def make_dir(self):
        try:
            if os.path.exists(self.path) and not os.path.isdir(self.path):
                raise Exception('Can not make directory, because same name file(%s) exists.' % self.path)
            elif not os.path.isdir(self.path):
                # フォルダに紐付くディレクトリ(path列で指定されるディレクトリ)がなければ作成する
                os.makedirs(self.path, exist_ok=True)
        except PermissionError as e:
            # ファイルに対する権限がない場合
            raise e

    def remove_dir(self):
        try:
            # 全てのフォルダから紐づかないディレクトリは物理削除する
            dir_path = self.path.rstrip(os.pathsep)
            while dir_path != '' and dir_path != '/' and dir_path != 'kskp/data':
                if FolderStore._dir_path_exists(dir_path):
                    break
                else:
                    if os.path.isdir(dir_path):
                        os.rmdir(dir_path)
                    dir_path = os.path.dirname(dir_path)
        except PermissionError as e:
            # ファイルに対する権限がない場合
            raise e
    
    @staticmethod
    def _dir_path_exists(dir_path):
        results_count = db.session.query(FolderStore).filter(FolderStore.path.like(dir_path + '%')).count()
        return results_count > 0

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'folder'
               ,'label'     : json.loads(self.data)['label']
               ,'creator'   : AbcStore.get_username_by_id(self.creator)
               ,'createdAt' : self.created_at}
