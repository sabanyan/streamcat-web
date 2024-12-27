import functools

def update_user_info(func):
    @functools.wraps(func)
    async def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = kwargs.get('roles')

        # 所属プロジェクトの情報を含めるか否か
        update_projects = kwargs.get('projects')

        # デコレート対象関数の呼び出し
        user = await func(**kwargs)

        if update_roles or update_projects:
            # 所属ロールの情報と所属プロジェクトの情報をUser JSONに追加する
            return _inject_roles_projects(user, update_roles, update_projects)
        else:
            return user
    return deco

def update_users_info(func):
    @functools.wraps(func)
    async def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = kwargs.get('roles')

        # 所属プロジェクトの情報を含めるか否か
        update_projects = kwargs.get('projects')

        # デコレート対象関数の呼び出し
        users = await func(**kwargs)

        if update_roles or update_projects:
            # 所属ロールの情報と所属プロジェクトの情報をUser JSONに追加する
            return [_inject_roles_projects(user, update_roles, update_projects) for user in users]
        else:
            return users
    return deco

def _inject_roles_projects(user, update_roles:bool, update_projects:bool):
    # Userのto_json()を退避する
    user_to_json = user.to_json

    # Userのto_json()が'roles'や'projects'も返すように変更する
    def to_json():
        ret = user_to_json()
        if update_roles:
            # 少なくとも1つの権限を有するプロジェクトを所属プロジェクトとする
            ret['roles'] = user.get_joined_roles()
        if update_projects:
            ret['projects'] = user.get_joined_projects()
        return ret

    # Userのto_json()を変更後のto_json()に置き換える
    user.to_json = to_json
    return user
