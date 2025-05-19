from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from oauthlib.oauth2 import WebApplicationClient
from .. import app, GOOGLE_LOGIN
from ..api.utils import make_access_token
from .utils import make_response
from .utils.login_required import _make_login_response, _make_response_with_token, _get_claims

# MyProjectのラベル名
MY_PROJECT = 'MyProject'

# # flask_mail用の設定
# CONFIRM_EMAIL = 'flask.mail.testtest@gmail.com'
# app.config.update(
#     MAIL_SERVER='smtp.gmail.com',
#     MAIL_PORT=465,
#     MAIL_USERNAME=CONFIRM_EMAIL,
#     MAIL_PASSWORD='@passwd1234',
#     MAIL_USE_TLS=False,
#     MAIL_USE_SSL=True
# )

router = APIRouter()

@router.get('/')
def signup():
    return make_response('signup.html')

@router.post('/confirm')
def confirm_email():
    from flask_mail import Mail, Message
    
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
        '【確認】StreamCat用のメールアドレスをご確認ください',
        sender=CONFIRM_EMAIL,
        recipients=[email]
    )
    msg.html = f"""
    <p>
      StreamCatアカウントにこのメールアドレスを登録にするには
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

@router.get('/register/{mail_hash}')
def register_email(mail_hash):
    """
    メールの確認ができたので、パスワード入力画面を返す
    """
    return make_response('register_password.html', email=session['signup_email'])

@router.post('/complete')
async def complete_sign_up(request:Request):
    """
    パスワードが決定されたので、それを元にユーザー登録を行う
    """
    from streamcat.store.finder import Finder, UnAuthzFinder
    from streamcat.store.auth import InvalidPassword

    # FORMの値は送信者が容易に改竄できるので、FORMからE-Mailを取得しないこと
    user_uuid = _get_claims(request.cookies).get('sub')
    new_password = (await request.form())['password']

    async with UnAuthzFinder() as ufactory:
        try:
            user = await ufactory.find_user_by_uuid(user_uuid)
        except Exception:
            return make_response(request, 'login.html', login_failed=True, google_login=GOOGLE_LOGIN)

        factory = await ufactory.create_authz_finder(user)
        user = factory.user.find_by_id(user.id)
        user_is_init = user.is_init
        # 本パスワードへの変更
        try:
            user.update_password(new_password, modifier=user)
        except InvalidPassword as e:
            # もう一度パスワード入力を促す
            return make_response(request, 'register_password.html', login_failed=True, alert_message=str(e), email=user.email)

        # 初めて登録状態に遷移する時に、MyProjectを作成する
        if user_is_init:
            root = factory.data.load_root()
            project =root.create_project_folder(MY_PROJECT)
            project.save()

    # TODO: ひとまずは初期ページをプロジェクト一覧にしておく
    response = RedirectResponse(app.url_path_for('library'))
    # アクセストークンをCookieに格納してWebブラウザに渡す
    access_token = make_access_token(user_uuid)
    return _make_response_with_token(response, access_token)


# 環境変数STREAMCAT_GOOGLE_LOGIN=Trueの場合は、Googleによる認証APIを公開する
if GOOGLE_LOGIN:
    # TODO: テスト用にHTTPS制限を解除している
    import os 
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

    # 認証サーバのエンドポイント
    GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token'

    # 認証クライアントのパラメタ
    # (Google Developer Consoleで設定した値)
    GOOGLE_API_CLIENT_ID = '296110041118-98dj1pfcu1lh641kvlm2d4j5l2bpesia.apps.googleusercontent.com'
    GOOGLE_API_CLIENT_SECRET = 'jzRN1JTzjFLtPjr1ME7m_-Rj'
    GOOGLE_API_SCOPE = ['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email']
    # (Google Developer Consoleの認証済リダイレクトURIに設定する必要がある)
    REDIRECT_URL_PATH = 'signup/callback'

    @router.get('/login')
    def login(request:Request):
        client = WebApplicationClient(GOOGLE_API_CLIENT_ID)
        # クエリパラメータを除いたURL
        base_url = request.url.replace(query='')
        # リダイレクト先のURLを作成する
        url, headers, body = client.prepare_authorization_request(
            GOOGLE_AUTHORIZATION_URL,
            redirect_url=base_url + REDIRECT_URL_PATH,
            scope=GOOGLE_API_SCOPE)
        # 認証URLにリダイレクトする (Googleへの認可リクエスト)
        return RedirectResponse(url)

    @router.get('/callback')
    async def callback(request:Request):
        import json
        import jwt
        import urllib.request
        from jwt.algorithms import RSAAlgorithm
        from streamcat.store.finder import UnAuthzFinder, Finder

        client = WebApplicationClient(GOOGLE_API_CLIENT_ID)
        # クエリパラメータを除いたURL
        base_url = request.url.replace(query='')

        # JWTトークン取得のリクエストを作成する
        url, headers, body = client.prepare_token_request(
            GOOGLE_TOKEN_URL,
            authorization_response=request.url,
            redirect_url=base_url + REDIRECT_URL_PATH,
            code=request.args.get('code'),
            client_secret=GOOGLE_API_CLIENT_SECRET)

        # JWTトークンを取得する
        req = urllib.request.Request(url, body.encode(), headers=headers)
        with urllib.request.urlopen(req) as res:
            ret = res.read()
            id_token = json.loads(ret)['id_token']

        # JWTトークンの公開鍵を取得する
        jwks_url = 'https://www.googleapis.com/oauth2/v3/certs'
        req = urllib.request.Request(jwks_url)
        with urllib.request.urlopen(req) as res:
            ret = res.read()
            jwk_jsons = json.loads(ret).get('keys')

        # 取得した公開鍵のうち解錠できるものを探す
        claims = None
        for jwk_json in jwk_jsons:
            public_key = RSAAlgorithm.from_jwk(jwk_json)
            # JWTトークンの署名を検証する
            try:
                claims = jwt.decode(id_token,
                                    public_key,
                                    issuer='https://accounts.google.com',
                                    audience=GOOGLE_API_CLIENT_ID,
                                    algorithms=["RS256"])
            except jwt.InvalidSignatureError:
                continue

        if claims is None:
            return _make_login_response(login_failed=True, alert_message='Googleでのログインに失敗しました')

        email=claims['email']
        name=claims['name']
        issuer=claims['iss']
        subject=claims['sub']

        # ユーザ管理者を取得する
        async with UnAuthzFinder() as ufactory:
            usr_admin_user = ufactory.load_usr_admin_user()
            # ユーザを取得する
            factory = await ufactory.create_authz_finder(usr_admin_user)
            user = factory.user.load_openid_user(email, name, issuer, subject)
            user_uuid = user.uuid

        # とりあえずライブラリ画面にリダイレクトする
        response = RedirectResponse(app.url_path_for('library'))
        # アクセストークンをCookieに格納してWebブラウザに渡す
        access_token = make_access_token(user_uuid)
        return _make_response_with_token(response, access_token)
