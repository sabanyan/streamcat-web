import json
import uuid
from pathlib import Path
from .engine.data3 import *
from flask import Blueprint, request, session, jsonify, send_from_directory, render_template
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils.api_base import api_base
from .model import (
    start_project,
    get_projects_by_user_id,
    delete_project_by_uuid,
    rename_project_by_uuid,
    get_project_id_by_uuid,
    create_flow,
    delete_flow_by_uuid,
    fetch_flow_by_uuid,
    fetch_flows_by_project_uuid,
    update_flow_by_uuid,
    get_flow_path_by_uuid,
    get_user_by_id,
    fetch_subflows_all_projects,
    get_flow_nodes_by_uuid,
    update_user_by_id,
    write_data_to_json,
    make_flow_path,
    copy_flow_by_uuid
)
from .lib import _get_library
# data3.pyのFrameクラスと名称を被らないようにAS別名を付ける
from .library import Frame as FrameDoc
from .library import Folder as FolderStore
from .utils.activity import (
    make_unfinished_history,
    make_finished_history
)
from datetime import datetime, timezone, timedelta
from . import app

api = Blueprint('api', __name__)

DATAFRAME_DIR_PATH = api.root_path / Path('data/frames')
JOBS_DIR_PATH = api.root_path / Path('data/jobs')
FLOWS_DIR_PATH = api.root_path / Path('data/flows')
FRAME_FOLDER_UUID = 'fffffd73-75d7-440f-b459-b49b3449d655'
FRAME_FOLDER_LABEL = 'フロー実行結果'
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

@api.route('/projects/<project_uuid>', methods=['PUT'])
@login_required_api
@update_navigation
def update_project(project_uuid):
    """
    指定したプロジェクトを更新する
    現在はプロジェクト名のみ
    """
    project_info = request.json
    new_project_name = project_info.get('new_name')
    rename_project_by_uuid(project_uuid, new_project_name)

    return jsonify({'success': True})

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
    # getで取ってくるとキーが存在しないときはNoneが返ってきて、project_idがNoneになるので
    # これでvalidationできていると言える？
    # 今の所project_uuid以外は必須ではない

    new_flow = {}

    if 'original_flow_uuid' in j:
        original_flow_path = get_flow_path_by_uuid(j.get('original_flow_uuid'))

        # ブロック句
        if not os.path.exists(original_flow_path):
            return jsonify({'success': False, 'message': 'not exist ' + original_flow_uuid })

        # コピー
        new_flow = copy_flow_by_uuid(j.get('original_flow_uuid'), session['user_id'])
    else:
        project_id = get_project_id_by_uuid(j.get('project_uuid'))

        # 指定されたUUIDを持つプロジェクトが存在しない場合はエラー
        if project_id is None:
            return jsonify({'success': False, 'message': 'invalid project uuid: (%s)' % j['project_uuid']})

        # frontendからcreate_flowに渡すものが増えてきたので、request.jsonを直接渡す。
        new_flow = create_flow(j, session['user_id'])

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

@api.route('/subflows', methods=['GET'])
@login_required_api
def fetch_subflows():
    """
    サブフロー一覧を取得する。
    """
    return jsonify({'success': True, 'data': fetch_subflows_all_projects(request.args)})

# @api.route('/subflows', methods=['POST'])
# @login_required_api
def execute_flow_by_add_inputs(request):
    """
    inputsを与えてexecute
    ファイルは必ずuploadするのでPathFileSourceでframeを作れる
    """
    flow_uuid = request.form.get('flow_uuid')
    flow_json = fetch_flow_by_uuid(flow_uuid)

    # executeの引数
    # no_contentsも入れれるけど、今はまぁいいか
    inputs = {}
    args = json.loads(request.form.get('args')) if request.form.get('args') else {}

    upload_file_list = []

    for port in flow_json['ports'][0]:
        frame_uuid = ''

        # frame（既にkskpに存在するデータソース）の場合
        if request.form.get(port['name']) is not None:
            # フレームを置き換える
            frame_uuid = request.form.get(port['name'])
            inputs[port['name']] = Frame(str(uuid.uuid4()), PathFileSource('csv', DATAFRAME_DIR_PATH , frame_uuid + '.csv'))
            continue

        # 新たにkskpにアップロードする場合
        file = request.files.get(port['name'])
        if file is not None:
            # ファイルアップロードして、フレームを置き換える
            frame_uuid = upload_frame(file, '')['uuid']
            inputs[port['name']] = Frame(str(uuid.uuid4()), PathFileSource('csv', DATAFRAME_DIR_PATH , frame_uuid + '.csv'))

            # 使うかわからないけど、uploadしたファイルを覚えておく
            upload_file_list.append(frame_uuid)
            continue

    # フローの実行
    result = execute_flow(flow_uuid, None, False, None, inputs, args, flow_label=flow_json['label'])

    return result

