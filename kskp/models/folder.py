# from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, ENUM
import json
from . import db, create_schema_if_first_use

class Folder(db.Model):
    """
    Folderモデル
    """

    # テーブル名
    __tablename__ = 'library'
    
    id          = db.Column(db.String, primary_key=True)
    parent_id   = db.Column(db.String, unique=True)
    type        = db.Column(db.String)
    data        = db.Column(db.String)
    create_at   = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    modified_at = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    creator     = db.Column(db.Integer)
    modifier    = db.Column(db.Integer)

    def __init__(self, id=None, parent_id=None, data=None, creator=None):
        self.id = id
        self.parent_id = parent_id
        self.type = 'folder'
        self.data = data
        self.creator = creator
        self.modifier = creator

    @classmethod
    def create(cls, id=None, parent_id=None, label=None, creator=None):
        data = json.dumps({'label' : label})
        return Folder(id, parent_id, data, creator)

    @classmethod
    def find_by_uuid(cls, uuid):
        create_schema_if_first_use()
        result = db.session.query(Folder.id,
                                  Folder.parent_id,
                                  Folder.type,
                                  Folder.data,
                                  Folder.create_at,
                                  Folder.modified_at,
                                  Folder.creator,
                                  Folder.modifier).filter(Folder.id==uuid).one_or_none()
        if result is None:
            return None
        else:
            return Folder(result.id, result.parent_id, result.data, result.creator)

    @classmethod
    def find_by_parent_uuid(cls, parent_uuid):
        pass

    def save(self):
        create_schema_if_first_use()
        db.session.add(self)
        db.session.commit()

    def delete(self):
        create_schema_if_first_use()
        db.session.query(Folder).filter(Folder.id==self.id).delete()
        db.session.commit()

    def to_json(self):
        return {'id'          : self.id,
                'parent'      : self.parent_id,
                'type'        : self.type,
                'label'       : json.loads(self.data)['label']}