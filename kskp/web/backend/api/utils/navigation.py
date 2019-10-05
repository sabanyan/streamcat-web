import json
import functools
from flask import session, request, jsonify
from kskp.store import model, Datum, Flow, Folder

def update_navigation(func):
    @functools.wraps(func)
    def deco(**kwargs):

        # ブロック句
        if request.args.get('navigation') == 'off':
            return func(**kwargs)

        data = json.loads(func(**kwargs).data.decode())

        if session['user_id'] is None or session['user_id'] =='':
            user_name = ''
        else:
            user_name =  model.get_user_by_id(session['user_id'])['name']

        navigation = {
            'user_id': session['user_id'],
            'user_name': user_name,
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

            if Flow.exists(flow_uuid):
                flow = Flow.find_by_uuid(flow_uuid)
                parent_datum = Datum.find_parent(flow_uuid)
                parent = Folder.convert_to_folder(parent_datum)
                navigation['project_uuid'] = parent.uuid
                navigation['project_name'] = parent.label
                navigation['flow_uuid'] = flow_uuid
                navigation['flow_name'] = flow.label
            else:
                # この分岐に入るのは、お救いフローフォルダである
                flow = model.fetch_flow_by_uuid(flow_uuid)
                project = model.fecth_project(flow['projectId'])
                # navigation['project_uuid'] = RESQUE_FLOW_FOLDER_UUID
                # navigation['project_name'] = RESQUE_FLOW_FOLDER_LABEL
                navigation['project_uuid'] = ''
                navigation['project_name'] = ''
                navigation['flow_uuid'] = flow_uuid
                navigation['flow_name'] = flow['label']

        # プロジェクトが指定された場合
        elif 'project' in request.args:
            project_uuid = request.args['project']
            navigation['project_uuid'] = project_uuid
            project = Folder.find_by_uuid(project_uuid)
            navigation['project_name'] = project.label

        data['navigation'] = navigation
        return jsonify(data)
    return deco