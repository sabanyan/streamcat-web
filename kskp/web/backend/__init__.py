import os
from flask import Flask, session

app = Flask('kskp.web.backend')

# 0: セキュリティ設定をしない
# 1: 基本的なセキュリティ設定をする
# 2: HTTPS通信を前提としたセキュリティ設定をする
security_level=int(os.getenv('KSKP_SECURITY_LEVEL', 1))

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

if security_level >= 1:

    @app.after_request
    def after_request(response):
        # Webブラウザに対し、コンテンツの取得元をディレクティブに従い制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/CSP
        response.headers['Content-Security-Policy-Report-Only'] = \
            "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
        # Webブラウザに対し、レスポンスヘッダのContent-type以外のタイプで解釈しないように要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Content-Type-Options
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Webブラウザに対し、<frame>,<iframe>,<embed>,<object>から取得するコンテンツを自身のドメインに制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Frame-Options
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        # Webブラウザに対し、HTTPSだけで接続することを要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Strict-Transport-Security
        if security_level >= 2:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        # レスポンスを返す
        return response

    # True: WebブラウザはJavaScriptによるSessionのCookieへのアクセスが禁止される
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    # True: WebブラウザのSessionのCookieの送信はHTTPSによる送信だけに制限される
    # "http://www.host.com:443"のようなURLにアクセスさせてSessionのCookieを平文で送信することを防ぐ
    if security_level >= 2:
        app.config['SESSION_COOKIE_SECURE'] = True
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
from .api.utils.kskp_json_encoder import KSKPJSONEncoder
app.json_encoder = KSKPJSONEncoder

# render_template
from .views import basic
app.register_blueprint(basic.mod)
# api
from .api import auth
app.register_blueprint(auth.mod, url_prefix='/signup')


PREFIX = '/api/v0'
from .api import domain
from .api import basic
from .api import frames
from .api import lib
from .api import system
from .api import flow_test
app.register_blueprint(domain.mod)
app.register_blueprint(basic.mod, url_prefix=PREFIX)
app.register_blueprint(frames.mod, url_prefix=PREFIX)
app.register_blueprint(lib.mod, url_prefix=PREFIX)
app.register_blueprint(flow_test.mod, url_prefix=PREFIX)
app.register_blueprint(system.mod, url_prefix=PREFIX)

# static用
from kskp.web.frontend import mod
app.register_blueprint(mod)

def run(port=5000):
    app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
    run(port=5000)
