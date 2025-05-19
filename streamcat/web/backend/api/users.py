# 
# システム管理者向けのAPIを定義する
# 

from fastapi import APIRouter, Request, Depends
from streamcat.store.finder import Finder
from .utils import (
    RequestJson,
    login_required_api,
    get_finder,
    jsonify,
    update_user_info,
    update_users_info,
    update_role_info,
    update_roles_info
)
router = APIRouter()

# 
# User
# 

@router.get('/users')
@login_required_api
@jsonify
@update_users_info
async def get_users(q:str=None, except_inactive=False, roles=False, projects=False, factory:Finder=Depends(get_finder)):
    """
    全てのユーザ、または指定したキーワードを含むユーザを取得する
    """
    search_keyword = q
    states = _get_except_states(except_inactive)
    if search_keyword is None:
        return factory.user.find_all(except_states=states)
    else:
        return factory.user.find_by_keyword(search_keyword, except_states=states)

@router.get('/users/self')
@login_required_api
@jsonify
@update_user_info
async def get_self(except_inactive=False, roles=False, projects=False, factory:Finder=Depends(get_finder)):
    """
    自身のユーザを取得する
    """
    states = _get_except_states(except_inactive)
    return factory.user.find_by_id(factory.myself.id, except_states=states)

@router.get('/users/{user_uuid}')
@login_required_api
@jsonify
@update_user_info
async def get_user(user_uuid, except_inactive=False, roles=False, projects=False, factory:Finder=Depends(get_finder)):
    """
    指定したユーザを取得する
    """
    states = _get_except_states(except_inactive)
    return factory.user.find_by_uuid(user_uuid, except_states=states)

@router.post('/users')
@login_required_api
@jsonify
async def make_new_user(request:Request, factory:Finder=Depends(get_finder)):
    """
    新しいユーザを作成する
    """
    req = RequestJson(await request.json())
    if not req.has_all('email', 'name'):
        raise Exception('email,name属性を指定してください')

    # passwordの指定がなければ自動生成する
    new_user = factory.user.create(email=req['email'], name=req['name'], password=req.get('password'))
    new_user.save()
    return new_user

@router.put('/users/self')
@login_required_api
@jsonify
async def update_self(request:Request, factory:Finder=Depends(get_finder)):
    """
    自身のユーザを変更する
    """
    req = RequestJson(await request.json())
    user = factory.user.find_by_id(factory.myself.id)

    if req.has('currentPassword'):
        if not user.authenticate(req['currentPassword']):
            raise Exception('現在のパスワードが誤っています')
    elif req.has_at_least('email','password') or req.isnull('password'):
        # emailまたはpasswordを変更する場合は、現在のパスワードによる認証が必要である
        raise Exception('現在のパスワードを指定してください')

    return _update_user_inner(user, req)

@router.put('/users/{user_uuid}')
@login_required_api
@jsonify
async def update_user(request:Request, user_uuid, factory:Finder=Depends(get_finder)):
    """
    指定したユーザを変更する
    'password':Noneの場合はパスワードを自動生成する
    """
    req = RequestJson(await request.json())
    user = factory.user.find_by_uuid(user_uuid)
    return _update_user_inner(user, req)

def _get_except_states(except_inactive:bool):
    if except_inactive:
        from streamcat.store.auth import User
        return [User.INACTIVE_STATE]
    else:
        return None

def _update_user_inner(user, req:RequestJson):
    from streamcat.store.auth import User
    if req.has_no_all('email', 'name', 'state', 'password') and not req.isnull('password'):
        raise Exception('email,name,stateまたはpassword属性を指定してください')
    if req.has('state') and req.get('state') != User.ACTIVE_STATE:
        raise Exception('state属性にactive以外の値を指定できません')
    if (req.has('password') or req.isnull('password')) and req.isnull('state'):
        raise Exception('passwordとstate属性は同時に指定できません')

    if req.has('email'):
        user = user.update_email(req['email'])
    if req.has('name'):
        user = user.update_name(req['name'])
    if req.has('password'):
        user = user.update_password(req['password'])
    elif req.isnull('password'):
        user = user.reset_password()
    elif req.get('state') == User.ACTIVE_STATE:
        # 指定したユーザを論理削除から登録状態に戻す
        user = user.put_back()

    return user

