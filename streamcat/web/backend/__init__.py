import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.templating import Jinja2Templates

# 0 : evalを使用しない(セキュリティ高いがデバッグできない、ビルドに時間を要する)
# 1 : evalを使用する
DEBUG_BUILD=bool(os.getenv('STREAMCAT_DEBUG_BUILD', 0))

# 1 : Googleログインボタンを表示してGoogleログイン機能を有効にする
GOOGLE_LOGIN=bool(os.getenv('STREAMCAT_GOOGLE_LOGIN', 0))

# 0: セキュリティ設定をしない
# 1: 基本的なセキュリティ設定をする
# 2: HTTPS通信を前提としたセキュリティ設定をする
SECURITY_LEVEL=int(os.getenv('STREAMCAT_SECURITY_LEVEL', 1))

# SECURITY_LEVELの定義の後にimportしないと循環importエラーになる
app = FastAPI()

# Jinja2のテンプレートを生成する
SCatTemplates = Jinja2Templates(directory='streamcat-web/streamcat/web/backend/templates')

# FastAPIの起動時の処理
@app.on_event('startup')
async def startup_event():
    # FastAPI(v0.104.1)で独自のオブジェクト型のJSONへの変換方法を指定する方法が無かった
    # 代わりにSCatJSONResponseで変換することにし、FastAPIでの標準の変換処理を無効化する
    from fastapi.encoders import encoders_by_class_tuples
    from streamcat.core import SavableDatum
    from streamcat.store import StoreModel
    from streamcat.store import FlowData
    from streamcat.store import ProjectFolder
    from streamcat.store.lock import Lock
    from streamcat.store.auth import User, Role
    from .api.utils.vis_converter import VisConverter
    # 独自オブジェクトがJSONに変換されないよう無処理の変換関数を定義する
    pass_through = lambda d: d
    # NOTE: 公開されていないencoders_by_class_tuples変数に無処理の変換関数を登録する
    encoders_by_class_tuples[pass_through] = (VisConverter, StoreModel, Lock, SavableDatum, FlowData, User, Role, ProjectFolder.Member, Role.Member)

# HTMLも含めて全てのエンドポイントの共通処理
# https://github.com/tiangolo/fastapi/discussions/7691
@app.middleware('http')
async def wrap_endpoint_call(request:Request, call_next):
    # 定義した各エンドポイントの処理を行う
    try:
        response = await call_next(request)
    finally:
        # NOTE: Sessionを閉じないとSQLAlchemyのコネクションプールが枯渇する
        # hasattr(request.state, 'factory') and request.state.factory.close()
        # NOTE: 複数のエンドポイントが同時に処理された場合は一度しか呼ばれない可能性がある
        # そうなると、ここでFactoryを閉じるのは不適切かもしれない
        pass

    if SECURITY_LEVEL >= 1:
        # Webブラウザに対し、レスポンスヘッダのContent-type以外のタイプで解釈しないように要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Content-Type-Options
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Webブラウザに対し、HTTPSだけで接続することを要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Strict-Transport-Security
        if SECURITY_LEVEL >= 2:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # HTTPリクエストログを出力する
    logger.info(msg='', extra={'request':request, 'status':response.status_code})

    # Responseを返す
    return response

# Bad Requestエラー(400)が送出された時の処理
@app.exception_handler(400)
def handle_bad_request(request:Request, ex:HTTPException):
    """
    Bad Requestが起きた時にもJSONを返却するように設定する
    （request bodyのJSONが不正な場合を想定している）
    """
    from .api.utils import BadRequestException
    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    raise BadRequestException(str(ex))

#
# ログ出力の設定
#
import sys
import logging
from .api.utils import SCatLogFormatter, XHRFilter

# UvicornサーバのHTTPリクエストログの出力を停止する
uvicorn_logger = logging.getLogger('uvicorn.access')
uvicorn_logger.disabled = True

# ログの書式を定義する
# https://docs.python.org/ja/3/library/logging.html#logrecord-attributes
log_formatter = SCatLogFormatter(
    '"%(asctime)s","%(user_uuid)s","%(remote_addr)s","%(status)s","%(method)s","%(path)s"'
)

# 標準出力に出力するHandlerを作成する
consoleHandler = logging.StreamHandler(sys.stdout)
# ログレベルと書式を設定する
consoleHandler.setLevel(logging.INFO)
consoleHandler.setFormatter(log_formatter)

# Loggerを作成する
logger = logging.getLogger('streamcat')
logger.handlers = [consoleHandler]
logger.filters = [XHRFilter()]
logger.setLevel(logging.INFO)

#
# End points of API
#
from .api import domain
from .api import flows
from .api import library
from .api import system
from .api import users
PREFIX = '/api/v0'
app.include_router(domain.router, prefix=PREFIX)
app.include_router(flows.router, prefix=PREFIX)
app.include_router(library.router, prefix=PREFIX)
app.include_router(system.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)

#
# End points of HTML
#
from .views import auth
from .views import basic
app.include_router(auth.router, prefix='/signup')
app.include_router(basic.router)

# 
# error handlers
# 
from .api import errors
errors.register_exception_handlers(app)

# 
# static files
# 
from fastapi.staticfiles import StaticFiles
app.mount('/front_static', StaticFiles(directory='streamcat-web/streamcat/web/frontend/static'), name='front_static')

def run(port=5000):
    import uvicorn
    uvicorn.run('streamcat.web.backend:app', host='0.0.0.0', port=port)

if __name__ == '__main__':
    run(port=5000)
