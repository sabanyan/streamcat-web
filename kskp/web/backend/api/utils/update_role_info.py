import json
import functools
from flask import request, jsonify, g

def update_role_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_users = request.args.get('users') == 'on'

        # デコレート対象関数の呼び出し
        result = json.loads(func(**kwargs).data.decode())

        if result['success']:
            role_data = result['data']
            # User JSONに情報を追加する
            _update_role_info_inner(role_data, update_users)

        return jsonify(result)
    return deco

def update_roles_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_users = request.args.get('users') == 'on'

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        if results['success']:
            # User JSONに情報を追加する
            for role_data in results['data']:
                _update_role_info_inner(role_data, update_users)

        return jsonify(results)
    return deco

def _update_role_info_inner(role_data, update_users):
    if update_users:
        role = g.factory.role.find_by_uuid(role_data['uuid'])
        role_data.update({'users' : role.get_joined_users()})
    return role_data
