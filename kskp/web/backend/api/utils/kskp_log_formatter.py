import logging
import datetime
from flask import has_request_context, request
from .token import decode_token
from .login_required_api import get_token_from_auth_header

class KSKPLogFormatter(logging.Formatter):
    """
    HTTPリクエストのログの書式
    """
    def format(self, record):
        if has_request_context():
            # requestインスタンスが存在する場合
            # CookieまたはAuthorizationヘッダからアクセストークンを取得する
            access_token = request.cookies.get('S') or get_token_from_auth_header(request.headers)
            if access_token is None:
                record.user_uuid = ''
            else:
                claims = decode_token(access_token)
                record.user_uuid = claims['sub'][:8]
            record.remote_addr = request.remote_addr
            record.method = request.method
            record.path = request.path
        else:
            # requestインスタンスが存在しない場合
            record.user_uuid = ''
            record.remote_addr = ''
            record.method = ''
            record.path = ''
        return super().format(record)

    def formatTime(self, record, datefmt=None):
        """
        asctimeのmsの区切り文字を","から"."に置き換える
        """
        ct = datetime.datetime.fromtimestamp(record.created)
        if datefmt is None:
            return ct.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        else:
            return ct.strftime(datefmt)

class XHRFilter(logging.Filter):
    """
    HTMLとAPI以外へのHTTPリクエストをログ出力しない
    """
    def filter(self, record):
        return has_request_context() and not request.path.startswith('/front_static')
