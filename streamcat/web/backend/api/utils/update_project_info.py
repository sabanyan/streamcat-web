import json
import functools
from flask import request, jsonify, g

def update_project_info(func):
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

        # Project JSONに情報を追加する
        project_data = result_json['data']
        _update_project_info_inner(project_data)
        # サブプロジェクトにも情報を追加する
        for sub_project_data in result_json['data']['children']:
            _update_project_info_inner(sub_project_data)

        return jsonify(result_json), status
    return deco

def update_projects_info(func):
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

        # Project JSONに情報を追加する
        for project_data in results_json['data']['children']:
            _update_project_info_inner(project_data)

        return jsonify(results_json), status
    return deco

def update_projects_info2(func):
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

        # Project JSONに情報を追加する
        for project_data in results_json['data']:
            _update_project_info_inner(project_data)

        return jsonify(results_json), status
    return deco

def _update_project_info_inner(project_data):
    from streamcat.core import Datum
    from streamcat.store.auth import Role
    if g.factory.data.exists(project_data['uuid'], type=Datum.PROJECT_TYPE):
        project = g.factory.data.find_by_uuid(project_data['uuid'], type=Datum.PROJECT_TYPE)
        project_data.update({'members' : project.get_joined_members(except_role_uuid=Role.USR_ADMIN_ROLE_UUID)})
    return project_data
