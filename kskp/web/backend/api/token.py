from flask import (
    Blueprint,
    request,
    g
)
from .utils import (
    RequestJson,
    api_base,
    login_required_api,
    make_refresh_token,
    make_access_token
)
mod = Blueprint('token', __name__)

@mod.route('/tokens/refresh', methods=["POST"])
@login_required_api
@api_base
def get_refresh_token():
    """
    リフレッシュトークンを発給する
    """
    req = RequestJson(request.json)

    if not req.has('currentPassword'):
        raise Exception('現在のパスワードを指定してください')
    if not g.user.authenticate(req['currentPassword']):
        raise Exception('現在のパスワードが誤っています')

    return make_refresh_token(g.user.uuid)

@mod.route('/tokens/access', methods=["POST"])
@login_required_api
@api_base
def get_access_token():
    """
    アクセストークンを発給する
    """
    # アクセストークンを用いて新たなアクセストークンを
    # 発給できるが脆弱性にはならないだろう
    return make_access_token(g.user.uuid)