@router.delete('/users/{user_uuid}')
@login_required_api
@jsonify
async def delete_user(user_uuid, factory:Finder=Depends(get_finder)):
    """
    指定した登録状態のユーザを論理削除する
    (仮登録ユーザは物理削除する)
    """
    user = factory.user.find_by_uuid(user_uuid)
    user.throw_away()

# 
# Role
# 

@router.get('/roles')
@login_required_api
@jsonify
@update_roles_info
async def get_roles(members=False, factory:Finder=Depends(get_finder)):
    """
    全てのロールを取得する
    """
    return factory.role.find_all()

@router.get('/roles/{role_uuid}')
@login_required_api
@jsonify
@update_role_info
async def get_role(role_uuid, members=False, factory:Finder=Depends(get_finder)):
    """
    指定したロールを取得する
    """
    return factory.role.find_by_uuid(role_uuid)

@router.post('/roles')
@login_required_api
@jsonify
async def make_new_role(request:Request, factory:Finder=Depends(get_finder)):
    """
    新しいロールを作成する
    """
    req = RequestJson(await request.json())
    if not req.has_all('name'):
        raise Exception('name属性を指定してください')

    new_role = factory.role.create(name=req['name'])
    new_role.save()
    return new_role

@router.put('/roles/{role_uuid}')
@login_required_api
@jsonify
async def update_role(request:Request, role_uuid, factory:Finder=Depends(get_finder)):
    """
    指定したロールを変更する
    """
    from streamcat.store.auth import Role, NoRoleOwnerException

    req = RequestJson(await request.json())
    if req.has_no_all('name', 'members'):
        raise Exception('nameまたはmembers属性を指定してください')

    role = factory.role.find_by_uuid(role_uuid)

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
            user = factory.user.find_by_uuid(member_dict['uuid'])
            owner = member_dict['owner']
            members.append(Role.Member(user, owner))
        # 所有者が設定されない場合はエラーとする
        if not role.owner_exists(members):
            raise NoRoleOwnerException('所有者が設定されていません')
        # member属性で指定されたユーザを追加する
        role.init_members(members)

    return role

@router.delete('/roles/{role_uuid}')
@login_required_api
@jsonify
async def delete_role(role_uuid, factory:Finder=Depends(get_finder)):
    """
    指定したロールを削除する
    """
    role = factory.role.find_by_uuid(role_uuid)
    role.delete()

#
# Role-User
#

@router.put('/roles/sys_admin/users/{user_uuid}')
@login_required_api
@jsonify
async def join_user_to_sys_admin_role(user_uuid, factory:Finder=Depends(get_finder)):
    """
    システム管理者ロールにユーザを追加する
    """
    # システム管理者による、システム管理者の追加・削除は不可なので、owner=Falseでシステム管理者ロールに追加する
    sys_admin_role = factory.role.load_sys_admin_role()
    _join_user_to_role(factory, sys_admin_role.uuid, user_uuid, owner=False)

@router.put('/roles/usr_admin/users/{user_uuid}')
@login_required_api
@jsonify
async def join_user_to_usr_admin_role(user_uuid, factory:Finder=Depends(get_finder)):
    """
    ユーザ管理者ロールにユーザを追加する
    """
    # ユーザ管理者による、ユーザ管理者の追加・削除を可能とするため、owner=Trueでユーザ管理者ロールに追加する
    usr_admin_role = factory.role.load_usr_admin_role()
    _join_user_to_role(factory, usr_admin_role.uuid, user_uuid, owner=True)

@router.put('/roles/{role_uuid}/users/{user_uuid}')
@login_required_api
@jsonify
async def join_user_to_role(request:Request, role_uuid, user_uuid, factory:Finder=Depends(get_finder)):
    """
    ロールにユーザを追加する
    """
    req = RequestJson(await request.json())
    if not req.has_all('owner'):
        raise Exception('owner属性を指定してください')
    _join_user_to_role(factory, role_uuid, user_uuid, req['owner'])

