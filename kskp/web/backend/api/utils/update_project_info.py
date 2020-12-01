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
        result = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not result['success']:
            return func(**kwargs)

        # Project JSONに情報を追加する
        project_data = result['data']
        _update_project_info_inner(project_data)
        # サブプロジェクトにも情報を追加する
        for sub_project_data in result['data']['children']:
            _update_project_info_inner(sub_project_data)

        return jsonify(result)
    return deco

def update_projects_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        if request.args.get('members') != 'on':
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not results['success']:
            return func(**kwargs)

        # Project JSONに情報を追加する
        for project_data in results['data']['children']:
            _update_project_info_inner(project_data)

        return jsonify(results)
    return deco

def update_projects_info2(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        if request.args.get('members') != 'on':
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not results['success']:
            return func(**kwargs)

        # Project JSONに情報を追加する
        for project_data in results['data']:
            _update_project_info_inner(project_data)

        return jsonify(results)
    return deco

def _update_project_info_inner(project_data):
    from kskp.core import Datum
    from kskp.store.auth import Role
    if g.factory.data.exists(project_data['uuid'], type=Datum.PROJECT_TYPE):
        project = g.factory.data.find_by_uuid(project_data['uuid'], type=Datum.PROJECT_TYPE)
        project_data.update({'members' : project.get_joined_members(except_role_uuid=Role.USR_ADMIN_ROLE_UUID)})
    return project_data
