# 
# システム管理者向けのAPIを定義する
# 

import re
from flask import Blueprint, request, g
from .auth import login_required_api
from .utils import (
    api_base,
    RequestJson,
    update_user_info,
    update_users_info,
    update_role_info,
    update_roles_info
)
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

@mod.route('/users/self', methods=['GET'])
@login_required_api
@update_user_info
@api_base
def get_self():
    """
    自分ユーザを返却する
    """
    return g.factory.user.find_by_id(g.user.id)

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
    user = g.factory.user.find_by_uuid(user_uuid)
    return _update_user_inner(user, req)

@mod.route('/users/self', methods=['PUT'])
@login_required_api
@api_base
def update_self():
    """
    自分ユーザを修正する
    """
    req = RequestJson(request.json)
    user = g.factory.user.find_by_id(g.user.id)

    if not req.has('currentPassword'):
        raise Exception('currentPassword属性を指定してください')
    if not user.authenticate(req['currentPassword']):
        raise Exception('現在のパスワードが誤っています')

    return _update_user_inner(user, req)

def _update_user_inner(user, req):
    if req.has_no_all('email', 'name') and not req.isnull('password') and not req.has('password'):
        raise Exception('email,nameまたはpassword属性を指定してください')

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
@update_roles_info
@api_base
def get_roles():
    """
    全てのロールを返却する
    """
    return g.factory.role.find_all()

@mod.route('/roles/<role_uuid>', methods=['GET'])
@login_required_api
@update_role_info
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
    if req.has_no_all('name', 'users'):
        raise Exception('nameまたはusers属性を指定してください')

    role = g.factory.role.find_by_uuid(role_uuid)

    # ロール名を変更する
    if req.has('name'):
        role = role.update_name(req['name'])

    # ロールにユーザを追加・削除する
    if req.has('users'):
        if not isinstance(req['users'], list):
            raise Exception('users属性にはユーザuuidの配列を指定してください')
        # users属性で指定されたユーザを追加する
        users = [g.factory.user.find_by_uuid(user_uuid) for user_uuid in req['users']]
        role.init_users(users)

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
# Role-User
#

@mod.route('/roles/<role_uuid>/users/<user_uuid>', methods=['PUT'])
@login_required_api
@api_base
def join_user_to_role(role_uuid, user_uuid):
    """
    ロールにユーザを追加する
    """
    role = g.factory.role.find_by_uuid(role_uuid)
    user = g.factory.user.find_by_uuid(user_uuid)
    role.join_user(user)

@mod.route('/roles/<role_uuid>/users/<user_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def leave_user_outof_role(role_uuid, user_uuid):
    """
    ロールからユーザを削除する
    """
    role = g.factory.role.find_by_uuid(role_uuid)
    user = g.factory.user.find_by_uuid(user_uuid)
    role.leave_user(user)

# 
# Project-Member
# 

@mod.route('/projects/<project_uuid>/users/<user_uuid>', methods=['PUT'])
@login_required_api
@api_base
def join_user_to_project(project_uuid, user_uuid):
    """
    プロジェクトにユーザを追加する
    """
    from kskp.core import Datum
    from kskp.store import ProjectFolder

    req = RequestJson(request.json)
    if not req.has_all('memberType'):
        raise Exception('memberTyp属性を指定してください')

    project = g.factory.data.find_by_uuid(project_uuid, type=Datum.PROJECT_TYPE)
    user = g.factory.user.find_by_uuid(user_uuid)
    member = ProjectFolder.Member(user, req['memberType'])
    project.join_member(member)

@mod.route('/projects/<project_uuid>/users/<user_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def leave_user_outof_project(project_uuid, user_uuid):
    """
    プロジェクトからユーザを削除する
    """
    from kskp.core import Datum
    project = g.factory.data.find_by_uuid(project_uuid, type=Datum.PROJECT_TYPE)
    user = g.factory.user.find_by_uuid(user_uuid)
    project.leave_member(user)
