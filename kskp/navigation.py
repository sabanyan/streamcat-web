from flask import (
    Blueprint, session, render_template, url_for, jsonify, request, redirect, flash
)
from . import model
import json

def update_navigation(func):
    def deco(**kwargs):
        user_id = session['user_id']
        project_uuid = request.args.get('project')

        navigation = {
            'user_id': user_id,
            'user_name': model.get_user_by_id(user_id)['name'],
            'project_uuid': project_uuid ,
            'project_name': model.get_project_name_by_uuid(project_uuid),
            'flow_uuid': '',
            'flow_name': ''
        }

        json_data = func(**kwargs).data.decode()
        data = json.loads(json_data)
        data['navigation'] = navigation
        return jsonify(data)
    return deco
