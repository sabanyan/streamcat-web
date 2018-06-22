import json
import uuid
from pathlib import Path

from flask import Blueprint, request, session, jsonify
from .auth import login_required_api
from .model import (
    start_project,
    get_projects_by_user_id,
    delete_project_by_uuid,
    get_project_id_by_uuid,
    create_flow,
    delete_flow_by_uuid,
    fetch_flow_by_uuid,
    fetch_flows_by_project_uuid,
    update_flow_by_uuid
)

api = Blueprint('api', __name__)

DATAFRAME_DIR_PATH = api.root_path / Path('data/frames')

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

    new_flow = create_flow(project_id, j['name'], j['data_source_name'])

    return jsonify({'success': True, 'data': new_flow})

@api.route('/flows', methods=['GET'])
@login_required_api
def fecth_flows():
    """
    パラメータで指定されたプロジェクトが持つフローの一覧を取得する
    """
    return jsonify({'success': True, 'data': fetch_flows_by_project_uuid(request.args.get('project'))})


@api.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
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
        upload_frame(request)
        return jsonify({'success': True})
    elif 'from' in request.args:
        flow_uuid = request.args['from']
        return execute_flow(flow_uuid)
    else:
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'invalid json'
                        })


@api.route('/frames/<frame_uuid>')
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """

    file_path = DATAFRAME_DIR_PATH / Path('%s.csv' % frame_uuid)
    result = load_as_data_frame(file_path.read_text(encoding='utf-8'))

    return jsonify({'success': True, 'data': result})


@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})


def upload_frame(req):
    """
    CSVをアップロードする
    TODO: テスト未実施
    """
    f = req.files['file']
    file_name = req.form['file_name']

    from werkzeug.utils import secure_filename
    file_path = DATAFRAME_DIR_PATH / Path(secure_filename(file_name))
    f.save(file_path.as_posix())
    f.close()


def execute_flow(flow_uuid):

    # 指定されたIDのフローが存在するかどうかをチェックする
    # まずは、フローファイル一覧を取得する
    target_flow_file_path = get_flow_path(flow_uuid)

    if not target_flow_file_path:
        # ファイルが存在しないときはここを通る
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'flow does not exist'
                        })
    else:
        result_data = execute_flow_internal(target_flow_file_path.as_posix())
        if not result_data:
            return jsonify({
                                'success': False,
                                'code': -1,
                                'message': 'result is empty.'
                            })
        else:
            return jsonify({'success': True, 'data': result_data})


def execute_flow_internal(file_path):
    """
    指定されたファイル名を元にフローファイルを取得して、
    その結果をパースしてDataFrameの形にして返す
    """

    import engine
    engine.execute(file_path)

    # 決まった場所に結果が吐かれるので、それを読む
    result_path = Path(__file__).parent / Path('data/frames/_.csv')
    result_text = result_path.read_text(encoding='utf-8')

    # 結果のテキストの中身がカラだとパースできないのでここで終了
    # エラーとは限らない？？
    # エラー扱いするかどうかは未定
    if len(result_text) == 0:
        return False

    # 結果を縦型のdataframeっぽくパースして返す
    return load_as_data_frame(result_text)


def load_as_data_frame(result_text):
    """
    CSVの文字列を受け取り、
    いわゆるデータフレームの形式にして返す
    """
    result_list = [x for x in result_text.split('\n') if x != '']
    result_data = {}
    column_list = result_list[0].split(',')
    for column_name in column_list:
        result_data[column_name] = []

    for record in result_list[1:]:
        for idx, column_data in enumerate(record.split(',')):
            # print(column_list[idx])
            result_data[column_list[idx]].append(column_data)

    return result_data
