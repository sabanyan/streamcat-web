# 
# システム管理者向けのAPIを定義する
# 

from flask import Blueprint, request, g
from .auth import login_required_api
from .utils import api_base, RequestJson, update_user_info, update_users_info
mod = Blueprint('system', __name__)

# 
# User
# 

@mod.route('/users', methods=['GET'])
@login_required_api
@update_users_info
@api_base
def get_users():
    """
    全てのユーザ、またはキーワードに一致するユーザを返す
    """
    search_keyword = request.args.get('q')
    if search_keyword is None:
        return g.factory.user.find_all()
    else:
        return g.factory.user.find_by_keyword(search_keyword)

@mod.route('/users/<user_uuid>', methods=['GET'])
@login_required_api
@update_user_info
@api_base
def get_user(user_uuid):
    """
    ユーザを返却する
    """
    return g.factory.user.find_by_uuid(user_uuid)

@mod.route('/users', methods=['POST'])
@login_required_api
@api_base
def make_new_user():
    """
    ユーザを作成する
    """
    req = RequestJson(request.json)
    if not req.has_all('email', 'name'):
        raise Exception('email,name属性を指定してください')

    # passwordの指定がなければ自動生成する
    new_user = g.factory.user.create(email=req['email'], name=req['name'], password=req.get('password'))
    new_user.save()
    return new_user

@mod.route('/users/<user_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_user(user_uuid):
    """
    ユーザを修正する
    'password':Noneの場合はパスワードを自動生成する
    """
    req = RequestJson(request.json)
    if req.has_no_all('email', 'name') and not req.isnull('password') and not req.has('password'):
        raise Exception('email,nameまたはpassword属性を指定してください')

    user = g.factory.user.find_by_uuid(user_uuid)

    if req.has('email'):
        user = user.update_email(req['email'])
    if req.has('name'):
        user = user.update_name(req['name'])
    if req.has('password'):
        user = user.update_password(req['password'])
    elif req.isnull('password'):
        user = user.reset_password()

    return user

@mod.route('/users/<user_uuid>/undelete', methods=['PUT'])
@login_required_api
@api_base
def put_back_user(user_uuid):
    """
    論理削除されたユーザを登録状態に戻す
    """
    user = g.factory.user.find_by_uuid(user_uuid)
    return user.put_back()

@mod.route('/users/<user_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_user(user_uuid):
    """
    登録ユーザを論理削除する
    (仮登録ユーザは物理削除する)
    """
    user = g.factory.user.find_by_uuid(user_uuid)
    user.throw_away()

# 
# Role
# 

@mod.route('/roles', methods=['GET'])
@login_required_api
@api_base
def get_roles():
    """
    ユーザが所属するロールを返却する
    (ユーザが指定されていない場合は全てのロールを返却する)
    """
    if 'user' in request.args:
        # TODO: メソッド用意する必要あり
        user_uuid = request.args['user']
        pass
    else:
        return g.factory.role.find_all()

@mod.route('/roles/<role_uuid>', methods=['GET'])
@login_required_api
@api_base
def get_role(role_uuid):
    """
    ロールを返却する
    """
    return g.factory.role.find_by_uuid(role_uuid)

@mod.route('/roles', methods=['POST'])
@login_required_api
@api_base
def make_new_role():
    """
    ロールを作成する
    """
    req = RequestJson(request.json)
    if not req.has_all('name'):
        raise Exception('name属性を指定してください')

    new_role = g.factory.role.create(name=req['name'])
    new_role.save()
    return new_role

@mod.route('/roles/<role_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_role(role_uuid):
    """
    ロールを修正する
    """
    req = RequestJson(request.json)
    if req.has_no_all('name'):
        raise Exception('name属性を指定してください')

    role = g.factory.role.find_by_uuid(role_uuid)

    if role.has('name'):
        role = role.update_name(req['name'])        

    return role

@mod.route('/roles/<role_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_role(role_uuid):
    """
    ロールを削除する
    """
    role = g.factory.role.find_by_uuid(role_uuid)
    role.delete()

# 
# Member
# 

@mod.route('/members/<role_uuid>', methods=['GET'])
@login_required_api
@api_base
def get_members(role_uuid):
    """
    ロールに属するユーザを返却する
    (everyoneロールのUUIDを指定すれば全ユーザを返却する)
    """
    role = g.factory.role.find_by_uuid(role_uuid)
    return role.get_joined_users()

@mod.route('/members', methods=['GET'])
@login_required_api
@api_base
def get_out_of_members():
    """
    ロールに属さないユーザを返却する
         　~~~~~~~
    """
    if 'out_of_role' in request.args:
        # TODO: メソッド用意する必要あり
        pass
    else:
        raise Exception('No out_of_role parameter is designated')

@mod.route('/members', methods=['POST'])
@login_required_api
@api_base
def make_new_member():
    """
    ロールにユーザを追加する
    """
    req = RequestJson(request.json)
    if not req.has_all('role', 'user'):
        raise Exception('roke,user属性を指定してください')

    role = g.factory.role.find_by_uuid(req['role'])
    user = g.factory.user.find_by_uuid(req['user'])
    role.join_user(user)

@mod.route('/members', methods=['DELETE'])
@login_required_api
@api_base
def delete_member():
    """
    ロールからユーザを削除する
    """
    req = RequestJson(request.json)
    if not req.has_all('role', 'user'):
        raise Exception('roke,user属性を指定してください')

    role = g.factory.role.find_by_uuid(req['role'])
    user = g.factory.user.find_by_uuid(req['user'])
    role.leave_user(user)

# 
# Auth
# 

# -> 権限情報は、projects APIで取得・設定するようにする

@mod.route('/auths', methods=['GET'])
@login_required_api
@api_base
def get_auths():
    """
    Datumの権限情報を返却する
    """
    if 'datum' in request.args:
        # TODO: メソッド用意する必要あり
        return g.factory.role.find_by_datum_uuid(role_uuid)
    else:
        raise Exception('No datum parameter is designated')

@mod.route('/auths', methods=['PUT'])
@login_required_api
@api_base
def update_auth():
    """
    Datumの権限情報を修正する
    """
    pass

