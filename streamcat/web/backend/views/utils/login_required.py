import functools # wraps for decorator
from fastapi import Request, Depends
from fastapi.responses import Response, RedirectResponse
from fastapi_decorators import depends
from streamcat.store.factory import UnAuthzFactory
from ... import SECURITY_LEVEL, GOOGLE_LOGIN
from ...api.utils import (
    make_access_token,
    decode_token,
    expired_soon,
    call_func,
    NotAuthenticationException
)
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
    クエリパラメータにsessionが指定された場合は
    各エンドポイントに定義された処理の代わりに、ログインまたはログアウト処理を行う
    """
    def get_request(_request:Request):
        return _request

    # エンドポイント関数の引数とここでwrapper関数に加えた引数名が重複しないこと
    @depends(_request=Depends(get_request)) 
    @functools.wraps(func)
    async def wrapper(_request:Request, **kwargs):
        # デコレート対象の関数からRequest引数を取得する
        # request = kwargs.get('request')

        # 要求されたURLを取得する
        request_base_url = _get_request_base_url(_request)

        # 指定されたクエリパラメータ
        q_params = _request.query_params

        # ログアウト時のURLをCookieから取得する
        last_url = _get_last_url(_request.cookies)

        if 'session' not in q_params:
            try:
                # 例外が送出されなければ認証成功
                claims = _get_claims(_request.cookies)
            except:
                # 認証失敗した場合はCookieをクリアしてログインページを返す
                original_url = request_base_url.include_query_params(session='on')
                response = _make_login_response(_request, last_url=last_url, original_url=original_url, args=q_params)
                raise NotAuthenticationException('not authorized !', response)
            # クエリパラメータに'session'がない場合、各エンドポイントに定義された処理を行う
            response = await call_func(func, **kwargs)
            if expired_soon(claims['exp']):
                # アクセストークンの有効期限がもうすぐ切れる場合は、新しいアクセストークンを発給する
                access_token = make_access_token(claims['sub'])
                return _make_response_with_token(response, access_token)
            else:
                return response

        elif q_params['session'] == 'on':
            # 認証を要求している場合
            # (すでに認証が通っている場合でも、再認証する)

            # RequestからFormデータを取得する
            form = await _request.form()
            request_email = form.get('email', '')

            with UnAuthzFactory() as factory:
                try:
                    user = factory.find_user_by_email(request_email)
                except Exception:
                    # 認証失敗した場合はCookieをクリアしてログインページを返す
                    response = _make_login_response(_request, last_url=last_url, email=request_email, login_failed=True)
                    raise NotAuthenticationException('user not found', response)

            if user.authenticate(form.get('password', '')):
                # アクセストークンを発給する
                access_token = make_access_token(user.uuid)

                if user.is_init_or_temp:
                    # 仮登録状態の場合はパスワード登録画面に遷移する
                    response = make_response(_request, 'register_password.html', email=request_email)
                    # アクセストークンをCookieに格納してWebブラウザに渡す
                    return _make_response_with_token(response, access_token)
                else:
                    # ログアウト時のURLが得られない場合は、request_base_urlにリダイレクトさせる
                    response = RedirectResponse(last_url or request_base_url)
                    # アクセストークンをCookieに格納してWebブラウザに渡す
                    return _make_response_with_token(response, access_token)

            elif user.password_expired():
                # 仮パスワードが有効期限切れの場合、Cookieをクリアしてその旨を通知する
                message = '仮パスワードの有効期限が切れています。ユーザ管理者に問い合わせて下さい。'
                response = _make_login_response(_request, login_failed=True, alert_message=message)
                raise NotAuthenticationException('password expired', response)

            else:
                # 認証失敗
                # メールアドレスは残してパスワードだけにする
                # この仕様はセキュリティ上あまりよろしくはないが、
                # ちゃんと画面が遷移したテストとしてわかりやすいので一時的にそうしている
                response = _make_login_response(_request, last_url=last_url, email=request_email, login_failed=True)
                raise NotAuthenticationException('invalid password', response)

        elif q_params['session'] == 'off':
            # ログアウト処理
            # クエリパラメータから'session=off'を削除する
            last_q_params = {k: v for k, v in q_params.items() if k != 'session'}
            # ログアウト時のURLをCookieに格納してWebブラウザに渡す
            last_url = request_base_url.include_query_params(**last_q_params)
            response = RedirectResponse(last_url)
            return _make_response_with_last_url(response, last_url)

        else:
            # 無効なクエリパラメータの値
            raise NotAuthenticationException('invalid value of session parameter')

    return wrapper

def _get_request_base_url(request:Request):
    # クエリパラメータを除いたURL
    base_url = request.url.replace(query='')

    # AWSではロードバランサーから各EC2インスタンスへの通信はHTTPである
    # そのような構成の場合、request.urlにはhttp:/が設定される
    if SECURITY_LEVEL >= 2 and not base_url.is_secure:
        return base_url.replace(scheme='https')
    else:
        return base_url

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

def _make_login_response(request:Request, last_url=None, email='', login_failed=False, alert_message='', original_url='', args=''):
    """
    ログイン画面に遷移する
    """
    from ...api.utils import Status
    # ログインに失敗した場合は、UNAUTHORIZED(401)を返す
    status_code = Status.UNAUTHORIZED if login_failed else Status.OK
    response = make_response(request,
                            'login.html',
                            status_code=status_code,
                            email=email,
                            login_failed=login_failed,
                            alert_message=alert_message,
                            google_login=GOOGLE_LOGIN,
                            original_url=original_url,
                            args=args)
    # ログアウト時のURLの指定があれば、Set-Cookieヘッダにログアウト時のURLを設定し、Webブラウザに渡す
    return _make_response_with_last_url(response, last_url)
