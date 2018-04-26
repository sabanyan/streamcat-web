import hashlib
from flask import session, render_template, jsonify

FIXED_SALT = b'd0d68c0d5bb78d78265c0d588f23bc60'
STRETCH_COUNT = 100

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

def login_required(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとログインページを表示させる
    """
    def deco():
        if 'user_id' in session:
            return func()
        else:
            # ログインページを返す
            return render_template('login.html')
    return deco

def login_required_api(func):
    """
    このデコレータがついたエンドポイントは、
    ログインされていないとエラー用JSONを返却する
    """
    def deco():
        if 'user_id' in session:
            return func()
        else:
            # ログインページを返す
            return jsonify({'success': False, 'message': 'not authorized'})
    return deco