@api.route('/executableflows', methods=['POST'])
@login_required_api
def make_executable_flow():
    """
    サブフローとフレームを取得し、実行可能なフローを新規に作成する。
    とりあえず新規APIで作成したが、
    新しいフローが作成されるので、flowsのPOSTなのかなとは思う。
    このままでもいいが流石にexecutableflowsはダサいので、なんか考える。

    とりあえず、どうにでもなるようにエンドポイントは独立させておく。

    POSTなのでflow_uuidはbodyの中に入れてもらう。

    基本的には一時的なものなので、
    POSTで作成→frames?fromで実行→DELETEで削除してもらう
    """

    executable_flow = replace_inputs_upload_csv(request)
    new_flow_uuid = str(uuid.uuid4())

    # フローの作成
    write_data_to_json(make_flow_path(new_flow_uuid), executable_flow)

    return jsonify({'success': True, 'flow_uuid': new_flow_uuid})


def replace_inputs_upload_csv(request):
    """
    サブフローのインプットを置き換える
    ファイルアップロード
    """
    # 新フロー作成元のサブフロー取得
    flow_json = fetch_flow_by_uuid(request.form.get('flow_uuid'))

    # portsとnodesはリストなので、ここをfor文で回すのは仕方ないか？
    for input in flow_json['ports'][0]:
        frame = None
        for node in flow_json['nodes']:
            if node['id'] == input['name']:
                frame = node
                break

        # frame（既にkskpに存在するデータソース）の場合
        if request.form.get(input['name']) is not None:
            # フレームを置き換える
            frame['uuid'] = request.form.get(input['name'])
            continue

        # 新たにkskpにアップロードする場合
        file = request.files.get(input['name'])
        if file is not None:
            # ファイルアップロードして、フレームを置き換える
            frame['uuid'] = upload_frame(file, '')['uuid']
            continue

    # portsの中のものを削除する（portsのoは別に削除しなくてもいいが、念の為）
    flow_json['ports'][0].clear()
    flow_json['ports'][1].clear()

    # フロー名変更（何にしようか？、一時的とは言え、実行中はまだ削除されておらずフローが存在するので、誰かからみられることがあると思うので…）
    now = datetime.now()
    flow_json['label'] = flow_json['label'] + '(' + datetime.now(timezone(timedelta(hours=+9), 'JST')).strftime('%Y-%m-%d %H:%M:%S') + ')'

    # フローを返す
    return flow_json

