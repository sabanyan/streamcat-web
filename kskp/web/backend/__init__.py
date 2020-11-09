import os
from flask import Flask

app = Flask('kskp.web.backend')
app.secret_key = '-jm624cqpry89e'

# コマンド一覧で表示させるコマンドのリスト
app.config['VISIBLE_COMMANDS_JSON'] = ['mcmd', 'kcmd', 'pcmd']
# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config['JSON_SORT_KEYS'] = False

# flaskのjsonifyによるJSONへのデコード処理を、独自に定義したデコード処理に置き換える
from .api.utils.kskp_json_encoder import KSKPJSONEncoder
app.json_encoder = KSKPJSONEncoder

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
from .api import system
app.register_blueprint(basic.mod, url_prefix=PREFIX)
app.register_blueprint(frames.mod, url_prefix=PREFIX)
app.register_blueprint(lib.mod, url_prefix=PREFIX)
app.register_blueprint(system.mod, url_prefix=PREFIX)

# static用
from kskp.web.frontend import mod
app.register_blueprint(mod)

# 環境変数からロックの有効期間(分)を取得する
# (設定値がない場合は1時間とする)
lock_expire_minutes = int(os.getenv('LOCK_EXPIRE_MIN', 60))
# LockManagerオブジェクトを作成する
from flask import session
from kskp.store import LockManager
app.config['LOCK_MANAGER'] = LockManager(60 * lock_expire_minutes)
# sessionを31日間保持する場合はTrue
# session.permanent = True

def run():
    app.run(debug=True)

if __name__ == '__main__':
    main()
