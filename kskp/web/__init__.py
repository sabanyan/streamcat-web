from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from .frames.api import frame_api
from .api import api

PREFIX = '/api/v0'

app = Flask('kskp.web')

app.register_blueprint(api, url_prefix=PREFIX)
app.register_blueprint(frame_api, url_prefix=PREFIX)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db = SQLAlchemy(app)

if __name__ == '__main__':
    app.run()
