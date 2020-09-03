import json
import functools
from flask import request, jsonify, g

def update_role_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        if request.args.get('users') != 'on':
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        result = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not result['success']:
            return func(**kwargs)

        # Role JSONに情報を追加する
        role_data = result['data']
        _update_role_info_inner(role_data)

        return jsonify(result)
    return deco

def update_roles_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        if request.args.get('users') != 'on':
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not results['success']:
            return func(**kwargs)

        # Role JSONに情報を追加する
        for role_data in results['data']:
            _update_role_info_inner(role_data)

        return jsonify(results)
    return deco

def _update_role_info_inner(role_data):
    role = g.factory.role.find_by_uuid(role_data['uuid'])
    role_data.update({'users' : role.get_joined_users()})
    return role_data
