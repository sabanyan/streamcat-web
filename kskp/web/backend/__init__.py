import os
from flask import Flask, Response

# Flask
app = Flask('kskp.web.backend')

# production : evalを使用しない(セキュリティ高いがデバッグできない、ビルドに時間を要する)
# development: evalを使用する
FRONTEND_BUILD=os.getenv('KSKP_FRONTEND_BUILD', 'production')

# 1 : Googleログインボタンを表示してGoogleログイン機能を有効にする
GOOGLE_LOGIN=bool(os.getenv('KSKP_GOOGLE_LOGIN', 0))

# 0: セキュリティ設定をしない
# 1: 基本的なセキュリティ設定をする
# 2: HTTPS通信を前提としたセキュリティ設定をする
SECURITY_LEVEL=int(os.getenv('KSKP_SECURITY_LEVEL', 1))

# コマンド一覧で表示させるコマンドのリスト
app.config['VISIBLE_COMMANDS_JSON'] = ['mcmd', 'kcmd', 'pcmd']
# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config['JSON_SORT_KEYS'] = False

@app.after_request
def after_request(response:Response):
    if SECURITY_LEVEL >= 1:
        # Webブラウザに対し、レスポンスヘッダのContent-type以外のタイプで解釈しないように要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Content-Type-Options
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Webブラウザに対し、HTTPSだけで接続することを要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Strict-Transport-Security
        if SECURITY_LEVEL >= 2:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    # FlaskからHTTPリクエストログを出力する
    app.logger.info(response.status_code)
    # レスポンスを返す
    return response

#
# ログ出力の設定
#
import logging
from flask.logging import default_handler
from .api.utils import KSKPLogFormatter, XHRFilter

# WerkzeugサーバのHTTPリクエストログの出力を停止する
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.disabled = True

# ログの書式を定義する
# %(message)sにHTTPステータスコードが記述されているようだ
# https://docs.python.org/ja/3/library/logging.html#logrecord-attributes
log_formatter = KSKPLogFormatter(
    '"%(asctime)s","%(user_uuid)s","%(remote_addr)s","%(message)s","%(method)s","%(path)s"'
)

# Flaskのログ書式を設定する
default_handler.setFormatter(log_formatter)
default_handler.setLevel(logging.INFO)

# Flaskのloggerに設定する
app.logger.addHandler(default_handler)
app.logger.addFilter(XHRFilter())

# FlaskのjsonifyによるJSONへのデコード処理を、独自に定義したデコード処理に置き換える
from .api.utils import KSKPJSONEncoder
app.json_encoder = KSKPJSONEncoder

#
# End points of API
#
PREFIX = '/api/v0'
from .api import domain
from .api import flows
from .api import library
from .api import system
from .api import users
app.register_blueprint(domain.mod)
app.register_blueprint(flows.mod, url_prefix=PREFIX)
app.register_blueprint(library.mod, url_prefix=PREFIX)
app.register_blueprint(system.mod, url_prefix=PREFIX)
app.register_blueprint(users.mod, url_prefix=PREFIX)

#
# End points of HTML
#
from .views import auth
from .views import basic
app.register_blueprint(auth.mod, url_prefix='/signup')
app.register_blueprint(basic.mod)

# static用
from ..frontend import mod
app.register_blueprint(mod)

def run(port=5000):
    app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
    run(port=5000)
