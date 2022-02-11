import functools # wraps for decorator
from flask import (
    Response,
    redirect,
    request
)
from streamcat.store.factory import UnAuthzFactory
from ... import SECURITY_LEVEL, GOOGLE_LOGIN
from ...api.utils import make_access_token, decode_token, expired_soon
from .make_response import make_response

if SECURITY_LEVEL >= 1:
    # True: WebブラウザのSessionのCookieの送信はHTTPSによる送信だけに制限される
    # "http://www.host.com:443"のようなURLにアクセスさせてSessionのCookieを平文で送信することを防ぐ
    _SESSION_COOKIE_SECURE = SECURITY_LEVEL >= 2

    # True: WebブラウザはJavaScriptによるSessionのCookieへのアクセスが禁止される
    _SESSION_COOKIE_HTTPONLY = True

    # Cross-Site Request Forgeries対策
    # Lax   : 他ドメインへの遷移(top-level navigation)でも、GETメソッドであればSessionのCookieの送信を許可する
    #         (URLにアクセスしてもSessionのCookieを保持していればログイン画面をスキップできる)
    # Strict: 同一ドメインへの遷移でのみ、SessionのCookieの送信を許可する
    _SESSION_COOKIE_SAMESITE = 'Lax'

    # session.permanent=Trueの場合にのみ有効、SessionのCookieの有効期間(秒)を設定する
    # app.config['PERMANENT_SESSION_LIFETIME'] = 5 * 24 * 60 * 60
else:
    _SESSION_COOKIE_SECURE = False
    _SESSION_COOKIE_HTTPONLY = False
    _SESSION_COOKIE_SAMESITE = None

