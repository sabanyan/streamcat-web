import json
import functools
from flask import request, jsonify, g

def update_project_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        result = json.loads(func(**kwargs).data.decode())

        if result['success']:
            project_data = result['data']
            # Project JSONに情報を追加する
            _update_project_info_inner(project_data, update_members)

        return jsonify(result)
    return deco

def update_projects_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        if results['success']:
            # Project JSONに情報を追加する
            for project_data in results['data']['children']:
                _update_project_info_inner(project_data, update_members)

        return jsonify(results)
    return deco

def _update_project_info_inner(project_data, update_members):
    from kskp.core import Datum
    if update_members:
        if g.factory.data.exists(project_data['uuid'], type=Datum.PROJECT_TYPE):
            project = g.factory.data.find_by_uuid(project_data['uuid'], type=Datum.PROJECT_TYPE)
            project_data.update({'members' : project.get_joined_members()})
    return project_data
