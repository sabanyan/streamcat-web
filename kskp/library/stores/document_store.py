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

class DocumentStore(db.Model, AbcStore):
    
    # テーブル名の定義
    __tablename__ = 'documents'

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

    def __init__(self, parent_uuid, label, stream, creator=None, modifier=None):
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
            file_name = AbcStore.escape_filename(label)
            self.path = os.path.join(parent.path, file_name)

        # type
        self.type = 'document'

        # dataを作成する
        self.data = json.dumps({'label' : label})

        # ファイルストリームを保持する
        self.stream = stream

        # creator, modifier
        self.creator = creator
        self.modifier = modifier

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
        db.session.query(DocumentStore).filter(DocumentStore.id==self.id).delete()
        db.session.commit()

    def get_file(self):
        try:
            if not os.path.exists(self.path):
                raise Exception('Can not get file, because no file(%s) exists.' % self.path)
            # ファイルの内容を取得する
            return self._load_file(self.path)
        except PermissionError as e:
            # ファイルに対する権限がない場合
            raise e

    def make_file(self):
        try:
            # 同じ名称のファイルが既に存在する場合、末尾に数字を付加したファイル名で作成する
            path = DocumentStore._get_another_path(self.path)
            # ドキュメントに紐付くファイル(path列で指定されるファイル)がなければ作成する
            dir_name = os.path.dirname(path)
            os.makedirs(dir_name, exist_ok=True)
            # ファイルを作成する
            self._save_file(path)
        except PermissionError as e:
            # ファイルに対する権限がない場合
            raise e

    def remove_file(self):
        try:
            if not os.path.isfile(self.path):
                raise Exception('Can not delete %s, because it is not reguler file.' % self.path)
            # ファイルを物理削除する
            os.remove(self.path)
        except PermissionError as e:
            # ファイルに対する権限がない場合
            raise e    

    def get_file_size(self):
        if not os.path.exists(self.path):
            raise Exception('Can not get file, because no file(%s) exists' % self.path)
        return os.path.getsize(self.path)

    def _load_file(self, path):
        file_size = self.get_file_size()
        with open(path, mode='rb') as f:
            return f.read(file_size)

    def _save_file(self, path):
        with open(path, mode='wb') as f:
            while True:
                buff = self.stream.read(4096)
                f.write(buff)
                if buff is None or len(buff)==0:
                    break

    @staticmethod
    def _get_another_path(path):
        # 同じ名称のファイルが既に存在する場合、末尾に数字を付加したファイル名で作成する
        while os.path.exists(path):
            filename = os.path.basename(path)
            dirname = os.path.dirname(path)
            new_filename = AbcStore.get_another_name(filename)
            path = os.path.join(dirname, new_filename)
        return path

    def to_json(self):
        return {'uuid'      : self.uuid
               ,'type'      : 'document'
               ,'label'     : json.loads(self.data)['label']
               ,'creator'   : AbcStore.get_username_by_id(self.creator)
               ,'createdAt' : self.created_at}
