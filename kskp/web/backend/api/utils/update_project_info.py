import json
import functools
from flask import request, jsonify, g

def update_project_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_users = request.args.get('users') == 'on'

        # デコレート対象関数の呼び出し
        result = json.loads(func(**kwargs).data.decode())

        if result['success']:
            project_data = result['data']
            # User JSONに情報を追加する
            _update_project_info_inner(project_data, update_users)

        return jsonify(result)
    return deco

def update_projects_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_users = request.args.get('users') == 'on'

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        if results['success']:
            # User JSONに情報を追加する
            for project_data in results['data']:
                _update_project_info_inner(project_data, update_users)

        return jsonify(results)
    return deco

def _update_project_info_inner(project_data, update_users):
    from kskp.core import Datum
    if update_users:
        project = g.factory.data.find_by_uuid(project_data['uuid'], type=Datum.PROJECT_TYPE)
        project_data.update({'users' : project.get_joined_users()})
    return project_data
