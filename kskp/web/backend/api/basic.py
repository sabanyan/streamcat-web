import os
from flask import Blueprint, request, jsonify, g
from kskp.core import Datum
from kskp.store import Folder, ProjectFolder
from .auth import login_required_api, MY_PROJECT
from .utils import (
    api_base,
    update_navigation,
    update_project_info,
    update_projects_info2,
    Constraints,
    RequestJson
)

mod = Blueprint('api', __name__)

@mod.route('/projects')
@login_required_api
@update_navigation
@update_projects_info2
@api_base
def get_projects():
    """
    全てのプロジェクトを返却する
    """
    if request.args.get('except_myproject') == 'on':
        except_label = MY_PROJECT
    else:
        except_label = None

    return g.factory.data.find_all(type=Datum.PROJECT_TYPE, except_label=except_label)

@mod.route('/projects/<project_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@update_project_info
@api_base
def fetch_project(project_uuid):
    """
    プロジェクトを返却する
    """
    from .lib import _jsonify_folder
    project = g.factory.data.find_by_uuid(project_uuid)
    return _jsonify_folder(project)

@mod.route('/projects', methods=['POST'])
@login_required_api
@api_base
def new_project():
    """
    プロジェクトを作成する
    """
    if 'parent' not in request.json:
        raise Exception('parent属性を指定してください')

    parent = g.factory.data.find_by_uuid(request.json['parent'])
    new_project = parent.create_project_folder(request.json['label'])
    new_project.save()
    return new_project

@mod.route('/projects/<project_uuid>', methods=['PUT'])
@login_required_api
@update_navigation
@api_base
def update_project(project_uuid):
    """
    プロジェクトのラベルを修正する
    プロジェクトを移動する
    プロジェクトメンバを設定する
    """
    req = RequestJson(request.json)

    if req.has_no_all('parent', 'label', 'members'):
        raise Exception('label,parentまたはmembers属性を指定してください')
    elif req.has_all('parent', 'label', 'members'):
        raise Exception('label,parentとmembers属性は同時に指定できません')

    project = g.factory.data.find_by_uuid(project_uuid)

    if req.has('label'):
        # プロジェクトのラベルを修正する
        return project.update_data(req['label'])
    elif req.has('parent'):
        # プロジェクトを移動する
        return project.move(req['parent'])

    elif req.has('members'):
        # プロジェクトにユーザを追加・削除する
        if not req.has('lastModifiedAt'):
            raise Exception('lastModifiedAtにプロジェクトの最終更新時刻を指定してください')
        if not isinstance(req['members'], list):
            raise Exception('members属性にはユーザuuidの配列を指定してください')
        # member属性からMembersオブジェクトを作成する
        members = []
        for member_dict in req['members']:
            user = g.factory.user.find_by_uuid(member_dict['uuid'])
            type = member_dict['type']
            members.append(ProjectFolder.Member(user, type))
        # プロジェクト管理者が設定されない場合はエラーとする
        if not project.owner_exists(members):
            raise Exception('プロジェクト管理者が設定されていません')
        # member属性で指定されたユーザを追加する
        from datetime import datetime
        last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
        project.init_members(members, last_modified_at)
        return project
    else:
        raise Exception('誤った引数が指定されました')

@mod.route('/projects/<project_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_project(project_uuid):
    """
    指定したプロジェクトをほかす
    """
    project = g.factory.data.find_by_uuid(project_uuid)
    project.throw_away()

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

    parent = g.factory.data.find_by_uuid(parent_uuid)
    children = parent.find_children()

    for datum in children:
        if datum.type != Datum.FLOW_TYPE:
            continue
        # flow_data = datum.data2['flow']
        # flow_data['uuid'] = datum.uuid
        flow_data = {'uuid':datum.uuid,
                    'label':datum.label,
                    'creator':datum.creator_str,
                    'createdAt':datum.created_at_str}
        flow_list.append(flow_data)

    return flow_list

@mod.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_flow(flow_uuid):
    """
    指定されたフローを取得する
    """
    flow = g.factory.data.find_by_uuid(flow_uuid)
    ret = flow.to_json()
    ret.update({'flow' : flow.flow_data})
    return ret

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
        original_flow = g.factory.data.find_by_uuid(j.get('original_flow_uuid'))
        original_label = original_flow.label + ' のコピー'
        # 同じフォルダ内の他データと重複しないラベル名を取得する
        parent = original_flow.find_parent()
        new_label = parent.make_unique_label(original_label)
        # フローを複製する
        new_flow = original_flow.duplicate(new_label)
        return new_flow.flow_data
    else:
        parent_uuid = j.get('project_uuid')
        label = j.get('name')
        from kskp.store import Flow
        flow_data = Flow.create_flow(j, g.user)
        # flowを作成する
        parent = g.factory.data.find_by_uuid(parent_uuid)
        new_flow = parent.create_flow(label, flow_data)
        # flowをDBに格納する
        new_flow.save()
        new_flow = new_flow.reload()
        return flow_data

@mod.route('/flows/<flow_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_flow(flow_uuid):
    """
    フローのラベルを修正する、またはフローを移動する
    """
    req = RequestJson(request.json)
    if not req.has('lock'):
        raise Exception('ロックのUUIDを指定してください')

    if 'parent' in request.json:
        if 'label' in request.json:
            raise Exception('labelとはparent属性は同時に指定できません')
        # flowを移動する
        new_parent = request.json['parent']
        flow = g.factory.data.find_by_uuid(flow_uuid)
        return flow.move(new_parent, lock_uuid=req['lock'])
    elif 'editLock' in request.json:
        edit_lock_value = request.json['editLock']
        flow = g.factory.data.find_by_uuid(flow_uuid)
        flow.set_edit_lock(edit_lock_value, lock_uuid=req['lock'])
        return flow
    elif 'flow' in request.json:
        from kskp.store import FlowData
        flow = g.factory.data.find_by_uuid(flow_uuid)
        if 'label' in request.json:
            label = request.json['label']
        else:
            label = flow.label
        flow_data = FlowData(request.json['flow'])
        return flow.update_data(label, flow_data, lock_uuid=req['lock'])
    elif 'label' in request.json:
        label = request.json['label']
        flow = g.factory.data.find_by_uuid(flow_uuid)
        return flow.update_label(label, lock_uuid=req['lock'])
    else:
        raise Exception('parent,editlock,label,flowのいずれか一つを指定してください')

@mod.route('/flows/<flow_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_flow(flow_uuid):
    """
    指定されたフローをほかす
    """
    try:
        req = RequestJson(request.json)
        lock_uuid = req['lock']
    except Exception:
        raise Exception('ロックのUUIDを指定してください')

    flow = g.factory.data.find_by_uuid(flow_uuid)
    flow.throw_away(lock_uuid=lock_uuid)

@mod.route('/subflows', methods=['GET'])
@login_required_api
def fetch_subflows():
    """
    サブフロー一覧を取得する。
    """
    no_inputs  = request.args.get('no_inputs') == 'on'
    no_outputs = request.args.get('no_outputs') == 'on'

    subflow_data_list = []
    for subflow in g.factory.data.find_all_subflows(no_inputs, no_outputs):
        # 親フォルダのラベルを取得する
        parent = subflow.find_parent()
        # 親フォルダのないサブフローは取得しない
        if parent is None:
            continue
        # 実行権限のないサブフローは取得しない
        if not subflow.executable:
            continue
        # ゴミ箱にあるサブフローは取得しない
        if g.factory.data.trashed(subflow.uuid):
            continue
        # subflow_data = subflow.flow_data.to_json()
        subflow_data = subflow.flow_data.to_json(contains_nodes=False)
        subflow_data['uuid'] = subflow.uuid
        subflow_data_list.append(subflow_data)
        if isinstance(parent, Folder):
            parent_label = parent.label
            subflow_data['projectName'] = parent_label
    return jsonify({'success': True, 'data': subflow_data_list})

@mod.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """
    visible_commands_json = []
    if len(request.args) == 0 or request.args.get('all') == 'on':
        visible_commands_json.append('mcmd')
        visible_commands_json.append('kcmd')
        visible_commands_json.append('pcmd')
        visible_commands_json.append('scmd')
    else:
        if request.args.get('mcmd') == 'on':
            visible_commands_json.append('mcmd') 
        if request.args.get('kcmd') == 'on':
            visible_commands_json.append('kcmd') 
        if request.args.get('pcmd') == 'on':
            visible_commands_json.append('pcmd') 
        if request.args.get('scmd') == 'on':
            visible_commands_json.append('scmd') 

    from kskp.depo.std.commands import CommandsPathLink, CommandsPathFileSource
    commands_list = []
    for visible_command in visible_commands_json:
        link = CommandsPathLink(CommandsPathFileSource(visible_command))
        commands_list.extend(link.resolve())

    return jsonify({'success': True, 'data': commands_list})

@mod.route('/visualizers')
def fetch_visualizers():
    """
    ビジュアライズ用コマンド定義の一覧を返す
    """

    from kskp.depo.std.commands import CommandsPathLink, CommandsPathFileSource

    link = CommandsPathLink(CommandsPathFileSource('vcmd'))

    return jsonify({'success': True, 'data': link.resolve()})

@mod.route('/files')
@login_required_api
@Constraints.allow_download_only_with_writable
def download_file():
    def convert(file_path, source_encoding, source_newline, target_encoding, target_newline):
        """
        指定されたファイルの文字コードと改行コードを変換する
        """
        with file_path.open(encoding=source_encoding, newline=source_newline, errors='replace') as f:
            for line in f:
                if source_encoding == target_encoding and source_newline == target_newline:
                    # 変換処理が必要ない場合は処理を軽くする
                    yield line
                else:
                    # 変換できない文字があれば、
                    # UTF-8への変換の場合は�(U+FFFD)に置き換える
                    # CP932への変換の場合は?(3F)に置き換える
                    line = line.rstrip(source_newline) + target_newline
                    yield line.encode(target_encoding, errors='replace')

    def error(message):
        return jsonify({'success':False, 'code':-1, 'message': message})

    # frameのuuidと拡張子指定を取得する
    frame_uuid = request.args.get('uuid')
    ext = request.args.get('ext')

    try:
        frame = g.factory.data.find_by_uuid(frame_uuid)
    except Exception as e:
        return error(str(e))

    frame_path = frame.path
    if not frame_path.exists():
        return error(f'指定されたFrame({frame_uuid})のファイル({frame_path})が存在しませんでした')

    # frameの文字コードと改行コードを識別する
    source_encoding = 'utf-8' if frame.encoding == 'UNKNOWN' else frame.encoding
    source_newline = '\n' if frame.newline == 'UNKNOWN' else frame.newline

    # 環境変数からダウンロードファイルの文字コード設定値を取得する
    # (設定値がない場合は'UTF-8'とする)
    target_encoding = os.getenv('FRAME_CHARACTER_CODE', 'UTF-8').lower()
    target_newline = '\r\n' if target_encoding in ('cp932', 'CP932') else '\n'

    # ダウンロードファイルのサイズを計算する
    if source_encoding == target_encoding and source_newline == target_newline:
        # 変換処理がない場合は元ファイルサイズがダウンロードファイルのサイズである
        downloadFileSize = frame.file_size
    else:
        downloadFileSize = None

    # ダウンロードファイル名を作成する
    if frame.label.endswith('.csv') or frame.label.endswith('.txt'):
        downloadFileName = frame.label
    elif ext is None or ext == '':
        downloadFileName = frame.label + '.csv'
    else:
        downloadFileName = frame.label + '.' + ext
    
    # ファイル名をURLエンコードする
    import urllib.parse
    downloadFileName = urllib.parse.quote(downloadFileName)

    # frameを返す
    # ・文字コード変換と改行コード変換をしながら返す
    # ・Streamで返すため一時ファイルは作成されない
    # ・変換に失敗した文字は代替する文字に置き換える
    from flask import Response
    try:
        response = Response(convert(frame_path, source_encoding, source_newline, target_encoding, target_newline))
        response.content_type = f'text/csv; {target_encoding}'
        if downloadFileSize is not None:
            # 設定することでWebブラウザがダウンロードの進捗状況を表示してくれるかも
            response.content_length = downloadFileSize
        # filename*=はFirefox用
        response.headers['Content-Disposition'] = f'attachment; filename={downloadFileName}; filename*={downloadFileName}'
        return response
    except UnicodeDecodeError:
        return error(f'指定されたFrame({frame_uuid})のファイル({frame_path})を{source_encoding}で開けませんでした')
    except UnicodeEncodeError:
        return error(f'指定されたFrame({frame_uuid})のファイル({frame_path})を{target_encoding}に変換できませんでした')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error(str(e))

@mod.route('/caches', methods=['DELETE'])
@login_required_api
@api_base
def delete_cache():
    """
    キャッシュを削除する
    """
    frame_uuid = ''

    # パース
    ofs = request.args['of'].split('.')
    flow_uuid = ofs[0]
    datum_id = ofs[1]

    flow = g.factory.data.find_by_uuid(flow_uuid)
    flow_data = flow.flow_data

    cache_uuids = []
    for i, node in enumerate(flow_data.get_nodes()):
        if node['id'] == datum_id:
            frame_uuid = node['uuid']
            node['uuid'] = None
            node['cacheCreatedAt'] = None
            cache_uuids.append(frame_uuid)

    # TODO: 暫定的に、キャッシュの設定ではフローJsonの排他制御をしない
    flow.update_data(flow.label, flow_data, ignore_lock=True)

    # フローからキャッシュUUIDを削除してからキャッシュファイルを削除すること
    for cache_uuid in cache_uuids:
        cache = g.factory.data.find_by_uuid(cache_uuid)
        if cache is not None:
            cache.delete()

@mod.route('/navigation', methods=['GET'])
@login_required_api
def get_navigation():
    navigation = {
        'user_id': '',
        'user_name': '',
        'project_uuid': '',
        'project_name': '',
        'flow_uuid': '',
        'flow_name': '',
        'user': {},
        'allowlist': {},
        'depo_name': os.environ.get('KSKP_DEPO') or 'Unit Test'
    }

    flow_uuid = request.args.get('flow_uuid')
    project_uuid = request.args.get('project_uuid')


    if g.user is not None:
        navigation['user_id'] = g.user.id
        navigation['user_name'] = g.user.name
        navigation['user'] = g.user.to_json()
        navigation['allowlist'] = g.user.get_allowlist()

    if flow_uuid is not None :
        flow = g.factory.data.find_by_uuid(flow_uuid)
        parent = flow.find_parent()
        navigation['project_uuid'] = parent.uuid
        navigation['project_name'] = parent.label
        navigation['flow_uuid'] = flow_uuid
        navigation['flow_name'] = flow.label
        
    # プロジェクトが指定された場合
    elif project_uuid is not None:
        project = g.factory.data.find_by_uuid(project_uuid)
        navigation['project_uuid'] = project.uuid
        navigation['project_name'] = project.label

    return jsonify({'success': True, 'data': navigation})

@mod.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
