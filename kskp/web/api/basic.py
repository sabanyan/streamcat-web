# TODO: 実装を進めていって、使い始めたものからコメントアウトしていく
import os
# import json
# import uuid
from pathlib import Path
# from .engine.data3 import *
from flask import Blueprint, request, session, jsonify, send_from_directory, render_template
from .auth import login_required_api
from .utils.navigation import update_navigation
from kskp.store import *
from kskp.web import app

mod = Blueprint('api', __name__)

@mod.route('/projects', methods=['POST'])
@login_required_api
def new_project():
    """
    新しいプロジェクトを作成するAPI
    """
    params = request.json
    start_project(params['name'], session)

    # 正常終了
    return jsonify({'success': True})

@mod.route('/projects')
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

@mod.route('/projects/<project_uuid>', methods=['DELETE'])
@login_required_api
def delete_project(project_uuid):
    """
    指定したプロジェクトを削除する
    """

    delete_project_by_uuid(project_uuid)

    return jsonify({'success': True})

@mod.route('/projects/<project_uuid>', methods=['PUT'])
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


@mod.route('/flows', methods=['POST'])
@login_required_api
def new_flow():
    """
    新しいフローを作成する
    TODO: JSONに必要な項目があるかどうかのValidationを追加したい
    """

    j = request.json

    new_flow = {}

    if 'original_flow_uuid' in j:
        # フローのコピー
        original_flow_path = get_flow_path_by_uuid(j.get('original_flow_uuid'))
        # 指定されたUUIDを持つフローが存在しない場合はエラー
        if not os.path.exists(original_flow_path):
            return jsonify({'success': False, 'message': 'not exist ' + original_flow_uuid })
        new_flow = copy_flow_by_uuid(j.get('original_flow_uuid'), session['user_id'])
    else:
        # フローの新規作成
        project_id = get_project_by_uuid(j.get('project_uuid'))['id']
        # 指定されたUUIDを持つプロジェクトが存在しない場合はエラー
        if project_id is None:
            return jsonify({'success': False, 'message': 'invalid project uuid: (%s)' % j['project_uuid']})
        new_flow = create_flow(j, session['user_id'])

    return jsonify({'success': True, 'data': new_flow})

@mod.route('/flows', methods=['GET'])
@login_required_api
@update_navigation
def fecth_flows():
    """
    パラメータで指定されたプロジェクトが持つフローの一覧を取得する
    """
    return jsonify({'success': True, 'data': fetch_flows_by_project_uuid(request.args.get('project'))})

@mod.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@update_navigation
def fetch_flow(flow_uuid):
    """
    指定されたuuidのフローを取得する
    """
    return jsonify({'success': True, 'data': fetch_flow_by_uuid(flow_uuid)})

@mod.route('/flows/<flow_uuid>', methods=['PUT'])
@login_required_api
def update_flow(flow_uuid):
    """
    指定されたフローを更新する
    """
    result = update_flow_by_uuid(flow_uuid, request.json)
    return jsonify({'success': True, 'data': result})


@mod.route('/flows/<flow_uuid>', methods=['DELETE'])
@login_required_api
def delete_flow(flow_uuid):
    """
    指定されたフローを削除する
    """

    delete_flow_by_uuid(flow_uuid)

    return jsonify({'success': True})

@mod.route('/subflows', methods=['GET'])
@login_required_api
def fetch_subflows():
    """
    サブフロー一覧を取得する。
    """
    return jsonify({'success': True, 'data': fetch_subflows_all_projects(request.args)})


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


@mod.route('/files')
def download_file():
    # 現在typeは未使用
    type = request.args.get('type')
    frame_uuid = request.args.get('uuid')
    label = request.args.get('label')
    ext = request.args.get('ext')

    frame = FrameModel.find_by_uuid(frame_uuid)
    file_path = frame.path if frame is not None else None

    character_code = os.getenv('FRAME_CHARACTER_CODE', 'utf-8')

    if file_path is None:
        raise Exception('cannot find frame')
    else:

        def make_tmpfile_for_charactor_change(origin_file_path, encoding='utf-8', newline='\n'):
            """
            文字コード変更用のファイルを作り、そのパスを返す
            tmpなので、今の所はdbには登録しない。
            デフォルトはutf-8の形式
            """
            path = Path(mod.root_path).parent.parent / Path('data/tmp') / str(uuid.uuid4())
            with open(path, 'w', encoding=encoding, newline=newline) as f:
                with open(origin_file_path, encoding='utf-8') as origin_f:
                    f.write(origin_f.read())
            return path

        try:
            dir_path = Path(mod.root_path).parent.parent / Path('data')
            file_name = os.path.basename(file_path)

            # 文字コードの指定があれば、その文字コードのファイルを作り、
            # そのあとに出来上がったファイルをダウンロードする
            #
            # 2019/6/28現在の一時的な仕様は下記の通り
            # 1. 現状kskp/data/tmpディレクトリに作成される
            # 2. tmpディレクトリ内に作成されたファイルは残ったまま
            # 3. 環境変数でダウンロードするファイルの文字コードを制御している
            if character_code == 'cp932':
                encode_file_path = make_tmpfile_for_charactor_change(file_path, 'cp932', '\r\n')
                dir_path = os.path.dirname(encode_file_path.as_posix())
                file_name = os.path.basename(encode_file_path.as_posix())

            return send_from_directory(dir_path, file_name, as_attachment = True,
                                       attachment_filename = label, mimetype = 'text/csv')
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

    p = Path(mod.root_path).parent.parent / 'data/flows' / (flow_uuid + '.json')
    j = json.loads(p.read_text(), encoding='utf-8')

    for i, node in enumerate(j['nodes']):
        if node['id'] == datum_id:
            frame_uuid = j['nodes'][i]['uuid']
            j['nodes'][i]['uuid'] = None
            j['nodes'][i]['cacheCreatedAt'] = None

            # キャッシュを削除する（増え続けると困るので）
            frame = FrameModel.find_by_uuid(frame_uuid)
            if frame is not None:
                frame.delete()

    update_flow_by_uuid(p.stem, j)

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
