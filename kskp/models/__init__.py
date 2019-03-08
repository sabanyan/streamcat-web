from flask import Flask, session, jsonify
import sqlalchemy
from flask_sqlalchemy import SQLAlchemy
# from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID, JSONB, ENUM

from .. import app

# app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:@db/kskp"
# app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://tanakahiroshi:@localhost/kskp"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data/kskp_alchemy.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)


app.is_first_use = True

def create_schema_if_first_use():
    if app.is_first_use:
        app.is_first_use = False
        db.drop_all()
        db.create_all()