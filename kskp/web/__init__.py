
from flask import Flask
# from flask_sqlalchemy import SQLAlchemy

app = Flask('kskp.web')

# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config["JSON_SORT_KEYS"] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

# flaskのjsonifyによるJSONへのデコード処理を、独自に定義したデコード処理に置き換える
# from .utils.kskp_json_encoder import KSKPJSONEncoder
# app.json_encoder = KSKPJSONEncoder
#
# from .util_endpoints import endpoints
# app.register_blueprint(endpoints, url_prefix='/')

# render_template
# 将来的にvisualizeどうなるかわからないので、とりあえず別に隔離しておく
from kskp.web.views import visualize
from kskp.web.views import basic
app.register_blueprint(visualize.mod)
app.register_blueprint(basic.mod)

# api
PREFIX = '/api/v0'
from kskp.web.api import basic
from kskp.web.api import auth
from kskp.web.api import frames
app.register_blueprint(auth.mod, url_prefix='/signup')
app.register_blueprint(basic.mod, url_prefix=PREFIX)
app.register_blueprint(frames.mod, url_prefix=PREFIX)


def main():
    app.run()

if __name__ == '__main__':
    main()
