import functools # wraps for decorator
from flask import (
    render_template,
    redirect,
    jsonify,
    session,
    request,
    g
)
from kskp.store.factory import Factory, UnAuthzFactory

def login_required(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとログインページを表示させる

    TODO: 自動的にmethodsにPOSTを追加するようにしたい
    そうなるとパラメータつきデコレータになりそうだけど、やるだけといえばやるだけ
    """
    from kskp.web.backend import SECURITY_LEVEL
    
    @functools.wraps(func)
    def deco(**kwargs):
        # AWSではロードバランサーから各EC2インスタンスへの通信はHTTPである
        # そのような構成の場合、request.urlにはhttp:/が設定される
        if SECURITY_LEVEL >= 2 and not request.is_secure:
            request_base_url = request.base_url.replace('http://', 'https://', 1)
        else:
            request_base_url = request.base_url

        if 'session' in request.args:
            if request.args['session'] == 'on':
                # 認証を要求している場合
                # すでに認証が通っている場合でも、再認証する
                f = request.form
                request_email = request.form.get('email') or ''
                with UnAuthzFactory() as factory:
                    try:
                        user = factory.find_user_by_email(request_email)
                    except Exception:
                        return _render_login_template(email=request_email, login_failed=True)

                if user.authenticate(f['password']):
                    # 仮登録状態の場合はパスワード登録画面に遷移する
                    if user.is_init_or_temp:
                        session['signup_email'] = request_email
                        return render_template('register_password.html', email=request_email)

                    # ユーザID保存
                    session['user_uuid'] = user.uuid
                    # 認証成功 本来のページへ遷移する
                    if session.get('last_URL'):
                        last_url = session['last_URL']
                        session.pop('last_url', None)
                        return redirect(last_url)
                    else:
                        return redirect(request_base_url)

                elif user.password_expired():
                    # 仮パスワードが有効期限切れの場合、その旨を通知する
                    message = '仮パスワードの有効期限が切れています。ユーザ管理者に問い合わせて下さい。'
                    return _render_login_template(email=request_email, login_failed=True, alert_message=message)

                else:
                    # 認証失敗
                    # メールアドレスは残してパスワードだけにする
                    # この仕様はセキュリティ上あまりよろしくはないが、
                    # ちゃんと画面が遷移したテストとしてわかりやすいので一時的にそうしている
                    return _render_login_template(email=request_email, login_failed=True)

            elif request.args['session'] == 'off':
                # ログアウト処理
                # TODO: セッションを消すだけで良いか要検討
                session.pop('user_uuid', None)
                # 再度やり直し

                # 'session=off'だけを消し去ったURLを作りたいがための記述
                query = '?'
                for key, arg in request.args.items():
                    if not key == 'session':
                        if not query == '?':
                            query += '&'
                        query += key + '=' + arg

                session['last_URL'] = request_base_url + query
                return redirect(session['last_URL'])
            else:
                # 無効なクエリパラメータの値
                # ひとまずログインページを返しておく
                return _render_login_template(original_url=request_base_url+'?session=on', args=request.args)
        else:
            # クエリパラメータに'session'がない、普通のアクセス
            if 'user_uuid' in session:
                return func(**kwargs)
            else:
                # ログインページを返す
                return _render_login_template(original_url=request_base_url+'?session=on', args=request.args)

    return deco

def login_required_api(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとエラー用JSONを返却する
    """
    @functools.wraps(func)
    def deco(**kwargs):
        if 'user_uuid' in session:
            # Userオブジェクトをflask.gに設定する
            with UnAuthzFactory() as factory:
                try:
                    user = factory.find_user_by_uuid(session['user_uuid'])
                except Exception:
                    # 存在しないuser_idはSessonから削除する
                    session.clear()
                    # ログインページを返す
                    return _render_login_template()
                if user.is_inactive:
                    # 認証エラー
                    return jsonify({'success': False, 'message': 'not authorized..'})
                elif user.password_expired():
                    # 仮パスワードが有効期間切れの場合、認証エラー
                    return jsonify({'success': False, 'message': 'not authorized.'})
                elif user.is_init_or_temp:
                    # 本パスワード登録画面に遷移する
                    session['signup_email'] = user.email
                    return render_template('register_password.html', email=user.email)
                g.user = user
            # Sessionオブジェクトをflask.gに設定する
            with Factory(user) as factory:
                # AuthzSessionをUserオブジェクトに格納する
                g.user._session = factory._session
                g.factory = factory
                return func(**kwargs)
        else:
            # 認証エラー
            return jsonify({'success': False, 'message': 'not authorized'})
    return deco

def _render_login_template(email='', login_failed=False, alert_message='', original_url='', args=''):
    """
    ログイン画面に遷移する
    """
    return render_template( 'login.html',
                            email=email,
                            login_failed=login_failed,
                            alert_message=alert_message,
                            original_url=original_url,
                            args=args)