@api.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """

    path = api.root_path / Path('data/commands')

    commands = []
    for command_path in path.iterdir():
        if not command_path.suffix == '.json':
            continue
        command_json = command_path.read_text(encoding='utf-8')
        command_data = json.loads(command_json)
        commands.append(command_data)

    return jsonify({'success': True, 'data': commands})

import time

@api.route('/visualizers')
def fetch_visualizers():
    """
    ビジュアライズ用コマンド定義の一覧を返す
    """

    path = api.root_path / Path('data/commands_for_visualizers')

    commands = []
    for command_path in path.iterdir():
        if not command_path.suffix == '.json':
            continue
        command_json = command_path.read_text(encoding='utf-8')
        command_data = json.loads(command_json)
        commands.append(command_data)

    return jsonify({'success': True, 'data': commands})

    # 現在はmsankeyを唯一の例として追加
    # visualizers = [
    #     {
    #         "id": "gridview",
    #         "params": [],
    #         "ports": [
    #             [
    #                 {
    #                     "name": "i",
    #                     "type": "frame"
    #                 }
    #             ],
    #             [
    #                 {
    #                     "name": "o",
    #                     "type": "html"
    #                 }
    #             ]
    #         ],
    #         "label": "表形式データの描画",
    #         "classification": "visualizer",
    #     },
    #     {
    #         "id": "msankey",
    #         "params": [
    #             {
    #                 "name": "f",
    #                 "type": "string",
    #                 "label": "枝データ上の2つの節点項目名"
    #             },
    #             {
    #                 "name": "v",
    #                 "type": "string",
    #                 "label": "枝の重み項目名"
    #             }
    #         ],
    #         "ports": [
    #             [
    #                 {
    #                     "name": "i",
    #                     "type": "frame"
    #                 }
    #             ],
    #             [
    #                 {
    #                     "name": "o",
    #                     "type": "html"
    #                 }
    #             ]
    #         ],
    #         "label": "sankeyダイアグラムの描画",
    #         "classification": "visualizer",
    #         "url": "https://www.nysol.jp/view/jp/sect-msankey.html"
    #     },
    #     {
    #         "id": "plaintextview",
    #         "params": [],
    #         "ports": [
    #             [
    #                 {
    #                     "name": "i",
    #                     "type": "string"
    #                 }
    #             ],
    #             [
    #                 {
    #                     "name": "o",
    #                     "type": "html"
    #                 }
    #             ]
    #         ],
    #         "label": "単純なテキスト表示",
    #         "classification": "visualizer",
    #     }
    # ]

    return jsonify({'success': True, 'data': visualizers})

@api.route('/frames', methods=['GET', 'POST'])
@login_required_api
def make_new_frame():
    """
    新しいframeを作成する
    方法は様々
    """
    # デフォルトはFalse
    no_contents = False

    if 'file' in request.files:
        if 'parent' in request.form and 'label' in request.form:
            try:
                # parentとlabel属性があれば新形式のPOST /framesだとみなす
                new_frame = FrameDoc(request.form.get('parent')
                                    , request.form.get('label')
                                    , request.files.get('file').stream
                                    , creator=session['user_id']
                                    , modifier=session['user_id'])
                # documentレコードをDBに格納する
                new_frame.save()
                return jsonify({'success': True, 'data': new_frame.to_json()})
            except Exception as e:
                return jsonify({
                                'success': False,
                                'code'   : -1,
                                'message': str(e)
                                })
        else:
            # ファイルがPOSTで送信されてきたらアップロードだとみなす
            frame = upload_frame(request.files.get('file'), request.form.get('file_name'))
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

        if request.args.get('no_contents'):
            no_contents = True

        limit = int(request.args.get('limit')) if request.args.get('limit') else None

        flow_json = fetch_flow_by_uuid(flow_uuid)

        result = execute_flow(flow_uuid, step_paths=step_id, no_contents=no_contents, limit=limit, flow_label=flow_json['label'])

        return result
    elif request.form.get('flow_uuid'):
        return execute_flow_by_add_inputs(request)
    else:
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'invalid json'
                        })

import os
import time

@api.route('/frames/<frame_uuid>')
@login_required_api
@api_base
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """
    # オフセットのデフォルトは最初から（なので０）
    offset = int(request.args.get('offset')) if request.args.get('offset') else 0
    limit = int(request.args.get('limit')) if request.args.get('limit') else None
    no_contents = True if request.args.get('no_contents') else False

    frame = FrameDoc.find_by_uuid(frame_uuid)
    file_path = frame.path if frame is not None else None

    if file_path is None:
        # ライブラリにフレームが無い場合は従来のフォルダ内を探す
        file_path = DATAFRAME_DIR_PATH / Path('%s.csv' % frame_uuid)
    else:
        # ライブラリにフレームが存在する場合はライブラリから取得する
        limit = 999 if limit is None else limit
        no_contents = request.args.get('no_contents') is not None
        file_path = Path(file_path)

    result = csv_to_frame(file_path, no_contents=no_contents, offset=offset, limit=limit)

    if request.args.get('header_only') == '1':
        # headerのカラムに改行コードが含まれているケースの対応
        headers = []
        for column in result['contents']:
            headers.append(column.replace('\n',''))
        result = headers

    return result

