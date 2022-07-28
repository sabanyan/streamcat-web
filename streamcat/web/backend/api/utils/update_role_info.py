import functools
from flask import request

def update_role_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属Memberの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        role = func(**kwargs)

        # 所属Memberの情報をRole JSONに追加する
        return _jsonify_role(role, update_members)
    return deco

def update_roles_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属Memberの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        roles = func(**kwargs)

        # 所属Memberの情報をRole JSONに追加する
        return [_jsonify_role(role, update_members) for role in roles]
    return deco

def _jsonify_role(role, update_members:bool):
    role_json = role.to_json()
    if update_members:
        role_json.update({'members': role.get_joined_members()})
        return role_json
    else:
        return role_json
