import time
import hashlib
import functools # wraps for decorator

from flask import (
    Blueprint,
    session,
    render_template,
    url_for, jsonify,
    request, redirect,
    flash
)
from flask_mail import Mail, Message

from kskp.web.backend import app
from kskp.store import model

mod = Blueprint('auth', __name__)

FIXED_SALT = b'd0d68c0d5bb78d78265c0d588f23bc60'
STRETCH_COUNT = 100
app.secret_key = '-jm624cqpry89e'


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
                user = model.get_user_id_by_email(f['email'])

                if user is None:
                    return render_template('login.html', email=f['email'])

                if authenticate(user['id'], f['password'], session):
                    # 認証成功 本来のページへ遷移する
                    if session.get('last_URL'):
                        last_url = session['last_URL']
                        session.pop('last_url', None)
                        return redirect(last_url)
                    else:
                        return redirect(request.base_url)

                else:
                    # 認証失敗
                    # メールアドレスは残してパスワードだけにする
                    # この仕様はセキュリティ上あまりよろしくはないが、
                    # ちゃんと画面が遷移したテストとしてわかりやすいので一時的にそうしている
                    return render_template('login.html', email=f['email'])
            elif request.args['session'] == 'off':
                # ログアウト処理
                # TODO: セッションを消すだけで良いか要検討
                session.pop('user_id', None)
                # 再度やり直し

                # 'session=off'だけを消し去ったURLを作りたいがための記述
                query = '?'
                for key, arg in request.args.items():
                    if not key == 'session':
                        if not query == '?':
                            query += '&'
                        query += key + '=' + arg

                session['last_URL'] = request.base_url + query
                return redirect(session['last_URL'])
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
    user_id_bytes = bytes(str(user_id), encoding='utf-8')
    return user_id_bytes + FIXED_SALT

def authenticate(user_id, password, session):
    """
    IDとパスワードを元に認証処理を行う
    認証の成功時にはTrueを、失敗すればFalseを返す
    """

    hashed_password = get_password_hash(model.get_user_by_id(user_id)['email'], password)
    sql = 'SELECT password FROM users WHERE id = ?'

    passwords = model.query_db(sql, (user_id,), one=True)

    if passwords is None:
        # そもそもユーザが存在しない場合
        return False

    if hashed_password == passwords['password']:
        # 認証成功
        session['user_id'] = user_id # model.get_user_id_by_email(user_id)  # ユーザID保存
        return True
    else:
        return False


@mod.route('/')
def signup():
    return render_template('signup.html')


# 承認メール用スクリプト

# flask_mail用の設定
CONFIRM_EMAIL = 'flask.mail.testtest@gmail.com'
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=465,
    MAIL_USERNAME=CONFIRM_EMAIL,
    MAIL_PASSWORD='@passwd1234',
    MAIL_USE_TLS=False,
    MAIL_USE_SSL=True
)

email_sender = Mail(app)

@mod.route('/confirm', methods=['POST'])
def confirm_email():
    email = request.form['email']

    url = make_temporal_url(email)

    msg = Message(
        '【確認】KSKP用のメールアドレスをご確認ください',
        sender=CONFIRM_EMAIL,
        recipients=[email]
    )
    msg.html = f"""
    <p>
      KSKPアカウントにこのメールアドレスを登録にするには
      <br>
      24時間以内に<a href={url}>ここから</a>登録してください。
    </p>
    """
    email_sender.send(msg)

    flash(f"{email}にメールを送信しました。")
    flash(f"届いたメールを確認して、24時間以内に登録を完了してください。")

    session['signup_email'] = email

    return render_template('signup.html')


@mod.route('/register/<mail_hash>')
def register_email(mail_hash):
    """
    メールの確認ができたので、パスワード入力画面を返す
    """
    return render_template('register_password.html', email=session['signup_email'])


@mod.route('/complete', methods=['POST'])
def complete_sign_up():
    """
    パスワードが決定されたので、それを元にユーザー登録を行う
    """
    email = session['signup_email']
    password = request.form['password']
    user_name = request.form['user_name']

    # TODO: この部分の仕様は不明確
    creator = email

    # ユーザーのDB登録
    model.create_user(email, password, user_name, creator)

    flash('ユーザー登録が完了しました。')

    session['user_id'] = model.get_user_id_by_email(session['signup_email'])['id']
    del session['signup_email']

    # TODO: ひとまずは初期ページをプロジェクト一覧にしておく
    return redirect(url_for('projects'))


def make_temporal_url(email):
    """
    ユーザー新規登録用のURLを作成する
    """
    hash_target = email + str(time.time())
    temp_path = hashlib.sha256(hash_target.encode()).hexdigest()

    # TODO: URL文字列作成に、url_rootを使っているのが少し気持ち悪い
    url = f'{request.url_root}signup/register/{temp_path}'

    return url
