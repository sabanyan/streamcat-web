import functools # wraps for decorator
from flask import (
    jsonify,
    request,
    g
)
from kskp.store.factory import Factory, UnAuthzFactory
from ...views.utils.login_required import _get_claims

def login_required_api(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとエラー用JSONを返却する
    """
    @functools.wraps(func)
    def deco(**kwargs):
        try:
            # 例外が送出されなければ認証成功
            claims = _get_claims(request.cookies)
        except:
            # 認証失敗の場合はエラーメッセージを返す
            return jsonify({'success':False, 'message':'not authorized'})

        # Userオブジェクトをflask.gに設定する
        with UnAuthzFactory() as factory:
            try:
                user_uuid = claims['sub']
                user = factory.find_user_by_uuid(user_uuid)
            except Exception:
                return jsonify({'success':False, 'message':'not authorized...'})
                # 存在しないuser_uuidはCookieから削除する
                # return _set_cookies(response, None)
            if user.is_inactive:
                # 認証エラー
                return jsonify({'success':False, 'message':'not authorized..'})
            elif user.password_expired():
                # 仮パスワードが有効期間切れの場合、認証エラー
                return jsonify({'success':False, 'message':'not authorized.'})
            elif user.is_init_or_temp:
                # 本パスワード登録画面に遷移する
                # return make_response('register_password.html', email=user.email)
                return jsonify({'success':False, 'message':'user password is not registered'})
            g.user = user

        # Sessionオブジェクトをflask.gに設定する
        with Factory(user) as factory:
            # AuthzSessionをUserオブジェクトに格納する
            g.user._session = factory._session
            g.factory = factory
            # APIレスポンスを作成する
            return func(**kwargs)

    return deco
