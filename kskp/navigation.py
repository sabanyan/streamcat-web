from flask import (
    Blueprint, session, render_template, url_for, jsonify, request, redirect, flash
)
from . import model
import json
import functools

def update_navigation_user(func):
    @functools.wraps(func)
    def deco(**kwargs):
        json_data = func(**kwargs).data.decode()
        data = json.loads(json_data)

        user_id = session['user_id']
        project_uuid = request.args.get('project')
        navigation = request.args.get('navigation')
        if navigation != 'off':
            navigation = {
                'user_id': user_id,
                'user_name': model.get_user_by_id(user_id)['name'],
                'project_uuid': '',
                'project_name': '',
                'flow_uuid': '',
                'flow_name': ''
            }
            data['navigation'] = navigation
        return jsonify(data)
    return deco


def update_navigation_project(func):
    @functools.wraps(func)
    def deco(**kwargs):
        json_data = func(**kwargs).data.decode()
        data = json.loads(json_data)

        user_id = session['user_id']
        project_uuid = request.args.get('project')
        navigation = request.args.get('navigation')
        if navigation != 'off':
            navigation = {
                'user_id': user_id,
                'user_name': model.get_user_by_id(user_id)['name'],
                'project_uuid': project_uuid ,
                'project_name': model.get_project_name_by_uuid(project_uuid),
                'flow_uuid': '',
                'flow_name': ''
            }
            data['navigation'] = navigation
        return jsonify(data)
    return deco


def update_navigation_flow(func):
    @functools.wraps(func)
    def deco(**kwargs):
        json_data = func(**kwargs).data.decode()
        data = json.loads(json_data)

        user_id = session['user_id']
        flow_uuid = request.args['flow'] if 'flow' in request.args else kwargs['flow_uuid']
        flow = model.fetch_flow_by_uuid(flow_uuid)
        project = model.fecth_project(flow['projectId'])

        navigation = request.args.get('navigation')
        if navigation != 'off':
            navigation = {
                'user_id': user_id,
                'user_name': model.get_user_by_id(user_id)['name'],
                'project_uuid': project['uuid'],
                'project_name': project['name'],
                'flow_uuid': flow_uuid,
                'flow_name': flow['label']
            }
            data['navigation'] = navigation

        return jsonify(data)
    return deco
