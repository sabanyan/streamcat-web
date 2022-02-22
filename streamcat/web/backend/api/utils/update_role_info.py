import json
import functools
from flask import request, jsonify, g

def update_role_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        if request.args.get('members') != 'on':
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        result, status = func(**kwargs)
        result_json = json.loads(result.data.decode())

        # APIの異常終了時は情報を追加しない
        if not result_json['success']:
            return result, status

        # Role JSONに情報を追加する
        role_data = result_json['data']
        _update_role_info_inner(role_data)

        return jsonify(result_json), status
    return deco

def update_roles_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        if request.args.get('members') != 'on':
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        results, status = func(**kwargs)
        results_json = json.loads(results.data.decode())

        # APIの異常終了時は情報を追加しない
        if not results_json['success']:
            return results, status

        # Role JSONに情報を追加する
        for role_data in results_json['data']:
            _update_role_info_inner(role_data)

        return jsonify(results_json), status
    return deco

def _update_role_info_inner(role_data):
    role = g.factory.role.find_by_uuid(role_data['uuid'])
    role_data.update({'members' : role.get_joined_members()})
    return role_data
