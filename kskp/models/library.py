# from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, ENUM
import os
import json
from . import db, create_schema_if_first_use
from sqlalchemy.orm import aliased
from sqlalchemy import literal, text
from sqlalchemy.sql.expression import label, literal_column
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
    def create_remote_folder_type(cls
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
                                , modifier=None):
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
            # 共有するリモートディレクトリ名をローカルのマウントディレクトリ名にする
            dir_path = os.path.join(library.dir_path, directory)
        
        # dataを作成する
        data = json.dumps({'label'    : label
                         , 'user'     : user
                         , 'password' : password
                         , 'server'   : server
                         , 'port'     : port
                         , 'domain'   : domain
                         , 'directory': directory})

        # Libraryオブジェクトを返す
        ret = Library(id, parent_id, uuid, dir_path, 'remote-folder', data, creator, modifier)
        ret.parent_uuid = parent_uuid
        return ret

    @classmethod
    def create_database_type(cls):
        pass

    @classmethod
    def create_frame_type(cls, uuid, parent_uuid, label, creator=None, modifier=None):
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
            dir_path = os.path.join('kskp/data/library', Library.__secure_filename(label))
        else:
            # 共有するリモートディレクトリ名をローカルのマウントディレクトリ名にする
            dir_path = os.path.join(library.dir_path, Library.__secure_filename(label))

        # dataを作成する
        data = json.dumps({'label' : label})

        # Libraryオブジェクトを返す
        ret = Library(id, parent_id, uuid, dir_path, 'frame', data, creator, modifier)
        ret.parent_uuid = parent_uuid
        return ret
            
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
                            .filter(sub_query.filter(Library2.id==Library.parent_id)
                                             .filter(Library2.uuid==parent_uuid).exists()).all()
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

    @classmethod
    def get_folder_path(cls, uuid1):
        # 
        #  folderPathの値を作成するため、再帰クエリを投げようとしたが、ORMによる方法も直接SQLを発行する方法のどちらもエラーになった
        # 

        import pprint
        # sql = " ;WITH RECURSIVE R AS (SELECT id, uuid, data FROM library WHERE parent_id IS NULL" \
        #       "                      UNION ALL" \
        #       "                      SELECT L.id, L.uuid, L.data FROM library L JOIN R ON L.parent_id = R.id" \
        #       "                      WHERE L.uuid = '%s')" \
        #       " SELECT * FROM R;" % uuid

        # sql = "with TT(id) AS (SELECT 1 as id) SELECT 2"
        # results = db.session.execute()

        r1 = db.session.query(Library.id, Library.uuid, Library.data, literal_column("0").label('level')) \
                       .filter(Library.parent_id==None)
        r1 = r1.cte('RR', recursive=True)  
        r1 = r1.union_all(db.session.query(Library.id, Library.uuid, Library.data, r1.c.level+literal_column("1"))
               .join(r1, r1.c.id==Library.id)
               .filter(text("Library.uuid=='%s'" % uuid1)))

        pprint.pprint(str(db.session.query(r1)))             

        results = db.session.query(r1).all()

        ret = []
        # for result in results:
        #     print(result.uuid)
        #     print(json.loads(result.data)['label'])
        #     ret.append((result.uuid, json.loads(result.data)['label']))
        return ret

    @classmethod
    def get_folder_path2(cls, uuid):
        # 指定されたUUIDのLibraryレコードを取得する
        result = db.session.query(Library.uuid, Library.parent_id, Library.data).filter(Library.uuid==uuid).one_or_none()
        parent_id = result.parent_id
        path_to_root = [{'uuid':result.uuid, 'label':json.loads(result.data)['label'] }]
        # 取得したレコードから外部キー’parent_id’をたどり、途中のLibraryレコードをリストに順に保存する
        while parent_id != None:
            result = db.session.query(Library.uuid, Library.parent_id, Library.data).filter(Library.id==parent_id).one_or_none()
            path_to_root.append({'uuid':result.uuid, 'label':json.loads(result.data)['label'] })
            parent_id = result.parent_id
        # 保存したリストの並びを逆にする
        path_to_root.reverse()
        return path_to_root

    @classmethod
    def dir_path_exists(cls, dir_path):
        results_count = db.session.query(Library).filter(Library.dir_path.like(dir_path + '%')).count()
        return results_count > 0

    @classmethod
    def __secure_filename(cls, filename):
        # '/'と'\0'はunixとmacOSではファイル名に使用できない
        trans_table = str.maketrans({'/' : '／', '\0' : ''})
        return filename.translate(trans_table)

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

