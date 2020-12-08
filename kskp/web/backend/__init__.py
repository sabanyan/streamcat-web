from flask import Flask, session
from flask.helpers import url_for

app = Flask('kskp.web.backend')

# SessionのCookieを署名するための秘密鍵
# SessionのCookieを秘密鍵で署名して改竄を防ぐ
# TODO: 毎回ランダムに変更した方がいい？
app.secret_key = '-jm624cqpry89e'

# コマンド一覧で表示させるコマンドのリスト
app.config['VISIBLE_COMMANDS_JSON'] = ['mcmd', 'kcmd', 'pcmd']
# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config['JSON_SORT_KEYS'] = False

# SessionのCookieの名前
app.config['SESSION_COOKIE_NAME'] = 'S'
# True: WebブラウザはJavaScriptによるSessionのCookieへのアクセスが禁止される
app.config['SESSION_COOKIE_HTTPONLY'] = True
# True: WebブラウザのSessionのCookieの送信はHTTPSによる送信だけに制限される
# "http://www.host.com:443"のようなURLにアクセスさせてSessionのCookieを平文で送信することを防ぐ
app.config['SESSION_COOKIE_SECURE'] = False
# Cross-Site Request Forgeries対策
# Lax   : 他ドメインへの遷移(top-level navigation)でも、GETメソッドであればSessionのCookieの送信を許可する
#         (URLにアクセスしてもSessionのCookieを保持していればログイン画面をスキップできる)
# Strict: 同一ドメインへの遷移でのみ、SessionのCookieの送信を許可する
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
# session.permanent=Trueの場合にのみ有効、SessionのCookieの有効期間(秒)を設定する
app.config['PERMANENT_SESSION_LIFETIME'] = 5 * 24 * 60 * 60
# True : SessionのCookieを永続化する
# False: SessionのCookieは永続化しない、Webブラウザが閉じられたらSessionのCookieは削除される
# TODO: Request-Context内で記述する必要がある
# session.permanent = False

# flaskのjsonifyによるJSONへのデコード処理を、独自に定義したデコード処理に置き換える
# from .api.utils.kskp_json_encoder import KSKPJSONEncoder
from kskp.web.backend.api.utils.kskp_json_encoder import KSKPJSONEncoder
app.json_encoder = KSKPJSONEncoder
# render_template
# 将来的にvisualizeどうなるかわからないので、とりあえず別に隔離しておく
# from .views import visualize
# from .views import basic
from kskp.web.backend.views import visualize
from kskp.web.backend.views import basic
app.register_blueprint(visualize.mod)
app.register_blueprint(basic.mod)
# api
# from .api import auth
from kskp.web.backend.api import auth
app.register_blueprint(auth.mod, url_prefix='/signup')

PREFIX = '/api/v0'
# from .api import domain
# from .api import basic
# from .api import frames
# from .api import lib
# from .api import system
from kskp.web.backend.api import domain
from kskp.web.backend.api import basic
from kskp.web.backend.api import frames
from kskp.web.backend.api import lib
from kskp.web.backend.api import system
app.register_blueprint(domain.mod)
app.register_blueprint(basic.mod, url_prefix=PREFIX)
app.register_blueprint(frames.mod, url_prefix=PREFIX)
app.register_blueprint(lib.mod, url_prefix=PREFIX)
app.register_blueprint(system.mod, url_prefix=PREFIX)

# static用
from kskp.web.frontend import mod
app.register_blueprint(mod)

def run(port=5000):
    app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
    main()
