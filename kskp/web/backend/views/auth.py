from flask import (
    Blueprint,
    redirect,
    url_for,
    flash,
    session,
    request
)
from flask_mail import Mail, Message
from kskp.web.backend import app
from .utils import make_response

# MyProjectのラベル名
MY_PROJECT = 'MyProject'

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

mod = Blueprint('auth', __name__)

@mod.route('/')
def signup():
    return make_response('signup.html')

@mod.route('/confirm', methods=['POST'])
def confirm_email():
    def make_temporal_url(email):
        """
        ユーザー新規登録用のURLを作成する
        """
        import time
        import hashlib
        hash_target = email + str(time.time())
        temp_path = hashlib.sha256(hash_target.encode()).hexdigest()

        # TODO: URL文字列作成に、url_rootを使っているのが少し気持ち悪い
        url = f'{request.url_root}signup/register/{temp_path}'

        return url

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
    email_sender = Mail(app)
    email_sender.send(msg)

    flash(f"{email}にメールを送信しました。")
    flash(f"届いたメールを確認して、24時間以内に登録を完了してください。")

    session['signup_email'] = email

    return make_response('signup.html')

@mod.route('/register/<mail_hash>')
def register_email(mail_hash):
    """
    メールの確認ができたので、パスワード入力画面を返す
    """
    return make_response('register_password.html', email=session['signup_email'])

@mod.route('/complete', methods=['POST'])
def complete_sign_up():
    """
    パスワードが決定されたので、それを元にユーザー登録を行う
    """
    from kskp.store.factory import Factory, UnAuthzFactory
    from kskp.store.auth import InvalidPassword

    email = session['signup_email']
    del session['signup_email']
    new_password = request.form['password']
    # user_name = request.form['user_name']

    with UnAuthzFactory() as factory:
        try:
            user = factory.find_user_by_email(email)
        except Exception:
            return make_response('login.html', email=email, login_failed=True)

    with Factory(user) as factory:
        user = factory.user.find_by_id(user.id)
        user_is_init = user.is_init
        # 本パスワードへの変更
        try:
            user.update_password(new_password, modifier=user)
        except InvalidPassword as e:
            # もう一度パスワード入力を促す
            session['signup_email'] = email
            flash(str(e))
            return make_response('register_password.html', email=email)

        # ユーザID保存
        session['user_uuid'] = user.uuid

        # 初めて登録状態に遷移する時に、MyProjectを作成する
        if user_is_init:
            root = factory.data.load_root()
            project =root.create_project_folder(MY_PROJECT)
            project.save()

    # TODO: ひとまずは初期ページをプロジェクト一覧にしておく
    return redirect(url_for('basic_template.library'))
