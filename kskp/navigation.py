from flask import (
    Blueprint, session, render_template, url_for, jsonify, request, redirect, flash
)
from . import model
import json
import functools

def update_navigation(func):
    @functools.wraps(func)
    def deco(**kwargs):
        json_data = func(**kwargs).data.decode()
        data = json.loads(json_data)

        user_id = session['user_id']
<<<<<<< HEAD
        navigation = request.args.get('navigation')

        # ブロック句
        if navigation == 'off':
            return jsonify(data)
=======
>>>>>>> ed4ef5af51573df8585871a30da7e54910c1c020

        navigation = {
            'user_id': user_id,
            'user_name': model.get_user_by_id(user_id)['name'],
            'project_uuid': '',
            'project_name': '',
            'flow_uuid': '',
            'flow_name': ''
        }

        # 条件分岐がちょっと不安
        # flowとprojectが同時に指定されたときはひとまずフローを優先させるため
        # 一番上に書いている（フローの方がnavigationの値が細かいため優先した）
        # 実際にはflowとprojectが同時に指定されることはない想定

        # フローが指定された場合
        if 'flow' in request.args or 'flow_uuid' in kwargs:
            flow_uuid = request.args['flow'] if 'flow' in request.args else kwargs['flow_uuid']
            flow = model.fetch_flow_by_uuid(flow_uuid)
            project = model.fecth_project(flow['projectId'])
            navigation['project_uuid'] = project['uuid']
            navigation['project_name'] = project['name']
            navigation['flow_uuid'] = flow_uuid
            navigation['flow_name'] = flow['label']

        # プロジェクトが指定された場合
        elif 'project' in request.args:
            project_uuid = request.args['project']
            navigation['project_uuid'] = project_uuid
            navigation['project_name'] = model.get_project_name_by_uuid(project_uuid)

        data['navigation'] = navigation
        return jsonify(data)
    return deco
