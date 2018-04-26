from flask import Blueprint, request, session, jsonify
from .auth import login_required_api
from .model import start_project
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

    if request.json is None:
        return jsonify({'success': False, 'message': 'can not get json param'})
    params = request.json
    start_project(params['name'], session)

    # 正常終了
    return jsonify({'success': True})

# @api.route('/projects')
# @login_required_api
# def get_projects():
#     """
#     現在ログイン中のユーザが閲覧できるプロジェクト一覧を返却するAPI
#     """
#     return jsonify({'success': True})

@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': message})
