import uuid
import jwt
from datetime import datetime, timedelta, timezone
from ... import SECURITY_LEVEL

# トークンを署名するための秘密鍵
# トークンを秘密鍵で署名して改竄を防ぐ
if SECURITY_LEVEL >= 2:
    # 秘密鍵をランダム文字列にする
    _SECRET = str(uuid.uuid4())
else:
    _SECRET = 'QZnpv2sNiiErzCNLebaHz*rzBtiPjCyf'

def _make_token(user_uuid:str, expiration_time:timedelta):
    """
    JWTトークンを作成する
    """
    # 'sub' : ユーザ識別子
    # 'exp' : 有効期限
    payload = {'sub':user_uuid, 'exp':datetime.now(timezone.utc)+expiration_time}
    return jwt.encode(payload, key=_SECRET, algorithm='HS256')

def make_access_token(user_uuid):
    """
    アクセストークンを作成する
    """
    return _make_token(user_uuid, timedelta(minutes=15))

def make_refresh_token(user_uuid):
    """
    リフレッシュトークンを作成する
    """
    return _make_token(user_uuid, timedelta(days=30*6))

def expired_soon(expire_time):
    """
    トークンの有効期限がもうすぐ切れる場合Trueを返す
    """
    after_time = datetime.timestamp(datetime.now(timezone.utc) + timedelta(minutes=10))
    return expire_time > after_time

def decode_token(token):
    """
    トークンからペイロードを取得する
    """
    if token is None:
        raise Exception('No token.')
    try:
        return jwt.decode(
                token,
                key=_SECRET,
                algorithms=['HS256'],
                options={"verify_signature": True})
    except jwt.exceptions.ExpiredSignatureError as e:
        # トークンの有効が切れている場合
        raise e
    except jwt.exceptions.InvalidSignatureError as e:
        # トークンの署名が不正な場合
        raise e
