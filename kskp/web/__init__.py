from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask('kskp.web')

# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config["JSON_SORT_KEYS"] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

from kskp.web.views import visualize
app.register_blueprint(visualize.mod)

from .api import api
from .frames import frame_api

PREFIX = '/api/v0'

app.register_blueprint(api, url_prefix=PREFIX)
app.register_blueprint(frame_api, url_prefix=PREFIX)

if __name__ == '__main__':
    app.run()
