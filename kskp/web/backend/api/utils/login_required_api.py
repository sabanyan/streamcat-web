import functools # wraps for decorator
from flask import (
    jsonify,
    request,
    g
)
from kskp.store.factory import Factory, UnAuthzFactory
from .token import decode_token

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
    # 認証が必要である
    UNAUTHORIZED = 401

    @functools.wraps(func)
    def deco(**kwargs):
        # CookieまたはAuthorizationヘッダからアクセストークンを取得する
        access_token = request.cookies.get('S') or get_token_from_auth_header(request.headers)

        if access_token is None:
            return jsonify({'success':False, 'message':'no access token'}), UNAUTHORIZED
        try:
            # 例外が送出されなければ認証成功
            claims = decode_token(access_token)
        except:
            # 認証失敗の場合はエラーメッセージを返す
            return jsonify({'success':False, 'message':'not authorized'}), UNAUTHORIZED

        # Userオブジェクトをflask.gに設定する
        with UnAuthzFactory() as factory:
            try:
                user_uuid = claims['sub']
                user = factory.find_user_by_uuid(user_uuid)
            except Exception:
                return jsonify({'success':False, 'message':'not authorized...'}), UNAUTHORIZED
                # 存在しないuser_uuidはCookieから削除する
                # return _set_cookies(response, None)
            if user.is_inactive:
                # 認証エラー
                return jsonify({'success':False, 'message':'not authorized..'}), UNAUTHORIZED
            elif user.password_expired():
                # 仮パスワードが有効期間切れの場合、認証エラー
                return jsonify({'success':False, 'message':'not authorized.'}), UNAUTHORIZED
            elif user.is_init_or_temp:
                # 本パスワード登録画面に遷移する
                return jsonify({'success':False, 'message':'user password is not registered'}), UNAUTHORIZED
            g.user = user

        # Sessionオブジェクトをflask.gに設定する
        with Factory(user) as factory:
            # AuthzSessionをUserオブジェクトに格納する
            g.user._session = factory._session
            g.factory = factory
            # APIレスポンスを作成する
            return func(**kwargs)

    return deco
