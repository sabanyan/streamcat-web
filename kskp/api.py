from flask import Blueprint, request, session, jsonify
from .auth import login_required_api
from .model import (
    start_project,
    get_projects_by_user_id,
    delete_project_by_uuid,
    get_project_id_by_uuid,
    create_flow
)
import uuid

api = Blueprint('api', __name__)

@api.route('/')
def api_root():
    return "I'm api root %s" % api.root_path

@api.route('/projects/new', methods=['POST'])
@login_required_api
def new_project():
    """
    新しいプロジェクトを作成するAPI
    """

    params = request.json
    start_project(params['name'], session)

    # 正常終了
    return jsonify({'success': True})

@api.route('/projects')
@login_required_api
def get_projects():
    """
    現在ログイン中のユーザが閲覧できるプロジェクト一覧を返却するAPI
    """

    projects = []
    for p in get_projects_by_user_id(session['user_id']):
        proj = {}
        proj['uuid'] = p['uuid']
        proj['name'] = p['name']
        proj['creator_name'] = p['creator_name']
        proj['created_at'] = p['created_at']
        projects.append(proj)

    return jsonify({'success': True, 'data': projects})


@api.route('/projects/<uuid>', methods=['DELETE'])
@login_required_api
def delete_project(uuid):
    """
    指定したプロジェクトを削除する
    """

    delete_project_by_uuid(uuid)

    return jsonify({'success': True})


@api.route('/flows/new', methods=['POST'])
@login_required_api
def new_flow():
    """
    新しいフローを作成する
    TODO: JSONに必要な項目があるかどうかのValidationを追加したい
    """

    j = request.json
    project_id = get_project_id_by_uuid(j['project_uuid'])

    # 指定されたUUIDを持つプロジェクトが存在しない場合はエラー
    if project_id is None:
        return jsonify({'success': False, 'message': 'invalid project uuid: (%s)' % j['project_uuid']})

    new_flow = create_flow(project_id, j['name'], j['data_source_name'])

    return jsonify({'success': True, 'data': new_flow})


@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': message})