@api.route('/frames/<frame_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_frame(frame_uuid):
    """
    指定したframeのラベル名を変更する
    """
    label = request.json['label']
    modifier = session['user_id']
    return FrameDoc.update_data(frame_uuid, label, modifier)

@api.route('/frames/<frame_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_frame(frame_uuid):
    """
    指定したframeを物理削除する
    """
    frame = FrameDoc.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')
    frame.delete()
    return frame

def csv_to_frame(file_path, no_contents=False, offset=0, limit=None):
    """
    指定されたCSVファイルを読み込んで、
    詳細情報なども含んだframeを表すdictを返す
    """
    result = {}

    if not no_contents:
        contents, number_of_lines = load_as_data_frame(file_path, offset, limit)
        result['contents'] = contents
        # 行数は一旦返さないことにする
        # result['numberOfLines'] = number_of_lines
    result['fileSize'] = os.path.getsize(file_path)
    result['lastModifiedAt'] = format_time(file_path)

    return result

def format_time(file_path):
    """
    指定されたファイルの最終更新時間をyyyy/MM/dd HH:MMで返却する
    """
    wk = time.localtime(os.path.getmtime(file_path))
    return time.strftime('%Y/%m/%d %H:%M', wk)

def upload_frame(file, file_name):
    """
    CSVをアップロードする
    TODO: テスト未実施
    """
    frame_uuid = str(uuid.uuid4())

    from werkzeug.utils import secure_filename
    file_path = DATAFRAME_DIR_PATH / Path(secure_filename(frame_uuid + '.csv'))
    file.save(file_path.as_posix())
    file.close()

    return {"uuid": frame_uuid, "label": file_name}

@api.route('/files')
def download_file():
    # 現在typeは未使用
    type = request.args.get('type')
    frame_uuid = request.args.get('uuid')
    label = request.args.get('label', 'テスト')
    ext = request.args.get('ext')

    # タイムゾーンの設定
    # JST = timezone(timedelta(hours=+9), 'JST')
    # date = datetime.now(JST)


    frame = FrameDoc.find_by_uuid(frame_uuid)
    file_path = frame.path if frame is not None else None

    if file_path is None:
        # ライブラリにフレームが無い場合は従来のフォルダ内を探す

        # ダウンロードファイルの名前
        if frame_uuid == 'テスト':
            downloadFileName = frame_uuid  + '.' + ext
        else:
            downloadFileName = label + '.' + ext

        # ダウンロード対象のファイルの名前
        downloadFile = frame_uuid + '_sjis.' + ext
        sjis_path = DATAFRAME_DIR_PATH / downloadFile
        # sjis版がなかったらutf8版を落とす（今の所sjis版はオムロンさま専用なので）
        if not sjis_path.exists():
            downloadFile = frame_uuid + '.' + ext

        return send_from_directory(DATAFRAME_DIR_PATH, downloadFile, as_attachment = True,
                                   attachment_filename = downloadFileName, mimetype = 'text/csv')
    else:
        # ライブラリにフレームが存在する場合はライブラリから取得する
        dir_path = Path(api.root_path).parent / Path(os.path.dirname(file_path))
        file_name = os.path.basename(file_path)
        return send_from_directory(dir_path, file_name, as_attachment = True,
                                   attachment_filename = file_name, mimetype = 'text/csv')
        

def execute_flow(flow_uuid, step_paths, no_contents, limit=None, inputs={}, args={}, flow_label=None):

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
        try:
            result_data, caches_data = execute_flow_internal(flow_uuid, step_paths, no_contents, limit, inputs, args, flow_label=flow_label)
            if not result_data:
                return jsonify({
                                    'success': False,
                                    'code': -1,
                                    'message': 'result is empty.'
                                   })
            else:
                return jsonify({'success': True, 'name': result_data, 'caches': caches_data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                                'success': False,
                                'code': -1,
                                'message': str(e)
                            })

@api.route('/jobs', methods=['GET'])
@update_navigation
def jobs():
    """
    指定されたフローの実行結果を返す
    """
    count = 0
    execute_histories = []

    # jobsリストの作成
    for job_path in Path(JOBS_DIR_PATH).iterdir():
        if not job_path.suffix == '.json':
            continue
        data = json.loads(job_path.read_text(encoding='utf-8'))
        if 'flow' in request.args:
            if data['flow']['uuid'] == request.args['flow']:
                execute_histories.append(data)
        elif 'project' in request.args:
            if data['projectId'] == get_project_id_by_uuid(request.args['project']):
                execute_histories.append(data)
        else:
            execute_histories.append(data)

    # 並び順変更
    results = sorted(execute_histories, key = lambda x:x['executedAt'], reverse=True)

    # count処理
    if 'count' in request.args:
        count = int(request.args['count'])
        # countの値がおかしい場合、falseを返す
        if len(results) < count or count <= 0:
            return jsonify({'success': False})

        return jsonify({'success': True, 'data': results[count - 1 : count]})
    else:
        return jsonify({'success': True, 'data': results})

@api.route('/profile/<user_id>', methods=['GET'])
@login_required_api
@update_navigation
def fetch_profile(user_id):
    """
    プロフィール情報を返却する
    今のところ、
    ・ユーザ情報
    ・Grafana情報
    の2つ（どっちもusersテーブルにある）
    """
    user = get_user_by_id(user_id)
    profile = {}
    profile['name'] = user['name']
    profile['email'] = user['email']
    # profile['grafana_url'] = user['grafana_url']
    # profile['grafana_id'] = user['grafana_id']
    # profile['grafana_password'] = user['grafana_password']

    # --仮実装（Usersテーブルにgarafana列を追加するまでの間）--
    path = DATAFRAME_DIR_PATH.parent / Path('profile_update.json')
    profile_json = json.loads(path.read_text())
    profile['grafana_url'] = profile_json.get('url')
    profile['grafana_id'] = profile_json.get('id')
    profile['grafana_password'] = profile_json.get('password')
    # ----

    return jsonify({'success': True, 'data': profile})

@api.route('/profile/<user_id>', methods=['PUT'])
@login_required_api
def update_profile(user_id):
    """
    プロフィール情報を更新する
    今のところ、
    ・ユーザ情報
    ・Grafana情報
    の2つ（どっちもusersテーブルにある）
    """
    profile = request.json
    # update_user_by_id(user_id, profile)

    # --仮実装（Usersテーブルにgarafana列を追加するまでの間）--
    path = DATAFRAME_DIR_PATH.parent / Path('profile_update.json')
    profile_json = json.loads(path.read_text())

    # 条件分岐はmodel側に移行してもいいかも
    if profile.get('profile') is not None:
        update_user_by_id(user_id, profile.get('profile'))
    else:
        for key, value in profile.get('extension_tools').get('grafana').items():
            profile_json[key] = value
        path.write_text(json.dumps(profile_json, ensure_ascii=False, indent=2), encoding='utf-8')
    # ----

    return jsonify({'success': True})

@api.route('/caches', methods=['DELETE'])
@login_required_api
def delete_cache():
    frame_uuid = ''

    # パース
    ofs = request.args['of'].split('.')
    flow_uuid = ofs[0]
    datum_id = ofs[1]

    frame_name = DATAFRAME_DIR_PATH / ('caches_' + flow_uuid + '_' + datum_id + '.csv')

    p = FLOWS_DIR_PATH.joinpath(flow_uuid + '.json')
    j = json.loads(p.read_text(), encoding='utf-8')

    for i, node in enumerate(j['nodes']):
        if node['id'] == datum_id:
            frame_uuid = j['nodes'][i]['uuid']
            j['nodes'][i]['uuid'] = None
            j['nodes'][i]['cacheCreatedAt'] = None

            # キャッシュを削除する（増え続けると困るので）
            frame_path = DATAFRAME_DIR_PATH / (frame_uuid + '.csv')
            if frame_path.exists():
                frame_path.unlink()
            sjis_path = DATAFRAME_DIR_PATH / (frame_uuid + '_sjis.csv')
            if sjis_path.exists():
                sjis_path.unlink()

    update_flow_by_uuid(p.stem, j)

    return jsonify({'success': True})

import nysol.mcmd as nm

frames_path = Path('kskp/data/frames')

def execute_by_sensor(sensor, i):
    from nysol.mcmd import mavg, mstats

    state1 = nm.mavg(i=i, f=f'{sensor}:{sensor}_avg')
    state1 <<= nm.mcut(f=f'Time,{sensor}_avg')

    state2 = nm.mstats(i=i, c='sd', f=f'{sensor}:{sensor}_sd')
    state2 <<= nm.mcut(f=f'Time,{sensor}_sd')

    state3 = nm.mstats(i=i, c='max', f=f'{sensor}:{sensor}_max')
    state3 <<= nm.mcut(f=f'Time,{sensor}_max')

    state4 = nm.mstats(i=i, c='min', f=f'{sensor}:{sensor}_min')
    state4 <<= nm.mcut(f=f'Time,{sensor}_min')

    last = nm.mjoin(k='Time', i=state1, m=state2)
    last <<= nm.mjoin(k='Time', m=state3)
    last <<= nm.mjoin(k='Time', m=state4)

    return last

def execute_by_state(i, o=None):
    """ 状態ごとの処理 """
    sensors = ['3H', '3V', '4H', '4V']
    temp_uuid = str(uuid.uuid4())
    i_s = [f'state{s}_{temp_uuid}.csv' for s in sensors]
    i <<= nm.m2tee(o=','.join(i_s))

    # 全体の統計量
    s1 = execute_by_sensor('3H', i_s[0])
    s2 = execute_by_sensor('3V', i_s[1])
    s3 = execute_by_sensor('4H', i_s[2])
    s4 = execute_by_sensor('4V', i_s[3])

    last = nm.mjoin(k='Time', i=s1, m=s2)
    last <<= nm.mjoin(k='Time', m=s3)
    if o is None:
        last <<= nm.mjoin(k='Time', m=s4)
    else:
        last <<= nm.mjoin(k='Time', m=s4, o=o)

    return last

def execute_all_and_section(i, f, o1, o2):
    temp_uuid = str(uuid.uuid4())
    temp = frames_path.joinpath('all_and_section_' + temp_uuid + '.csv')
    state = nm.mcut(i=i, x=True, f=f)
    state <<= nm.m2tee(o=temp.as_posix())
    # state = nm.mcut(i=i, x=True, f=f)
    # state.run()

    # new_i = temp.as_posix()

    # temp2 = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
    # from nysol.mcmd import mbucket
    # sections = state.mbucket(f='Time:Section', n=10, rng=True, o=temp2.as_posix())
    # sections.run()
    o_sections = [f'{temp_uuid}_section_{x}.csv' for x in range(10)]
    sections = nm.mbucket(i=temp.as_posix(), f='Time:Section', n=10, rng=True, o=','.join(o_sections))

    # temp_secs = []
    secs = []
    for x in range(10):
        # temp_sec = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
        # sec1 = nm.mselstr(i=temp2.as_posix(), f='Section', v=x+1, o=temp_sec.as_posix())]
        # from nysol.mcmd import mselstr
        sec1 = nm.mselstr(i=o_sections[x], f='Section', v=x+1)
        # sec1.run()

        # sec2 = execute_by_state(temp_sec.as_posix())
        sec2 = execute_by_state(sec1)
        # temp_sec2 = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
        # sec2 <<= nm.msetstr(a='Section', v=x+1, o=temp_sec2.as_posix())
        sec2 <<= nm.msetstr(a='Section', v=x+1)
        # temp_secs.append(temp_sec2.as_posix())
        secs.append(sec2)
        # sec2.run()

    # return execute_by_state(new_i, o1), nm.mcat(i=','.join(temp_secs), o=o2), temp
    # return execute_by_state(state, o1), nm.mcat(i=secs, o=o2), temp
    return execute_by_state(state, o1), nm.mcat(stdin=True, i=secs), temp

@api.route('/execute-fifo')
def execute_fifo():
    t1 = time.time()
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()

    o1 = frames_path.joinpath('result_all1.csv')
    o2 = frames_path.joinpath('result_all2.csv')
    o3 = frames_path.joinpath('result_all3.csv')
    o4 = frames_path.joinpath('result_all4.csv')
    o5 = frames_path.joinpath('result_all5.csv')
    o1_sec = frames_path.joinpath('result_sec1.csv')
    o2_sec = frames_path.joinpath('result_sec2.csv')
    o3_sec = frames_path.joinpath('result_sec3.csv')
    o4_sec = frames_path.joinpath('result_sec4.csv')
    o5_sec = frames_path.joinpath('result_sec5.csv')

    state1, state_sec1, temp1 = execute_all_and_section(i, '0,1,2,3,4', o1.as_posix(), o1_sec.as_posix())
    state2, state_sec2, temp2 = execute_all_and_section(i, '0,5,6,7,8', o2.as_posix(), o2_sec.as_posix())
    state3, state_sec3, temp3 = execute_all_and_section(i, '0,9,10,11,12', o3.as_posix(), o3_sec.as_posix())
    state4, state_sec4, temp4 = execute_all_and_section(i, '0,13,14,15,16', o4.as_posix(), o4_sec.as_posix())
    state5, state_sec5, temp5 = execute_all_and_section(i, '0,17,18,19,20', o5.as_posix(), o5_sec.as_posix())

    o_all = frames_path.joinpath('last_all.csv').as_posix()
    i_s = [state1, state2, state3, state4, state5]
    last_all = nm.mcat(i=i_s, o=o_all)
    last_all.run()

    o_section = frames_path.joinpath('last_section.csv').as_posix()
    # for state_sec in [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]:
    #     state_sec.run()
    # i_s_sec = ','.join([o1_sec.as_posix(), o2_sec.as_posix(), o3_sec.as_posix(), o4_sec.as_posix(), o5_sec.as_posix()])
    i_s_sec = [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]
    last_section = nm.mcat(i=i_s_sec, o=o_section)
    last_section.run()

    for o in [o1, o2, o3, o4, o5]:
        o.unlink()
    for o in [o1_sec, o2_sec, o3_sec, o4_sec, o5_sec]:
        o.unlink()

    for o in [temp1, temp2, temp3, temp4, temp5]:
        o.unlink()

    t2 = time.time()

    return jsonify({'success': True, 'speed': str(t2 - t1)})

@api.route('/execute-direct')
def execute_direct():
    t1 = time.time()
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()

    o1 = frames_path.joinpath('result_all1.csv')
    o2 = frames_path.joinpath('result_all2.csv')
    o3 = frames_path.joinpath('result_all3.csv')
    o4 = frames_path.joinpath('result_all4.csv')
    o5 = frames_path.joinpath('result_all5.csv')
    o1_sec = frames_path.joinpath('result_sec1.csv')
    o2_sec = frames_path.joinpath('result_sec2.csv')
    o3_sec = frames_path.joinpath('result_sec3.csv')
    o4_sec = frames_path.joinpath('result_sec4.csv')
    o5_sec = frames_path.joinpath('result_sec5.csv')

    state1, state_sec1, temp1 = execute_all_and_section(i, '0,1,2,3,4', o1.as_posix(), o1_sec.as_posix())
    state2, state_sec2, temp2 = execute_all_and_section(i, '0,5,6,7,8', o2.as_posix(), o2_sec.as_posix())
    state3, state_sec3, temp3 = execute_all_and_section(i, '0,9,10,11,12', o3.as_posix(), o3_sec.as_posix())
    state4, state_sec4, temp4 = execute_all_and_section(i, '0,13,14,15,16', o4.as_posix(), o4_sec.as_posix())
    state5, state_sec5, temp5 = execute_all_and_section(i, '0,17,18,19,20', o5.as_posix(), o5_sec.as_posix())

    o_all = frames_path.joinpath('last_all.csv').as_posix()
    i_s = [state1, state2, state3, state4, state5]
    last_all = nm.mcat(i=i_s, o=o_all)
    last_all.run()

    o_section = frames_path.joinpath('last_section.csv').as_posix()
    i_s_sec = [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]
    # for state_sec in [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]:
    #     state_sec.run()
    # i_s_sec = ','.join([o1_sec.as_posix(), o2_sec.as_posix(), o3_sec.as_posix(), o4_sec.as_posix(), o5_sec.as_posix()])
    last_section = nm.mcat(i=i_s_sec, o=o_section)
    last_section.run()

    for o in [o1, o2, o3, o4, o5]:
        o.unlink()
    for o in [o1_sec, o2_sec, o3_sec, o4_sec, o5_sec]:
        o.unlink()

    for o in [temp1, temp2, temp3, temp4, temp5]:
        o.unlink()

    t2 = time.time()

    return jsonify({'success': True, 'speed': str(t2 - t1)})

@api.route('/execute-direct2')
def execute_direct2():
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()
    state = nm.mcut(i=i, x=True, f='0,1,2,3,4')
    allsection = frames_path.joinpath('allsection.csv').as_posix()
    state <<= nm.mbucket(rng=True, f='Time:Section', n=10, o=allsection)
    state.run()

    po1 = frames_path.joinpath('po1.csv').as_posix()
    state1 = nm.mselstr(i=allsection, f='Section', v=1, o=po1)
    state1.run()

    po2 = frames_path.joinpath('po2.csv').as_posix()
    state2 = nm.mselstr(i=allsection, f='Section', v=2, o=po2)
    state2.run()


    # 一回一回中間ファイルを吐くバージョン
    aq1 = frames_path.joinpath('aq1.csv').as_posix()
    new_state1 = execute_by_state(po1, o=aq1)
    new_state1.run()

    aq2 = frames_path.joinpath('aq2.csv').as_posix()
    new_state2 = execute_by_state(po2, o=aq2)
    new_state2.run()

    nm.mcat(i=f'{aq1},{aq2}', o=frames_path.joinpath('result.csv').as_posix()).run()

    # # できるだけ繋げるバージョン
    # new_state1 = execute_by_state(po1)
    # new_state2 = execute_by_state(po2)

    # nm.mcat(stdin=True, i=[new_state1, new_state2], o=frames_path.joinpath('result.csv').as_posix()).run()

    return jsonify({'success': True, 'data': 'execute-direct2'})

@api.route('/execute-direct3')
def execute_direct3():
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()
    o = frames_path.joinpath(str(uuid.uuid4()) + '.csv').as_posix()
    state = nm.mcut(i=i, x=True, f='0,1,2,3,4')
    state <<= nm.mbucket(rng=True, f='Time:Section', n=10)
    state <<= nm.mselstr(f='Section', v=1, o=o)
    state.run()

    return jsonify({'success': True, 'data': 'execute-direct3'})

def execute_flow_internal(flow_uuid, step_paths=None, no_contents=False, limit=None, inputs={}, args={}, flow_label=None):
    """
    指定されたファイル名を元にフローファイルを取得して、
    その結果をパースしてDataFrameの形にして返す
    """

    now = datetime.now()


    # フローの実行結果を格納するディレクトリパスを取得する
    frame_folder_path = get_frame_dir_path(session['user_id']).path

    @make_unfinished_history(now, session)
    @make_finished_history(now)
    def execute_flow_by_uuid(flow_uuid, inputs={}, args={}):
        from . import engine as e
        # data_path = (DATAFRAME_DIR_PATH / 'data').as_posix()
        with open(FLOWS_DIR_PATH.joinpath(f'{flow_uuid}.json'), 'r') as f:
            return e.execute(flow_uuid, f.read(), step_paths=step_paths, frames_path=frame_folder_path, flows_path=FLOWS_DIR_PATH.as_posix(), inputs=inputs)
    result = execute_flow_by_uuid(flow_uuid=flow_uuid, inputs=inputs, args=args)
    nodes_dict = get_flow_nodes_by_uuid(flow_uuid)

    # 出力されたデータフレームをライブラリに登録する
    for key, value in result['outputs'].items():
        label = flow_label + '_' + nodes_dict.get(key).get('label')
        file_path = os.path.join(frame_folder_path, value.uuid + '.csv')
        if os.path.isfile(file_path):
            new_frame = FrameDoc(FRAME_FOLDER_UUID
                                , label
                                , None
                                , creator=session['user_id']
                                , modifier=session['user_id'])
            # フレームのuuidはエンジン内で付番されたUUIDとする
            new_frame.uuid = value.uuid
            new_frame.regist(file_path)

    # 結果の処理
    if no_contents:
        result_list = [{'id':key, 'uuid':value.uuid, 'label':nodes_dict.get(key).get('label')} for key, value in result['outputs'].items()]
    else:
        result_list = [{'id':key, 'uuid':value.uuid, 'label':nodes_dict.get(key).get('label'), 'contents':value.contents(limit)} for key, value in result['outputs'].items()]

    return result_list, result['caches']


def load_as_data_frame(path_obj, offset, limit):
    """
    CSVの文字列を受け取り、
    いわゆるデータフレームの形式にして返す
    TODO: offsetはつかってない
    """

    # result_text ＝ path_obj.read_text()
    # result_list = [x for x in result_text.split('\n') if x != '']
    # result_len = len(result_list) - 1

    # if not result_list:
    #     return result_data, 0

    # # 重複文字があればインデックスをつける
    # column_list = replace_column_name(result_list[0].split(','))

    # # offset+1の1はヘッダを飛ばすため
    # start = 1 + offset
    # end = start + limit if limit is not None else result_len

    # for record in result_list[start:end]:
    #     for idx, column_data in enumerate(record.split(',')):
    #         # print(column_list[idx])
    #         result_data[column_list[idx]].append(column_data)

    result_text = ''
    result_data = {}
    column_list = []
    with path_obj.open(encoding='utf-8') as f:
        n = 0
        for line in f:
            if limit is not None and n > limit:
                break

            if n == 0:
                # 一行目はヘッダとみなす
                # 重複文字があればインデックスをつける
                column_list = replace_column_name(line.split(','))
                for column_name in column_list:
                    result_data[column_name] = []
            else:
                for idx, column_data in enumerate(line.split(',')):
                    result_data[column_list[idx]].append(column_data)

            n += 1

    if n == 0:
        raise Exception('空のCSVを読み込みました。コマンド実行時にエラーが発生した可能性があります。')

    result_len = n

    # 行数も返すように変更
    return result_data, result_len

def replace_column_name(column_list):
    """
    受け取ったカラム名リストに重複している列名があれば
    連番をつける
    """

    def check_column_overlap(column_list):
        """
        受け取ったカラム名リストを走査する
        """
        index_dict = {}
        column_name_overlap = False

        for index, column_name in enumerate(column_list):
            if not column_name in index_dict:
                index_dict[column_name] = []
            else:
                column_name_overlap = True
            index_dict[column_name].append((index, len(index_dict[column_name])))

        return index_dict, column_name_overlap

    index_dict, column_name_overlap = check_column_overlap(column_list)

    if not column_name_overlap:
        return column_list

    for column_name, tuple_list in index_dict.items():
        if len(tuple_list) < 2:
            continue

        for tuple in tuple_list:
            # tuple[0]　インデックス（column_listの）
            # tuple[1]　連番
            if tuple[1] > 0:
                column_list[tuple[0]] = column_name + '.' + str(tuple[1])

    return column_list

@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})

