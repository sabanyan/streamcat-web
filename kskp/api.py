import json
import uuid
from pathlib import Path

from flask import Blueprint, request, session, jsonify, send_from_directory
from .auth import login_required_api
from .navigation import update_navigation
from .model import (
    start_project,
    get_projects_by_user_id,
    delete_project_by_uuid,
    get_project_id_by_uuid,
    create_flow,
    delete_flow_by_uuid,
    fetch_flow_by_uuid,
    fetch_flows_by_project_uuid,
    update_flow_by_uuid,
    get_flow_path_by_uuid,
    get_user_by_id
)
from .activity import (
    make_unfinished_history,
    make_finished_history
)
from datetime import datetime, timezone, timedelta

api = Blueprint('api', __name__)

DATAFRAME_DIR_PATH = api.root_path / Path('data/frames')
JOBS_DIR_PATH = api.root_path / Path('data/jobs')
FLOWS_DIR_PATH = api.root_path / Path('data/flows')

@api.route('/projects', methods=['POST'])
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
@update_navigation
def get_projects():
    """
    現在ログイン中のユーザが閲覧できるプロジェクト一覧を返却するAPI
    """

    projects = []
    for p in get_projects_by_user_id(session['user_id']):
        proj = {}
        proj['uuid'] = p['uuid']
        proj['name'] = p['name']
        proj['creator_id'] = p['creator_id']
        proj['creator_name'] = p['creator_name']
        proj['created_at'] = p['created_at']
        projects.append(proj)

    return jsonify({'success': True, 'data': projects})


@api.route('/projects/<project_uuid>', methods=['DELETE'])
@login_required_api
def delete_project(project_uuid):
    """
    指定したプロジェクトを削除する
    """

    delete_project_by_uuid(project_uuid)

    return jsonify({'success': True})


@api.route('/flows', methods=['POST'])
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

    new_flow = create_flow(project_id, j.get('name'), j.get('datasource'))

    return jsonify({'success': True, 'data': new_flow})

@api.route('/flows', methods=['GET'])
@login_required_api
@update_navigation
def fecth_flows():
    """
    パラメータで指定されたプロジェクトが持つフローの一覧を取得する
    """
    return jsonify({'success': True, 'data': fetch_flows_by_project_uuid(request.args.get('project'))})


@api.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@update_navigation
def fetch_flow(flow_uuid):
    """
    指定されたフローを取得する
    """
    return jsonify({'success': True, 'data': fetch_flow_by_uuid(flow_uuid)})


@api.route('/flows/<flow_uuid>', methods=['PUT'])
@login_required_api
def update_flow(flow_uuid):
    """
    指定されたフローを更新する
    """
    result = update_flow_by_uuid(flow_uuid, request.json)
    return jsonify({'success': True, 'data': result})


@api.route('/flows/<flow_uuid>', methods=['DELETE'])
@login_required_api
def delete_flow(flow_uuid):
    """
    指定されたフローを削除する
    """

    delete_flow_by_uuid(flow_uuid)

    return jsonify({'success': True})


@api.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """

    path = api.root_path / Path('data/commands')

    commands = []
    for command_path in path.iterdir():
        command_json = command_path.read_text(encoding='utf-8')
        command_data = json.loads(command_json)
        commands.append(command_data)

    return jsonify({'success': True, 'data': commands})


@api.route('/frames', methods=['GET', 'POST'])
def make_new_frame():
    """
    新しいframeを作成する
    方法は様々
    """

    if 'file' in request.files:
        # ファイルがPOSTで送信されてきたらアップロードだとみなす
        frame = upload_frame(request)
        return jsonify({'success': True, "data": frame})
    elif 'from' in request.args:
        if '.' in request.args['from']:
            # ドットで区切って、具体的に一つだけstepを指定することができる
            # TODO: 後々この部分は文法を拡張していく予定
            froms = request.args['from'].split('.')
            flow_uuid = froms[0]
            step_id = froms[1]
        else:
            flow_uuid = request.args['from']
            step_id = None
        return execute_flow(flow_uuid, step_paths=step_id)
    else:
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'invalid json'
                        })

import os
import time

@api.route('/frames/<frame_uuid>')
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """

    file_path = DATAFRAME_DIR_PATH / Path('%s.csv' % frame_uuid)
    return jsonify({'success': True, 'data': csv_to_frame(file_path)})

def csv_to_frame(file_path, no_contents=False):
    """
    指定されたCSVファイルを読み込んで、
    詳細情報なども含んだframeを表すdictを返す
    """
    result = {}
    contents, number_of_lines = load_as_data_frame(file_path.read_text(encoding='utf-8'))
    if not no_contents:
        result['contents'] = contents
    result['numberOfLines'] = number_of_lines
    result['fileSize'] = os.path.getsize(file_path)
    result['lastModifiedAt'] = format_time(file_path)

    return result

