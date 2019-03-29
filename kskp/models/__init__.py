from flask import Flask, session, jsonify
import sqlalchemy
from flask_sqlalchemy import SQLAlchemy
# from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID, JSONB, ENUM

from .. import app

# app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:@db/kskp"
# app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://tanakahiroshi:@localhost/kskp"
# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data/kskp_alchemy.db"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data/kskp.db"
# 起動時のWarningを抑制するため以下の設定値をTrueにする
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)


import pprint

@app.before_first_request
def session_setup():
    pprint.pprint('CREATE ALL TABLES')
    # SQLAlchemyで使用するテーブルが存在しない場合は作成する
    db.create_all()
