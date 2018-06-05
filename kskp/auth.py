import hashlib
import functools # wraps for decorator
from flask import session, render_template, jsonify, request, redirect
from . import app
from . import model

FIXED_SALT = b'd0d68c0d5bb78d78265c0d588f23bc60'
STRETCH_COUNT = 100
app.secret_key = '-jm624cqpry89e'

def get_password_hash(user_id, password):
    """
    パスワードのハッシュを作成する
    """

    salt = get_salt(user_id)
    current_hash = b''
    password_bytes = bytes(password, encoding='utf-8')

    for _ in range(1, STRETCH_COUNT):
        hash_target = current_hash + password_bytes + salt
        current_hash = bytes(hashlib.sha256(hash_target).hexdigest(), 'ascii')

    return str(current_hash, encoding='utf-8')

def get_salt(user_id):
    """
    固定ソルトとユーザID（現在はメールアドレス）
    """
    user_id_bytes = bytes(user_id, encoding='utf-8')
    return user_id_bytes + FIXED_SALT

def authenticate(user_id, password, session):
    """
    IDとパスワードを元に認証処理を行う
    認証の成功時にはTrueを、失敗すればFalseを返す
    """
    hashed_password = get_password_hash(user_id, password)
    sql = 'SELECT password FROM users WHERE email = ?'

    passwords = model.query_db(sql, (user_id,), one=True)
    if passwords is None:
        # そもそもユーザが存在しない場合
        return False

    if hashed_password == passwords['password']:
        # 認証成功
        session['user_id'] = model.get_user(user_id)  # ユーザID保存
        return True
    else:
        return False


def login_required(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとログインページを表示させる
    TODO: 自動的にmethodsにPOSTを追加するようにしたい
    そうなるとパラメータつきデコレータになりそうだけど、やるだけといえばやるだけ
    """
    @functools.wraps(func)
    def deco(**kwargs):
        if 'session' in request.args:
            if request.args['session'] == 'on':
                # 認証を要求している場合
                # すでに認証が通っている場合でも、再認証する
                f = request.form
                if authenticate(f['email'], f['password'], session):
                    # 認証成功 本来のページへ遷移する
                    return redirect(request.base_url)
                else:
                    # 認証失敗
                    # メールアドレスは残してパスワードだけにする
                    # この仕様はセキュリティ上あまりよろしくはないが、
                    # ちゃんと画面が遷移したテストとしてわかりやすいので一時的にそうしている
                    return render_template('login.html', email=f['email'])
            elif request.args['session'] == 'off':
                # ログアウト処理
                # TODO: 未実装
                del session['user_id']
                # 再度やり直し
                return redirect(request.base_url)
            else:
                # 無効なクエリパラメータの値
                # ひとまずログインページを返しておく
                return render_template('login.html', original_url=request.base_url+'?session=on', args=request.args)
        else:
            # クエリパラメータに'session'がない、普通のアクセス
            if 'user_id' in session:
                return func(**kwargs)
            else:
                # ログインページを返す
                return render_template('login.html', original_url=request.base_url+'?session=on', args=request.args)

    return deco

def login_required_api(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとエラー用JSONを返却する
    """
    @functools.wraps(func)
    def deco(**kwargs):
        if 'user_id' in session:
            return func(**kwargs)
        else:
            # ログインページを返す
            return jsonify({'success': False, 'message': 'not authorized'})
    return deco
