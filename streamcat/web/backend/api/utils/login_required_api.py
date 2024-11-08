from typing import Callable
import functools # wraps for decorator
from flask import (
    jsonify,
    request,
    g
)
from fastapi import Request, Depends
from fastapi_decorators import depends
from streamcat.store.factory import Factory, UnAuthzFactory
from .response import Status
from .token import decode_token
from .call_func import call_func
from .exceptions import NotAuthenticationException

def get_token_from_auth_header(headers:dict):
    """
    HTTPリクエストのAuthorizationからトークンを取得する
    """
    if 'Authorization' not in headers:
        return None
    str_list = headers['Authorization'].split('Bearer ')
    if len(str_list) < 2:
        return None
    return str.strip(str_list[1])

def login_required_api(func):
    """
    このデコレータがついたエンドポイントは、ログインされていないとエラー用JSONを返却する
    """
    @functools.wraps(func)
    def deco(**kwargs):
        # CookieまたはAuthorizationヘッダからアクセストークンを取得する
        access_token = request.cookies.get('S') or get_token_from_auth_header(request.headers)

        if access_token is None:
            return jsonify({'message':'no access token'}), Status.UNAUTHORIZED
        try:
            # 例外が送出されなければ認証成功
            claims = decode_token(access_token)
        except:
            # 認証失敗の場合はエラーメッセージを返す
            return jsonify({'message':'not authorized'}), Status.UNAUTHORIZED

        # Userオブジェクトをflask.gに設定する
        with UnAuthzFactory() as factory:
            try:
                user_uuid = claims['sub']
                user = factory.find_user_by_uuid(user_uuid)
            except Exception:
                return jsonify({'message':'not authorized...'}), Status.UNAUTHORIZED
                # 存在しないuser_uuidはCookieから削除する
                # return _set_cookies(response, None)
            if user.is_inactive:
                # 認証エラー
                return jsonify({'message':'not authorized..'}), Status.UNAUTHORIZED
            elif user.password_expired():
                # 仮パスワードが有効期間切れの場合、認証エラー
                return jsonify({'message':'not authorized.'}), Status.UNAUTHORIZED
            elif user.is_init_or_temp:
                # 本パスワード登録画面に遷移する
                return jsonify({'message':'user password is not registered'}), Status.UNAUTHORIZED
            g.user = user

        # Sessionオブジェクトをflask.gに設定する
        with Factory(user) as factory:
            # AuthzSessionをUserオブジェクトに格納する
            g.user._session = factory._session
            g.factory = factory
            # APIレスポンスを作成する
            return func(**kwargs)

    return deco

# 
# NOTE: 各エンドポイントに付加する認証処理の実装
# 
# FastAPIのDependsを用いて実装する方法
# ・Dependsの処理から例外を送出しない限り、エンドポイントの処理をキャンセルできない
# 　そのため、ログオフ時にログイン画面を表示する処理をDependsを用いて実装できない
# 
# PythonのDecoratorを用いて実装する方法
# ・Decorator内でFastAPIのRequestオブジェクトを参照するには、エンドポイント関数の引数に
# 　Requestを宣言する必要がある
# ・fastapi_decoratorsを用いれば、Requestを宣言せずにDecorator内で参照できる
# 
# Decoratorを用いて認証処理を実装することにした
# 

def get_factory(request:Request) -> Factory:
    """
    Requestに格納されたfactoryを取得する
    """
    return None


def login_required_api_new(func:Callable):
    """
    リクエストヘッダで渡されるアクセストークンを認証する
    """
    def get_request(_request:Request):
        return _request

    # Wrap the endpoint after adding the get_request dependency
    # エンドポイント関数の引数とここでwrapper関数に加えた引数名が重複しないこと
    @depends(_request=Depends(get_request)) 
    @functools.wraps(func)
    async def wrapper(_request:Request, **kwargs):

        # CookieまたはAuthorizationヘッダからアクセストークンを取得する
        access_token = _request.cookies.get('S') or get_token_from_auth_header(_request.headers)

        if access_token is None:
            raise NotAuthenticationException('no access token')
        try:
            # 例外が送出されなければ認証成功
            claims = decode_token(access_token)
        except:
            # 認証失敗の場合はエラーメッセージを返す
            raise NotAuthenticationException('not authorized')

        # Userオブジェクトを取得する
        with UnAuthzFactory() as factory:
            try:
                user_uuid = claims['sub']
                user = factory.find_user_by_uuid(user_uuid)
            except Exception as ex:
                raise NotAuthenticationException('not authorized...')
                # 存在しないuser_uuidはCookieから削除する
                # return _set_cookies(response, None)
            if user.is_inactive:
                # 認証エラー
                raise NotAuthenticationException('not authorized..')
            elif user.password_expired():
                # 仮パスワードが有効期間切れの場合、認証エラー
                raise NotAuthenticationException('not authorized.')
            elif user.is_init_or_temp:
                # 本パスワード登録画面に遷移する
                raise NotAuthenticationException('user password is not registered')

        # Factoryを渡す必要がある場合はRequestとkwargsに格納する
        if 'factory' in kwargs:
            # AuthzSessionをUserオブジェクトに格納する
            user._session = factory._session

            # Factoryを生成する
            factory = Factory(user)

            # 全エンドポイントの共通処理にFactoryを渡すため
            # FactoryをRequestオブジェクトに格納する
            _request.state.factory = factory
            # Factoryをエンドポイント関数の引数に格納する
            kwargs['factory'] = factory

        # エンドポイント関数を実行する
        return await call_func(func, **kwargs)

    return wrapper
