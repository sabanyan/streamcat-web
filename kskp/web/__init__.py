from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# import kskp.store

from .api import api

app = Flask('kskp.web')

app.register_blueprint(api, url_prefix='/api/v0')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db = SQLAlchemy(app)

if __name__ == '__main__':
    app.run()
