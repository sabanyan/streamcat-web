# TODO: 実装を進めていって、使い始めたものからコメントアウトしていく
import os
# import json
# import uuid
from pathlib import Path
# from .engine.data3 import *
from flask import Blueprint, request, session, jsonify, send_from_directory, render_template
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils.api_base import api_base
from kskp.store import *
from kskp.web.backend import app

mod = Blueprint('api', __name__)

@mod.route('/projects', methods=['POST'])
@login_required_api
@api_base
def new_project():
    """
    新しいプロジェクトを作成するAPI
    """
    # ルートフローフォルダが無ければ作成する
    root_flow_folder = get_flow_dir_path(session['user_id'])
    root_flow_folder_uuid = root_flow_folder.uuid

    # 新しいフローフォルダを作成する
    new_folder = Folder(root_flow_folder_uuid,
                        request.json['name'],
                        session['user_id'])
    new_folder.save()

@mod.route('/projects')
@login_required_api
@update_navigation
@api_base
def get_projects():
    """
    現在ログイン中のユーザが閲覧できるプロジェクト一覧を返却するAPI
    """
    # projects = []
    # for p in get_projects_by_user_id(session['user_id']):
    #     proj = {}
    #     proj['uuid'] = p['uuid']
    #     proj['name'] = p['name']
    #     proj['creator_id'] = p['creator_id']
    #     proj['creator_name'] = p['creator_name']
    #     proj['created_at'] = p['created_at']
    #     projects.append(proj)

    # ルートフローフォルダが無ければ作成する
    root_flow_folder = get_flow_dir_path(session['user_id'])
    root_flow_folder_uuid = root_flow_folder.uuid

    # FIXIT: 権限機能がないのでログインユーザに関係なく全てのプロジェクトが表示される
    projects = []

    for datum in Datum.find_by_parent_uuid(root_flow_folder_uuid):
        folder = Folder.convert_to_folder(datum)
        proj = {}
        proj['uuid'] = folder.uuid
        proj['name'] = folder.label
        proj['creator_id'] = folder.creator
        creator = get_user_by_id(folder.creator)
        proj['creator_name'] = creator['name'] if creator is not None else ''
        proj['created_at'] = folder.created_at_str
        projects.append(proj)

    return projects

