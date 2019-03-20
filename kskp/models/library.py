# from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, ENUM
import os
import json
from . import db, create_schema_if_first_use

from sqlalchemy.orm import aliased
import random
import datetime

class Library(db.Model):
    """
    Libraryモデル
    """

    # テーブル名の定義
    __tablename__ = 'library'
    
    # 列名と列のデータ型等の定義
    id          = db.Column(db.String, primary_key=True)
    parent_id   = db.Column(db.String)
    uuid        = db.Column(db.String, unique=True)
    dir_path    = db.Column(db.String)
    type        = db.Column(db.String)
    data        = db.Column(db.String)
    creator     = db.Column(db.Integer)
    modifier    = db.Column(db.Integer)
    created_at  = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    modified_at = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))

    def __init__(self, id=None, parent_id=None, uuid=None, dir_path=None, type=None, data=None, creator=None, modifier=None, created_at=None):
        self.id = id
        self.parent_id = parent_id
        self.uuid = uuid
        self.dir_path = dir_path
        self.type = type
        self.data = data
        self.creator = creator
        self.modifier = modifier
        self.created_at = created_at

        # 
        self.parent_uuid = None

    @classmethod
    def create_folder_type(cls, uuid, parent_uuid, label, creator=None, modifier=None):
        # テーブルがない場合は作成する
        create_schema_if_first_use()
        
        # SQLiteではidは乱数で採番する
        id = random.randint(0,99999)

        # parent_uuidからparent_idを取得する
        result = db.session.query(Library.id).filter(Library.uuid == parent_uuid).one_or_none()
        if result is None:
            parent_id = None
        else:
            parent_id = result.id

        # dir_pathは親フォルダのdir_pathを引き継ぐ
        library = Library.find_by_uuid(parent_uuid)
        if library is None:
            # 親フォルダがない場合はデフォルトパスとする
            dir_path = 'kskp/data/library'
        else:
            dir_path = library.dir_path

        # dataを作成する
        data = json.dumps({'label' : label})

        # Libraryオブジェクトを返す
        ret = Library(id, parent_id, uuid, dir_path, 'folder', data, creator, modifier)
        ret.parent_uuid = parent_uuid
        return ret

    @classmethod
    def create_remote_folder_type(cls):
        pass

    @classmethod
    def create_database_type(cls):
        pass

    @classmethod
    def find_by_uuid(cls, uuid):
        # テーブルがない場合は作成する
        create_schema_if_first_use()

        # 指定されたuuidを持つLibraryレコードを取得する
        result = db.session.query(Library.id,
                                  Library.parent_id,
                                  Library.uuid,
                                  Library.dir_path,
                                  Library.type,
                                  Library.data,
                                  Library.creator,
                                  Library.modifier,
                                  Library.created_at).filter(Library.uuid==uuid).one_or_none()
        if result is None:
            return None
        else:
            return Library(result.id
                         , result.parent_id
                         , result.uuid
                         , result.dir_path
                         , result.type
                         , result.data
                         , result.creator
                         , result.modifier
                         , result.created_at)

    @classmethod
    def find_by_parent_uuid(cls, parent_uuid):
        # テーブルがない場合は作成する
        create_schema_if_first_use()

        # 指定されたuuidの親をもつLibraryレコードを全て取得する
        Library2 = aliased(Library)
        sub_query = db.session.query(Library2)
        results = db.session.query(Library.id,
                                   Library.parent_id,
                                   Library.uuid,
                                   Library.dir_path,
                                   Library.type,
                                   Library.data,
                                   Library.creator,
                                   Library.modifier,
                                   Library.created_at) \
                            .filter(sub_query.filter(Library2.id == Library.parent_id and
                                                     Library2.id == parent_uuid).exists()).all()
        rets = []
        for result in results:
            rets.append(Library(result.id
                              , result.parent_id
                              , result.uuid
                              , result.dir_path
                              , result.type
                              , result.data
                              , result.creator
                              , result.modifier
                              , result.created_at))
        return rets

    @classmethod
    def find_root(cls):
        # テーブルがない場合は作成する
        create_schema_if_first_use()

        # 親を持たないLibraryレコードを全て取得する
        results = db.session.query(Library.id,
                                   Library.parent_id,
                                   Library.uuid,
                                   Library.dir_path,
                                   Library.type,
                                   Library.data,
                                   Library.creator,
                                   Library.modifier,
                                   Library.created_at).filter(Library.parent_id == None).all()
        rets = []
        for result in results:
            rets.append(Library(result.id
                              , result.parent_id
                              , result.uuid
                              , result.dir_path
                              , result.type
                              , result.data
                              , result.creator
                              , result.modifier
                              , result.created_at))
        return rets

    def get_parent_uuid(self):
        if self.parent_uuid is None:
            return self.parent_uuid
        else:
            result = db.session.query(Library.uuid).fileter(Library.id==self.parent_id).one_or_none()

        if result is None:
            return None
        else:
            return result.uuid

    def save(self):
        # テーブルがない場合は作成する
        create_schema_if_first_use()

        # フォルダに紐付くディレクトリ(dir_path列で指定されるディレクトリ)がなければ作成する
        os.makedirs(self.dir_path, exist_ok=True)

        db.session.add(self)
        db.session.commit()

    def update_data(self):
        # テーブルがない場合は作成する
        create_schema_if_first_use()

        library = db.session.query(Library).filter(Library.uuid==self.uuid).first()
        library.data = self.data
        library.modifier = self.modifier
        library.modified_at = self.modified_at

        library.modified_at = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        db.session.commit()

    def delete(self):
        # テーブルがない場合は作成する
        create_schema_if_first_use()

        db.session.query(Library).filter(Library.id==self.id).delete()
        db.session.commit()

        # 全てのフォルダから紐づかないディレクトリは物理削除する
        dir_path = self.dir_path.rstrip(os.pathsep)
        while dir_path != '' and dir_path != '/' and dir_path != 'kskp/data':
            results_count = db.session.query(Library).filter(Library.dir_path.like(dir_path + '%')).count()
            if results_count == 0:
                if os.path.isdir(dir_path):
                    os.rmdir(dir_path)
                dir_path = os.path.dirname(dir_path)
            else:
                break
