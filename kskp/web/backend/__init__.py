import os
from flask import Flask
from kskp.store import STORE_DIR

app = Flask('kskp.web.backend')
# コマンド一覧で表示させるコマンドのリスト
app.config['VISIBLE_COMMANDS_JSON'] = ['mcmd', 'kcmd', 'pcmd']
# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config['JSON_SORT_KEYS'] = False

# DB設定（現在はSQlite）
os.environ['SQLITE_PATH'] = (STORE_DIR / 'kskp.db').as_posix()
os.environ['DATABASE_URI'] = 'sqlite:///' + os.environ['SQLITE_PATH']

# 文字コード設定（とりあえず標準はutf-8で）
os.environ['FRAME_CHARACTER_CODE'] = 'utf-8'

# flaskのjsonifyによるJSONへのデコード処理を、独自に定義したデコード処理に置き換える
from .api.utils.kskp_json_encoder import KSKPJSONEncoder
app.json_encoder = KSKPJSONEncoder
#
# from .util_endpoints import endpoints
# app.register_blueprint(endpoints, url_prefix='/')


# render_template
# 将来的にvisualizeどうなるかわからないので、とりあえず別に隔離しておく
from .views import visualize
from .views import basic
app.register_blueprint(visualize.mod)
app.register_blueprint(basic.mod)
# api
from .api import auth
app.register_blueprint(auth.mod, url_prefix='/signup')

PREFIX = '/api/v0'
from .api import basic
from .api import frames
from .api import lib
app.register_blueprint(basic.mod, url_prefix=PREFIX)
app.register_blueprint(frames.mod, url_prefix=PREFIX)
app.register_blueprint(lib.mod, url_prefix=PREFIX)

def main():
    app.run()

# if __name__ == '__main__':
#     main()
