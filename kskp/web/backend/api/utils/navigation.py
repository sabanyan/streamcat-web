import os
import json
import functools
from flask import request, jsonify, g

def update_navigation(func):
    @functools.wraps(func)
    def deco(**kwargs):

        # ブロック句
        if request.args.get('navigation') == 'off':
            return func(**kwargs)

        data = json.loads(func(**kwargs).data.decode())

        navigation = {
            'user_id': g.user.id,
            'user_name': g.user.name,
            'project_uuid': '',
            'project_name': '',
            'flow_uuid': '',
            'flow_name': '',
            'depo_name': os.environ.get('KSKP_DEPO') or 'Unit Test'
        }

        # 条件分岐がちょっと不安
        # flowとprojectが同時に指定されたときはひとまずフローを優先させるため
        # 一番上に書いている（フローの方がnavigationの値が細かいため優先した）
        # 実際にはflowとprojectが同時に指定されることはない想定

        # フローが指定された場合
        if 'flow' in request.args or 'flow_uuid' in kwargs:
            flow_uuid = request.args['flow'] if 'flow' in request.args else kwargs['flow_uuid']
            flow = g.factory.data.find_by_uuid(flow_uuid)
            parent = flow.find_parent()
            navigation['project_uuid'] = parent.uuid
            navigation['project_name'] = parent.label
            navigation['flow_uuid'] = flow_uuid
            navigation['flow_name'] = flow.label

        # プロジェクトが指定された場合
        elif 'project' in request.args:
            project_uuid = request.args['project']
            navigation['project_uuid'] = project_uuid
            project = g.factory.data.find_by_uuid(project_uuid)
            navigation['project_name'] = project.label

        data['navigation'] = navigation
        return jsonify(data)
    return deco