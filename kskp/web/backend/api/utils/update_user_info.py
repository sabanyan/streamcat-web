import json
import functools
from flask import request, jsonify, g

def update_user_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = request.args.get('roles') == 'on'

        # 所属プロジェクトの情報を含めるか否か
        update_projects = request.args.get('projects') == 'on'

        # デコレート対象関数の呼び出し
        result = json.loads(func(**kwargs).data.decode())

        if result['success']:
            user_data = result['data']
            # User JSONに情報を追加する
            _update_user_info_inner(user_data, update_roles, update_projects)

        return jsonify(result)
    return deco

def update_users_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = request.args.get('roles') == 'on'

        # 所属プロジェクトの情報を含めるか否か
        update_projects = request.args.get('projects') == 'on'

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        if results['success']:
            # User JSONに情報を追加する
            for user_data in results['data']:
                _update_user_info_inner(user_data, update_roles, update_projects)

        return jsonify(results)
    return deco

def _update_user_info_inner(user_data, update_roles, update_projects):
    user = None
    if update_roles:
        user = g.factory.user.find_by_uuid(user_data['uuid'])
        user_data.update({'roles' : user.get_joined_roles()})
    if update_projects:
        # 少なくとも1つの権限を有するプロジェクトを所属プロジェクトとする
        user = user or g.factory.user.find_by_uuid(user_data['uuid'])
        user_data.update({'projects' : user.get_joined_projects()})
    return user_data
