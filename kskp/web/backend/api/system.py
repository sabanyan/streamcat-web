# 
# システム管理者向けのAPIを定義する
# 

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
    states = _get_except_states(request.args)
    if search_keyword is None:
        return g.factory.user.find_all(except_states=states)
    else:
        return g.factory.user.find_by_keyword(search_keyword, except_states=states)

@mod.route('/users/<user_uuid>', methods=['GET'])
@login_required_api
@update_user_info
@api_base
def get_user(user_uuid):
    """
    ユーザを返却する
    """
    states = _get_except_states(request.args)
    return g.factory.user.find_by_uuid(user_uuid, except_states=states)

@mod.route('/users/self', methods=['GET'])
@login_required_api
@update_user_info
@api_base
def get_self():
    """
    自分ユーザを返却する
    """
    states = _get_except_states(request.args)
    return g.factory.user.find_by_id(g.user.id, except_states=states)

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

    if req.has('currentPassword'):
        if not user.authenticate(req['currentPassword']):
            raise Exception('現在のパスワードが誤っています')
    elif req.has_at_least('email','password') or req.isnull('password'):
        # emailまたはpasswordを修正する場合は、現在のパスワードによる認証が必要である
        raise Exception('現在のパスワードを指定してください')

    return _update_user_inner(user, req)

def _get_except_states(request_args):
    if request_args.get('except_inactive') == 'on':
        from kskp.store.auth import User
        return [User.INACTIVE_STATE]
    else:
        return None

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
    from kskp.store.auth import Role, NoRoleOwnerException

    req = RequestJson(request.json)
    if req.has_no_all('name', 'members'):
        raise Exception('nameまたはmembers属性を指定してください')

    role = g.factory.role.find_by_uuid(role_uuid)

    # ロール名を変更する
    if req.has('name'):
        role = role.update_name(req['name'])

    # ロールにユーザを追加・削除する
    if req.has('members'):
        if not isinstance(req['members'], list):
            raise Exception('members属性にはユーザuuidの配列を指定してください')
        # member属性からMembersオブジェクトを作成する
        members = []
        for member_dict in req['members']:
            user = g.factory.user.find_by_uuid(member_dict['uuid'])
            owner = member_dict['owner']
            members.append(Role.Member(user, owner))
        # 所有者が設定されない場合はエラーとする
        if not role.owner_exists(members):
            raise NoRoleOwnerException('所有者が設定されていません')
        # member属性で指定されたユーザを追加する
        role.init_members(members)

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
    req = RequestJson(request.json)
    if not req.has_all('owner'):
        raise Exception('owner属性を指定してください')
    _join_user_to_role(role_uuid, user_uuid, req['owner'])

@mod.route('/roles/sys_admin/users/<user_uuid>', methods=['PUT'])
@login_required_api
@api_base
def join_user_to_sys_admin_role(user_uuid):
    """
    システム管理者ロールにユーザを追加する
    """
    # システム管理者による、システム管理者の追加・削除は不可なので、owner=Falseでシステム管理者ロールに追加する
    sys_admin_role = g.factory.role.load_sys_admin_role()
    _join_user_to_role(sys_admin_role.uuid, user_uuid, owner=False)

@mod.route('/roles/usr_admin/users/<user_uuid>', methods=['PUT'])
@login_required_api
@api_base
def join_user_to_usr_admin_role(user_uuid):
    """
    ユーザ管理者ロールにユーザを追加する
    """
    # ユーザ管理者による、ユーザ管理者の追加・削除を可能とするため、owner=Trueでユーザ管理者ロールに追加する
    usr_admin_role = g.factory.role.load_usr_admin_role()
    _join_user_to_role(usr_admin_role.uuid, user_uuid, owner=True)

def _join_user_to_role(role_uuid, user_uuid, owner):
    from kskp.store.auth import Role, NoRoleOwnerException

    role = g.factory.role.find_by_uuid(role_uuid)
    user = g.factory.user.find_by_uuid(user_uuid)
    member = Role.Member(user, owner)

    # この所属によって、ロールに所有者が居なくなる場合はエラーとする
    if member.owner == False and role.is_last_owner(member.user):
        raise NoRoleOwnerException('この所属処理でロール所有者がいなくなります')

    role.join_member(member)

@mod.route('/roles/<role_uuid>/users/<user_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def leave_user_outof_role(role_uuid, user_uuid):
    """
    ロールからユーザを削除する
    """
    _leave_user_outof_role(role_uuid, user_uuid)

@mod.route('/roles/sys_admin/users/<user_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def leave_user_outof_sys_admin_role(user_uuid):
    """
    システム管理者ロールからユーザを削除する
    """
    from kskp.store.auth import NoRoleOwnerException
    sys_admin_role = g.factory.role.load_sys_admin_role()
    _leave_user_outof_role(sys_admin_role.uuid, user_uuid, raise_on_no_owner=False)

@mod.route('/roles/usr_admin/users/<user_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def leave_user_outof_usr_admin_role(user_uuid):
    """
    ユーザ管理者ロールからユーザを削除する
    """
    from kskp.store.auth import NoRoleOwnerException
    usr_admin_role = g.factory.role.load_usr_admin_role()
    try:
        _leave_user_outof_role(usr_admin_role.uuid, user_uuid)
    except NoRoleOwnerException:
        raise NoRoleOwnerException('ユーザ管理者権限を持つユーザがいなくなるのでこの操作はできません')

def _leave_user_outof_role(role_uuid, user_uuid, raise_on_no_owner=True):
    from kskp.store.auth import NoRoleOwnerException

    role = g.factory.role.find_by_uuid(role_uuid)
    user = g.factory.user.find_by_uuid(user_uuid)

    # この脱退によって、ロールに所有者が居なくなる場合はエラーとする
    if raise_on_no_owner and role.is_last_owner(user):
        raise NoRoleOwnerException('この脱退処理でロール所有者がいなくなります')

    role.leave_member(user)

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

    # この所属によって、プロジェクトに管理者が居なくなる場合(ユーザ管理者は除外)はエラーとする
    if member.type != ProjectFolder.OWNER_MEMBER_TYPE and project.is_last_owner(member.user):
        raise Exception('この所属処理でプロジェクト管理者がいなくなります')

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

    # この脱退によって、プロジェクトに管理者が居なくなる場合(ユーザ管理者は除外)はエラーとする
    if project.is_last_owner(user):
        raise Exception('この脱退処理でプロジェクト管理者がいなくなります')

    project.leave_member(user)
