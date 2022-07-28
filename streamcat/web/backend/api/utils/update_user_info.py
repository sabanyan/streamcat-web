import functools
from flask import request

def update_user_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = request.args.get('roles') == 'on'

        # 所属プロジェクトの情報を含めるか否か
        update_projects = request.args.get('projects') == 'on'

        # デコレート対象関数の呼び出し
        user = func(**kwargs)

        # 所属ロールの情報と所属プロジェクトの情報をUser JSONに追加する
        return _jsonify_user(user, update_roles, update_projects)
    return deco

def update_users_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = request.args.get('roles') == 'on'

        # 所属プロジェクトの情報を含めるか否か
        update_projects = request.args.get('projects') == 'on'

        # デコレート対象関数の呼び出し
        users = func(**kwargs)

        # 所属ロールの情報と所属プロジェクトの情報をUser JSONに追加する
        return [_jsonify_user(user, update_roles, update_projects) for user in users]
    return deco

def _jsonify_user(user, update_roles:bool, update_projects:bool):
    user_json = user.to_json()
    if update_roles and update_projects:
        # 少なくとも1つの権限を有するプロジェクトを所属プロジェクトとする
        user_json.update({'roles': user.get_joined_roles(), 'projects': user.get_joined_projects()})
        return user_json
    elif update_roles:
        user_json.update({'roles': user.get_joined_roles()})
        return user_json
    elif update_projects:
        user_json.update({'projects': user.get_joined_projects()})
        return user_json
    else:
        return user_json