# visualize用のエンドポイント
# _init_.pyのappをインポートして此方で定義する（色々やりやすいので）
@app.route('/visualizers', methods=['POST'])
def visualizer():

    from .engine.core3 import internal_commands, Job, Step
    # visualizeコマンドの実行
    ### ここから
    # ここから
    new_inputs = {}

    frame_uuid = request.json.get('inputs')['i']
    frame = FrameDoc.find_by_uuid(frame_uuid)
    file_path = frame.path if frame is not None else None
    
    if file_path is None:
        # ライブラリにフレームが無い場合は従来のフォルダ内を探す
        new_inputs['i'] = Frame(str(uuid.uuid4()), PathFileSource('csv', DATAFRAME_DIR_PATH, request.json.get('inputs')['i'] + '.csv'))
    else:
        # ライブラリにフレームが存在する場合はライブラリから取得する
        new_inputs['i'] = Frame(str(uuid.uuid4()), PathFileSource('csv', Path(api.root_path).parent / Path(os.path.dirname(file_path)), os.path.basename(file_path)))


    command = internal_commands.get(request.args.get('from'))
    # 残りの２つの引数はsrcsとdsts
    new_step = Step(command, request.json.get('args'), {}, {})
    job = Job(new_step, new_inputs)
    # ここまでがengine.executeのparse部分にあたる

    result = job.execute()['o']
    # job.dtor()
    ### ここまでがengine.execute部分にあたる

    # テーブルコマンド
    if request.args.get('from') == 'csvtohtmltable':
        return render_template("visualize_table.html", header=result['header'], reader=result['reader'])

    # bokehのコマンド
    return render_template("visualize_component.html", script=result['script'], div=result['div'])

def get_frame_dir_path(user_id):
    try:
        # フレーム格納フォルダのUUIDは決め打ちである
        folder = FolderStore.find_by_uuid(FRAME_FOLDER_UUID)
    except Exception as e:
        # フレーム格納フォルダが無い場合は作成する
        root = _get_library(user_id)
        folder = FolderStore(root.uuid
                           , FRAME_FOLDER_LABEL
                           , user_id
                           , user_id)
        # Folderのコンストラクタで付番したUUIDを捨てて、フレーム格納フォルダのUUIDを格納する
        folder.uuid = FRAME_FOLDER_UUID
        folder.save()
    return folder