@mod.route('/projects/<project_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_project(project_uuid):
    """
    指定したプロジェクトを削除する
    """
    folder = Folder.find_by_uuid(project_uuid)
    folder.delete()

@mod.route('/projects/<project_uuid>', methods=['PUT'])
@login_required_api
@update_navigation
@api_base
def update_project(project_uuid):
    """
    指定したプロジェクトを更新する
    現在はプロジェクト名のみ
    """
    new_project_name = request.json.get('new_name')
    Folder.update_data(project_uuid, new_project_name, session['user_id'])

@mod.route('/flows', methods=['POST'])
@login_required_api
@api_base
def new_flow():
    """
    新しいフローを作成する
    TODO: JSONに必要な項目があるかどうかのValidationを追加したい
    """

    j = request.json

    if 'original_flow_uuid' in j:
        original_flow = Flow.find_by_uuid(j.get('original_flow_uuid'))
        original_label = original_flow.label + ' のコピー'
        # 同じフォルダ内の他データと重複しないラベル名を取得する
        new_label = Datum.get_another_label_name(original_label, original_flow.parent_uuid)
        # フローを複製する
        new_flow = original_flow.duplicate(new_label, session['user_id'])
        # 複製したフローを保存する
        new_flow.save()
        return new_flow.flow_data
    else:
        parent_uuid = j.get('project_uuid')
        label = j.get('name')
        flow_data = create_flow(j, session['user_id'])
        # flowを作成する
        new_flow = Flow(parent_uuid,
                        label,
                        flow_data,
                        creator=session['user_id'])
        # flowをDBに格納する
        new_flow.save()
        return flow_data

@mod.route('/flows', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fecth_flows():
    """
    パラメータで指定されたプロジェクトが持つフローの一覧を取得する
    """
    flow_list = []

    parent_uuid = request.args.get('project')

    # projectが指定されていない場合は空のフロー一覧を返す
    if parent_uuid is None:
        return flow_list

    data = Datum.find_by_parent_uuid(parent_uuid)

    for datum in data:
        if datum.type != Datum.FLOW_TYPE:
            continue
        flow = Flow.convert_to_flow(datum)
        flow_data = flow.flow_data
        flow_data['uuid'] = flow.uuid
        flow_list.append(flow_data)

    # resque_flow_folder = get_resque_flow_dir_path(session['user_id'])

    # if resque_flow_folder.uuid == parent_uuid:
    #     # プロジェクトの指定は無視してローカルディレクトリのJSONファイルから全てのフローを取得する
    #     flow_list_from_jsons = fetch_flows_by_project_uuid(parent_uuid)
    #     flow_list.extend(flow_list_from_jsons)

    return flow_list


@mod.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_flow(flow_uuid):
    """
    指定されたフローを取得する
    """
    if Flow.exists(flow_uuid):
        flow = Flow.find_by_uuid(flow_uuid)
        return flow.flow_data
    else:
        return fetch_flow_by_uuid(flow_uuid)

@mod.route('/flows/<flow_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_flow(flow_uuid):
    """
    フローのラベルを修正する、またはフローを移動する
    """
    if 'parent' in request.json:
        if 'label' in request.json:
            raise Exception('labelとはparent属性は同時に指定できません')
        # frameを移動する
        new_parent = request.json['parent']
        modifier = session['user_id']
        flow = Flow.find_by_uuid(flow_uuid)
        return flow.move(new_parent, modifier)
    else:
        # 指定したフローの内容を渡されたdataの内容と結合する
        # 同じキーが含まれる場合は新しいもので上書きされる
        flow = Flow.find_by_uuid(flow_uuid)
        flow_data = flow.flow_data
        # フローエディタで指定するラベル名をフローのラベル名とする
        if 'label' not in request.json or request.json['label'] == '':
            flow_label = flow.label
        else:
            flow_label = request.json['label']

        flow_data.update(request.json)
        # 変更を保存する
        Flow.update_data(flow_uuid, flow_label, flow_data, session['user_id'])
        return flow_data

@mod.route('/flows/<flow_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_flow(flow_uuid):
    """
    指定されたフローを削除する
    """
    flow = Flow.find_by_uuid(flow_uuid)
    flow.delete()

@mod.route('/subflows', methods=['GET'])
@login_required_api
def fetch_subflows():
    """
    サブフロー一覧を取得する。
    """
    no_inputs  = request.args.get('no_inputs') == 'on'
    no_outputs = request.args.get('no_outputs') == 'on'

    subflow_data_list = []
    for subflow in Flow.find_all_subflows(no_inputs, no_outputs):
        subflow_data =  Flow.convert_to_flow(subflow).flow_data
        subflow_data['uuid'] = subflow.uuid
        # 親フォルダのラベルを取得する
        parent = Datum.find_parent(subflow.uuid)
        # 親フォルダのないサブフローは取得しない
        if parent is None:
            continue
        if parent.type == Datum.FOLDER_TYPE:
            parent_label = Folder.convert_to_folder(parent).label
            subflow_data['projectName'] = parent_label
        subflow_data_list.append(subflow_data)
    return jsonify({'success': True, 'data': subflow_data_list})

@mod.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """

    from kskp.store import CommandsPathFileSource, CommandsPathLink

    commands_list = []
    for visible_command in app.config['VISIBLE_COMMANDS_JSON']:
        link = CommandsPathLink(CommandsPathFileSource(visible_command))
        commands_list.extend(link.resolve())

    return jsonify({'success': True, 'data': commands_list})

@mod.route('/visualizers')
def fetch_visualizers():
    """
    ビジュアライズ用コマンド定義の一覧を返す
    """

    from kskp.store import CommandsPathFileSource, CommandsPathLink

    link = CommandsPathLink(CommandsPathFileSource('visualizers'))

    return jsonify({'success': True, 'data': link.resolve()})

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

@mod.route('/files')
def download_file():
    # 現在type, labelは未使用
    # type = request.args.get('type')
    frame_uuid = request.args.get('uuid')
    # label = request.args.get('label')
    ext = request.args.get('ext')

    frame = Frame.find_by_uuid(frame_uuid)
    frame_path = frame.path if frame is not None else None

    if frame_path is None:
        raise Exception('cannot find frame')

    character_code = os.getenv('FRAME_CHARACTER_CODE', 'utf-8')
    frame_label = frame.label

    def make_tmpfile_for_charactor_change(origin_file_path, encoding='utf-8', newline='\n'):
        """
        文字コード変更用のファイルを作り、そのパスを返す
        tmpなので、今の所はdbには登録しない。
        デフォルトはutf-8の形式
        """
        root_path = Datum.find_root().path
        tmp_dir = STORE_DIR.parent / root_path / 'download_tmp'
        if not tmp_dir.exists():
            tmp_dir.mkdir()

        path = tmp_dir / str(uuid.uuid4())
        with open(path, 'w', encoding=encoding, newline=newline) as f:
            with open(origin_file_path, encoding='utf-8') as origin_f:
                f.write(origin_f.read())
        return path

    try:
        dir_path = (STORE_DIR.parent / frame_path.parent).as_posix()
        frame_name = frame_path.name

        # 文字コードの指定があれば、その文字コードのファイルを作り、
        # そのあとに出来上がったファイルをダウンロードする
        #
        # 2019/6/28現在の一時的な仕様は下記の通り
        # 1. 現状kskp/data/tmpディレクトリに作成される
        # 2. tmpディレクトリ内に作成されたファイルは残ったまま
        # 3. 環境変数でダウンロードするファイルの文字コードを制御している
        if character_code == 'cp932':
            encode_file_path = make_tmpfile_for_charactor_change(STORE_DIR.parent / frame_path, 'cp932', '\r\n')
            dir_path = os.path.dirname(encode_file_path.as_posix())
            frame_name = os.path.basename(encode_file_path.as_posix())

        # ダウンロードファイルの拡張子を設定する
        if not frame_label.endswith('.csv') and not frame_label.endswith('.txt'):
            if ext is None or ext == '':
                frame_label = frame_label + '.csv'
            else:
                frame_label = frame_label + '.' + ext

        return send_from_directory(dir_path, frame_name, as_attachment = True,
                                    attachment_filename = frame_label, mimetype = 'text/csv')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': str(e)
                        })


@mod.route('/caches', methods=['DELETE'])
@login_required_api
def delete_cache():
    """
    キャッシュを削除する
    """
    frame_uuid = ''

    # パース
    ofs = request.args['of'].split('.')
    flow_uuid = ofs[0]
    datum_id = ofs[1]

    flow = Flow.find_by_uuid(flow_uuid)
    j = flow.flow_data

    for i, node in enumerate(j['nodes']):
        if node['id'] == datum_id:
            frame_uuid = j['nodes'][i]['uuid']
            j['nodes'][i]['uuid'] = None
            j['nodes'][i]['cacheCreatedAt'] = None

            # キャッシュを削除する（増え続けると困るので）
            frame = Frame.find_by_uuid(frame_uuid)
            if frame is not None:
                frame.delete()

    Flow.update_data(flow_uuid, flow.label, j, session['user_id'])

    return jsonify({'success': True})

@mod.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