def format_time(file_path):
    """
    指定されたファイルの最終更新時間をyyyy/MM/dd HH:MMで返却する
    """
    wk = time.localtime(os.path.getmtime(file_path))
    return time.strftime('%Y/%m/%d %H:%M', wk)

def upload_frame(req):
    """
    CSVをアップロードする
    TODO: テスト未実施
    """
    f = req.files['file']
    file_name = req.form['file_name']
    frame_uuid = str(uuid.uuid4())

    from werkzeug.utils import secure_filename
    file_path = DATAFRAME_DIR_PATH / Path(secure_filename(frame_uuid))
    f.save(file_path.as_posix())
    f.close()

    return {"uuid": frame_uuid, "label": file_name}

@api.route('/files')
def download_frame():
    type = request.args.get('type')
    frame_uuid = request.args.get('uuid')
    ext = request.args.get('ext')

    # タイムゾーンの設定
    JST = timezone(timedelta(hours=+9), 'JST')
    date = datetime.now(JST)

    # ダウンロードファイルの名前
    downloadFileName = 'KSKP' + date.strftime("%Y%m%d%H%M") + '.' + ext
    # ダウンロード対象のファイルの名前
    downloadFile = frame_uuid + '.' + ext

    return send_from_directory(DATAFRAME_DIR_PATH, downloadFile, as_attachment = True,
                               attachment_filename = downloadFileName, mimetype = 'text/csv')

def execute_flow(flow_uuid, step_paths):

    # 指定されたIDのフローが存在するかどうかをチェックする
    # まずは、フローファイル一覧を取得する
    target_flow_file_path = get_flow_path_by_uuid(flow_uuid)

    if not target_flow_file_path:
        # ファイルが存在しないときはここを通る
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'flow does not exist'
                        })
    else:
        result_data = execute_flow_internal(flow_uuid, step_paths)
        if not result_data:
            return jsonify({
                                'success': False,
                                'code': -1,
                                'message': 'result is empty.'
                            })
        else:
            return jsonify({'success': True, 'name': result_data})


@api.route('/jobs', methods=['GET'])
@update_navigation
def jobs():
    """
    指定されたフローの実行結果を返す
    """
    count = 0
    execute_histories = []

    for job_path in Path(JOBS_DIR_PATH).iterdir():
        data = json.loads(job_path.read_text(encoding='utf-8'))
        if 'flow' in request.args:
            if data['flow']['uuid'] == request.args['flow']:
                execute_histories.append(data)
        elif 'project' in request.args:
            if data['projectId'] == get_project_id_by_uuid(request.args['project']):
                execute_histories.append(data)
        else:
            execute_histories.append(data)

    results = sorted(execute_histories, key = lambda x:x['executedAt'], reverse=True)

    if 'count' in request.args:
        count = int(request.args['count'])
        # countの値がおかしい場合、falseを返す
        if len(results) < count or count <= 0:
            return jsonify({'success': False})

        return jsonify({'success': True, 'data': results[count - 1 : count]})
    # countがある場合でもない場合でも、等しく正しい結果を返すのでそれを強調する為else句を使っている
    else:
        return jsonify({'success': True, 'data': results})


def execute_flow_internal(flow_uuid, step_paths=None):
    """
    指定されたファイル名を元にフローファイルを取得して、
    その結果をパースしてDataFrameの形にして返す
    """

    now = datetime.now()

    @make_unfinished_history(now)
    @make_finished_history(now)
    def execute_flow_by_uuid(flow_uuid):
        from . import engine as e
        with open(f'/kskp/data/flows/{flow_uuid}.json', 'r') as f:
            return e.execute(flow_uuid, f.read(), step_paths=step_paths, frames_path='/kskp/data/frames', flows_path='/kskp/data/flows')

    # try:
    #     result = execute_flow_by_uuid(flow_uuid)
    # except Exception as e:
    #     # とりあえずの例外処理
    #     # 何か例外が起こった時、実行中状態の履歴ファイルが無意味に残るのが嫌なので
    #     # history_file_path.unlink()
    #     print(e)
    #     result = {}

    result = execute_flow_by_uuid(flow_uuid)

    return list(result.keys())


def load_as_data_frame(result_text):
    """
    CSVの文字列を受け取り、
    いわゆるデータフレームの形式にして返す
    """
    result_list = [x for x in result_text.split('\n') if x != '']
    result_data = {}

    if not result_list:
        return result_data, 0

    column_list = result_list[0].split(',')
    for column_name in column_list:
        result_data[column_name] = []

    for record in result_list[1:]:
        for idx, column_data in enumerate(record.split(',')):
            # print(column_list[idx])
            result_data[column_list[idx]].append(column_data)

    # 行数も返すように変更
    return result_data, len(result_list) - 1

@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
