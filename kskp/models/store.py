# from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB, ENUM
import json
from . import db, create_schema_if_first_use

class Store(db.Model):
    """
    Storeモデル
    """

    # テーブル名
    __tablename__ = 'stores'
    
    # カラム
    # id          = db.Column(ENUM('Directory', 'PostgreSQL', 'MySql', 'ORACLE', name='server_type') ,primary_key=True)
    # data        = db.Column(JSONB)
    # create_at   = db.Column(TIMESTAMP, default=db.text('CURRENT_TIMESTAMP'))
    # modified_at = db.Column(TIMESTAMP, default=db.text('CURRENT_TIMESTAMP'))
    id          = db.Column(db.String, primary_key=True)
    data        = db.Column(db.String)
    create_at   = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    modified_at = db.Column(db.String, default=db.text('CURRENT_TIMESTAMP'))
    creator     = db.Column(db.Integer)
    modifier    = db.Column(db.Integer)

    def __init__(self, id, version, label, description, url, params, creator):
        self.id = id
        # self.data = {'version'    : version,
        #              'label'      : label,
        #              'description': description,
        #              'url'        : url,
        #              'params'     : params
        #             }
        self.data = json.dumps({'version'    : version,
                                'label'      : label,
                                'description': description,
                                'url'        : url,
                                'params'     : params
                              })

        self.creator = creator
        self.modifier = creator

    @classmethod
    def find_all(cls):
        create_schema_if_first_use()

        stores= db.session.query(Store.id,
                                 Store.data,
                                 Store.create_at,
                                 Store.modified_at,
                                 Store.creator,
                                 Store.modifier).all()
        ret = []
        for store in stores:
            # ret.append({'id'          : server.id,
            #             'version'     : server.data['version'],
            #             'label'       : server.data['label'],
            #             'description' : server.data['description'],
            #             'url'         : server.data['url'],
            #             'params'      : server.data['params']
            #            })
            ret.append({'id'          : store.id,
                        'version'     : json.loads(store.data)['version'],
                        'label'       : json.loads(store.data)['label'],
                        'description' : json.loads(store.data)['description'],
                        'url'         : json.loads(store.data)['url'],
                        'params'      : json.loads(store.data)['params']
                        })
        return ret

    def __str__(self):
        return self.id