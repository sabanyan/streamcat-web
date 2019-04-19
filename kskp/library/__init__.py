import sqlalchemy
from flask import Flask, session, jsonify
from flask_sqlalchemy import SQLAlchemy


from .. import app

# app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:@db/kskp"
# app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://tanakahiroshi:@localhost/kskp"
# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data/kskp_alchemy.db"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data/kskp.db"
# 起動時のWarningを抑制するため以下の設定値をTrueにする
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)

from .store import Store
from .datum import Datum
from .folder import Folder
from .frame import Frame

# from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID, JSONB, ENUM

# 最初にアクセスが発生した時にのみ実行される
@app.before_first_request
def session_setup():
    # SQLAlchemyで使用するテーブルが存在しない場合は作成する
    db.create_all()
