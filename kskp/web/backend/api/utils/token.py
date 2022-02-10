import os
import time
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from ... import SECURITY_LEVEL

# 環境変数からアクセストークンの有効期間(分)を取得する
# (設定値がない場合は5日とする)
_access_expire_timedelta = timedelta(minutes=int(os.getenv('STREAMCAT_ACCESS_TOKEN_EXPIRE_MIN', 5*24*60)))

# 環境変数からリフレッシュトークンの有効期間(日)を取得する
# (設定値がない場合は6ヶ月とする)
_refresh_expire_timedelta = timedelta(days=int(os.getenv('STREAMCAT_REFRESH_TOKEN_EXPIRE_DAYS', 6*30)))

# トークンの有効期限切れ迄の猶予時間(分)
# (アクセストークンの有効期間の半分とする)
_grace_seconds = (_access_expire_timedelta * 0.5).seconds

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
    return _make_token(user_uuid, _access_expire_timedelta)

def make_refresh_token(user_uuid):
    """
    リフレッシュトークンを作成する
    """
    return _make_token(user_uuid, _refresh_expire_timedelta)

def expired_soon(expire_time:int):
    """
    トークンの有効期限がもうすぐ切れる場合Trueを返す
    """
    # 
    # now     expired_soon       expire_time
    # |-----------|----(_grace_seconds)----|
    now_time = time.time()
    return now_time > expire_time - _grace_seconds

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
                options={'verify_signature': True})
    except jwt.exceptions.ExpiredSignatureError as e:
        # トークンの有効期限が切れている場合
        raise e
    except jwt.exceptions.InvalidSignatureError as e:
        # トークンの署名が不正な場合
        raise e
