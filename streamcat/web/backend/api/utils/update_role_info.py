import functools

def update_role_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属Memberの情報を含めるか否か
        update_members = kwargs.get('members')

        # デコレート対象関数の呼び出し
        role = func(**kwargs)

        # 所属Memberの情報をRole JSONに追加する
        if update_members:
            return _inject_role(role, update_members)
        else:
            return role
    return deco

def update_roles_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属Memberの情報を含めるか否か
        update_members = kwargs.get('members')

        # デコレート対象関数の呼び出し
        roles = func(**kwargs)

        # 所属Memberの情報をRole JSONに追加する
        if update_members:
            return [_inject_role(role, update_members) for role in roles]
        else:
            return roles
    return deco

def _inject_role(role, update_members:bool):
    # Roleのto_json()を退避する
    role_to_json = role.to_json

    # Roleのto_json()が'members'も返すように変更する
    def to_json():
        ret = role_to_json()
        if update_members:
            ret['members'] = role.get_joined_members()
        return ret

    # Roleのto_json()を変更後のto_json()に置き換える
    role.to_json = to_json
    return role