def login_required(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとログインページを表示させる

    TODO: 自動的にmethodsにPOSTを追加するようにしたい
    そうなるとパラメータつきデコレータになりそうだけど、やるだけといえばやるだけ
    """
    from streamcat.web.backend import SECURITY_LEVEL
    
    @functools.wraps(func)
    def deco(**kwargs):
        # AWSではロードバランサーから各EC2インスタンスへの通信はHTTPである
        # そのような構成の場合、request.urlにはhttp:/が設定される
        if SECURITY_LEVEL >= 2 and not request.is_secure:
            request_base_url = request.base_url.replace('http://', 'https://', 1)
        else:
            request_base_url = request.base_url

        # ログアウト時のURLをCookieから取得する
        last_url = _get_last_url(request.cookies)

        if 'session' not in request.args:
            # クエリパラメータに'session'がない、普通のアクセス
            try:
                # 例外が送出されなければ認証成功
                claims = _get_claims(request.cookies)
            except:
                # 認証失敗した場合はCookieをクリアしてログインページを返す
                return _make_login_response(last_url=last_url, original_url=request_base_url+'?session=on', args=request.args)
            # HTMLレスポンスを作成する
            response = func(**kwargs)
            if expired_soon(claims['exp']):
                # アクセストークンの有効期限がもうすぐ切れる場合は、新しいアクセストークンを発給する
                token = make_access_token(claims['sub'])
                return _make_response_with_token(response, token)
            else:
                return response

        elif request.args['session'] == 'on':
            # 認証を要求している場合
            # (すでに認証が通っている場合でも、再認証する)
            form = request.form
            request_email = form.get('email', '')

            with UnAuthzFactory() as factory:
                try:
                    user = factory.find_user_by_email(request_email)
                except Exception:
                    # 認証失敗した場合はCookieをクリアしてログインページを返す
                    return _make_login_response(last_url=last_url, email=request_email, login_failed=True)

            if user.authenticate(form.get('password', '')):
                # 仮登録状態の場合はパスワード登録画面に遷移する
                if user.is_init_or_temp:
                    # アクセストークンをCookieに格納してWebブラウザに渡す
                    access_token = make_access_token(user.uuid)
                    response = make_response('register_password.html', email=request_email)
                    return _make_response_with_token(response, access_token)

                # Cookieからログアウト時のURLを取得する
                last_url = _get_last_url(request.cookies)

                # ログアウト時のURLが得られない場合は、request_base_urlにリダイレクトさせる
                response = redirect(last_url or request_base_url)

                # アクセストークンをCookieに格納してWebブラウザに渡す
                access_token = make_access_token(user.uuid)
                return _make_response_with_token(response, access_token)

            elif user.password_expired():
                # 仮パスワードが有効期限切れの場合、Cookieをクリアしてその旨を通知する
                message = '仮パスワードの有効期限が切れています。ユーザ管理者に問い合わせて下さい。'
                return _make_login_response(login_failed=True, alert_message=message)

            else:
                # 認証失敗
                # メールアドレスは残してパスワードだけにする
                # この仕様はセキュリティ上あまりよろしくはないが、
                # ちゃんと画面が遷移したテストとしてわかりやすいので一時的にそうしている
                return _make_login_response(last_url=last_url, email=request_email, login_failed=True)

        elif request.args['session'] == 'off':
            # ログアウト処理
            # 'session=off'だけを消し去ったURLを作りたいがための記述
            query = '?'
            for key, arg in request.args.items():
                if not key == 'session':
                    if not query == '?':
                        query += '&'
                    query += key + '=' + arg
            # ログアウト時のURLをCookieに格納してWebブラウザに渡す
            last_url = request_base_url + query
            response = redirect(last_url)
            return _make_response_with_last_url(response, last_url)

        else:
            # 無効なクエリパラメータの値
            # ひとまずログインページを返しておく
            return _make_login_response(last_url=last_url, original_url=request_base_url+'?session=on', args=request.args)

    return deco

def _get_claims(cookies:dict):
    """
    Cookieからアクセストークンを取得して、デコードした内容を返す\n
    アクセストークンがない、不正な署名、有効期限切れの場合は例外を送出する
    """
    access_token = cookies.get('S')
    return decode_token(access_token)

def _get_last_url(cookies:dict) -> str:
    """
    Cookieからログアウト時のURLを取得する
    """
    return cookies.get('U')

def _make_response_with_token(response:Response, token):
    """
    HTTPレスポンスのSet-Cookieヘッダにアクセストークンを設定し、Webブラウザに渡す
    """
    # Cookieにログアウト時のURLを格納しない
    response.delete_cookie('U')

    if token is None:
        # Cookieにアクセストークンを格納しない
        response.delete_cookie('S')
    else:
        # Cookieにアクセストークンを格納する
        response.set_cookie(
            'S',
            value=token,
            max_age=None,
            secure=_SESSION_COOKIE_SECURE,
            httponly=_SESSION_COOKIE_HTTPONLY,
            path='/',
            samesite=_SESSION_COOKIE_SAMESITE,
        )
    return response

def _make_response_with_last_url(response:Response, last_url):
    """
    HTTPレスポンスのSet-Cookieヘッダにログアウト時のURLを設定し、Webブラウザに渡す
    """
    # Cookieにアクセストークンを格納しない
    response.delete_cookie('S')

    if last_url is None:
        # Cookieにログアウト時のURLを格納しない
        response.delete_cookie('U')
    else:
        # Cookieにログアウト時のURLを格納する
        response.set_cookie(
            'U',
            value=last_url,
            max_age=None,
            secure=_SESSION_COOKIE_SECURE,
            httponly=_SESSION_COOKIE_HTTPONLY,
            path='/',
            samesite=_SESSION_COOKIE_SAMESITE,
        )
    return response

def _make_login_response(last_url=None, email='', login_failed=False, alert_message='', original_url='', args=''):
    """
    ログイン画面に遷移する
    """        
    response = make_response('login.html',
                            email=email,
                            login_failed=login_failed,
                            alert_message=alert_message,
                            google_login=GOOGLE_LOGIN,
                            original_url=original_url,
                            args=args)
    # OK
    OK = 200
    # 認証が必要である
    UNAUTHORIZED = 401

    # ログインに失敗した場合は、UNAUTHORIZED(401)を返す
    status_code = UNAUTHORIZED if login_failed else OK
    # ログアウト時のURLの指定があれば、Set-Cookieヘッダにログアウト時のURLを設定し、Webブラウザに渡す
    return _make_response_with_last_url(response, last_url), status_code