def _join_user_to_role(factory:Finder, role_uuid, user_uuid, owner:bool):
    from streamcat.store.auth import Role, NoRoleOwnerException

    role = factory.role.find_by_uuid(role_uuid)
    user = factory.user.find_by_uuid(user_uuid)
    member = Role.Member(user, owner)

    # この所属によって、ロールに所有者が居なくなる場合はエラーとする
    if member.owner == False and role.is_last_owner(member.user):
        raise NoRoleOwnerException('この所属処理でロール所有者がいなくなります')

    role.join_member(member)

@router.delete('/roles/sys_admin/users/{user_uuid}')
@login_required_api
@jsonify
async def leave_user_outof_sys_admin_role(user_uuid, factory:Finder=Depends(get_finder)):
    """
    システム管理者ロールからユーザを削除する
    """
    from streamcat.store.auth import NoRoleOwnerException
    sys_admin_role = factory.role.load_sys_admin_role()
    _leave_user_outof_role(factory, sys_admin_role.uuid, user_uuid, raise_on_no_owner=False)

@router.delete('/roles/usr_admin/users/{user_uuid}')
@login_required_api
@jsonify
async def leave_user_outof_usr_admin_role(user_uuid, factory:Finder=Depends(get_finder)):
    """
    ユーザ管理者ロールからユーザを削除する
    """
    from streamcat.store.auth import NoRoleOwnerException
    usr_admin_role = factory.role.load_usr_admin_role()
    try:
        _leave_user_outof_role(factory, usr_admin_role.uuid, user_uuid)
    except NoRoleOwnerException:
        raise NoRoleOwnerException('ユーザー管理者権限を持つユーザがいなくなるのでこの操作はできません')

@router.delete('/roles/{role_uuid}/users/{user_uuid}')
@login_required_api
@jsonify
async def leave_user_outof_role(role_uuid, user_uuid, factory:Finder=Depends(get_finder)):
    """
    ロールからユーザを削除する
    """
    _leave_user_outof_role(factory, role_uuid, user_uuid)

def _leave_user_outof_role(factory:Finder, role_uuid, user_uuid, raise_on_no_owner=True):
    from streamcat.store.auth import NoRoleOwnerException

    role = factory.role.find_by_uuid(role_uuid)
    user = factory.user.find_by_uuid(user_uuid)

    # この脱退によって、ロールに所有者が居なくなる場合はエラーとする
    if raise_on_no_owner and role.is_last_owner(user):
        raise NoRoleOwnerException('この脱退処理でロール所有者がいなくなります')

    role.leave_member(user)

# 
# Project-Member
# 

@router.put('/projects/{project_uuid}/users/{user_uuid}')
@login_required_api
@jsonify
async def join_user_to_project(request:Request, project_uuid, user_uuid, factory:Finder=Depends(get_finder)):
    """
    プロジェクトにユーザを追加する
    """
    from streamcat.core import SavableDatum
    from streamcat.store import ProjectFolder

    req = RequestJson(await request.json())
    if not req.has_all('memberType'):
        raise Exception('memberTyp属性を指定してください')

    project = factory.data.find_by_uuid(project_uuid, type=SavableDatum.PROJECT_TYPE)
    user = factory.user.find_by_uuid(user_uuid)
    member = ProjectFolder.Member(user, req['memberType'])

    # この所属によって、プロジェクトに管理者が居なくなる場合(ユーザ管理者は除外)はエラーとする
    if member.type != ProjectFolder.OWNER_MEMBER_TYPE and project.is_last_owner(member.user):
        raise Exception('この所属処理でプロジェクト管理者がいなくなります')

    project.join_member(member)

@router.delete('/projects/{project_uuid}/users/{user_uuid}')
@login_required_api
@jsonify
async def leave_user_outof_project(project_uuid, user_uuid, factory:Finder=Depends(get_finder)):
    """
    プロジェクトからユーザを削除する
    """
    from streamcat.core import SavableDatum
    project = factory.data.find_by_uuid(project_uuid, type=SavableDatum.PROJECT_TYPE)
    user = factory.user.find_by_uuid(user_uuid)

    # この脱退によって、プロジェクトに管理者が居なくなる場合(ユーザ管理者は除外)はエラーとする
    if project.is_last_owner(user):
        raise Exception('この脱退処理でプロジェクト管理者がいなくなります')

    project.leave_member(user)
