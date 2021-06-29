import os
from flask import Blueprint, jsonify, request, g
from kskp.core import Datum
from kskp.store import ProjectFolder
from ..views.auth import MY_PROJECT
from .utils import (
    Constraints,
    RequestJson,
    api_base,
    update_project_info,
    update_projects_info2,
    login_required_api
)

mod = Blueprint('api', __name__)

@mod.route('/projects')
@login_required_api
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
@api_base
def fetch_flow(flow_uuid):
    """
    指定されたフローを取得する
    """
    minimize = request.args.get('mini') is not None
    flow = g.factory.data.find_by_uuid(flow_uuid)
    ret = flow.to_json()
    ret.update({'flow' : flow.flow_data.to_json(minimize=minimize)})
    return ret

@mod.route('/flows', methods=['POST'])
@login_required_api
@api_base
def new_flow():
    """
    新しいフローを作成する
    """
    req = RequestJson(request.json)

    if req.has('original_flow_uuid'):
        original_flow = g.factory.data.find_by_uuid(req['original_flow_uuid'])
        original_label = original_flow.label + ' のコピー'
        # 同じフォルダ内の他データと重複しないラベル名を取得する
        parent = original_flow.find_parent()
        new_label = parent.make_unique_label(original_label)
        # フローを複製する
        return original_flow.duplicate(new_label)
    elif req.has_all('parent', 'label', 'flow'):
        # flowを作成する
        from kskp.store import FlowData
        parent = g.factory.data.find_by_uuid(req['parent'])
        new_flow = parent.create_flow(req['label'], FlowData(req['flow']))
        # flowをDBに格納する
        new_flow.save()
        return new_flow.reload()
    elif req.has('project_uuid'):
        # 
        # TODO: 古いパラメタ形式なので廃止したい
        # 
        from kskp.store import Flow
        flow_data = Flow.create_flow(request.json, g.user)
        # flowを作成する
        parent = g.factory.data.find_by_uuid(req['project_uuid'])
        new_flow = parent.create_flow(req['name'], flow_data)
        # flowをDBに格納する
        new_flow.save()
        return new_flow.reload()
    else:
        raise Exception('new_flow parameter error!')

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

@mod.route('/datasrcs', methods=['GET'])
@login_required_api
@api_base
def fetch_datasrcs():
    """
    データソースの一覧を取得する
    """
    from kskp.depo.std.commands import CommandLink

    datasrcs_json = []

    # create_datasource()を呼び出すためにRootを用いる
    root = g.factory.data.load_root()

    # ライブラリデータソースを作成する
    label = 'ライブラリ'
    loader_cmd = CommandLink('loader').resolve()
    args = {'uuid':'@[uuid]'}
    params = [
        {
            "name": "uuid",
            "type": "frame",
            "label": "ファイルを指定する",
            "optional": False
        }
    ]
    # データソースを作成する
    # (store引数にはとりあえずrootを入れておく)
    datasource = root.create_datasource(label, root, loader_cmd, args, params)
    # 戻り値のJSONを作成する
    datasrc_json = datasource.flow_data.to_json(contains_nodes=False)
    datasrc_json['classification'] = 'data_source'
    datasrc_json['flow'] = datasource.flow_data.to_json()
    # データソースの一覧に格納する
    datasrcs_json.append(datasrc_json)

    for store in g.factory.data.find_all_stores():
        # 参照権限のないデータストアは取得しない
        if not store.readable:
            continue
        # ゴミ箱にあるデータストアは取得しない
        if g.factory.data.trashed(store.uuid):
            continue

        if store.type == Datum.DATABASE_TYPE:
            # DBデータソースを作成する
            label = store.label
            loader_cmd = CommandLink('db_loader').resolve()
            args = {'schema_name':'@[schema]', 'table_name':'@[table]'}
            params = [
                {
                    "name": "schema",
                    "type": "string",
                    "label": "スキーマ名を指定する",
                    "optional": True
                },
                {
                    "name": "table",
                    "type": "string",
                    "label": "テーブル名を指定する",
                    "optional": False
                }
            ]
            
        elif store.type == Datum.RFOLDER_TYPE:
            # リモートフォルダデータソースを作成する
            label = store.label
            loader_cmd = CommandLink('remotefolder_loader').resolve()
            args = {'file_path':'@[filePath]'}
            params = [
                {
                    "name": "filePath",
                    "type": "string",
                    "label": "ファイルパスを指定する",
                    "optional": False
                }
            ]

        # データソースを作成する
        datasource = root.create_datasource(label, store, loader_cmd, args, params)
        # 戻り値のJSONを作成する
        datasource_flow_data = datasource.flow_data
        datasrc_json = datasource_flow_data.to_json(contains_nodes=False)
        datasrc_json['classification'] = 'data_source'
        # データソースが参照するデータストアの参照権限は確認済みなので
        # 速度低下を防ぐためto_json()ではノードのマスキングをしない
        datasrc_json['flow'] = datasource_flow_data.to_json(ignore_authz=True)
        # データソースの一覧に格納する
        datasrcs_json.append(datasrc_json)

    return datasrcs_json

@mod.route('/datadsts', methods=['GET'])
@login_required_api
@api_base
def fetch_datadsts():
    """
    データデストの一覧を取得する
    """
    from kskp.depo.std.commands import CommandLink

    datadsts_json = []

    # create_datadest()を呼び出すためにRootを用いる
    root = g.factory.data.load_root()

    # ライブラリデータデストを作成する
    label = 'ライブラリ'
    loader_cmd = CommandLink('saver').resolve()
    args = {}
    params = []
    # データデストを作成する
    # (store引数にはとりあえずrootを入れておく)
    datadest = root.create_datadest(label, root, loader_cmd, args, params)
    # 戻り値のJSONを作成する
    datadst_json = datadest.flow_data.to_json(contains_nodes=False)
    datadst_json['classification'] = 'data_dest'
    datadst_json['flow'] = datadest.flow_data.to_json()
    # データソースの一覧に格納する
    datadsts_json.append(datadst_json)

    for store in g.factory.data.find_all_stores():
        # 参照権限のないデータストアは取得しない
        if not store.readable:
            continue
        # ゴミ箱にあるデータストアは取得しない
        if g.factory.data.trashed(store.uuid):
            continue

        if store.type == Datum.DATABASE_TYPE:
            # DBデータデストを作成する
            label = store.label
            saver_cmd = CommandLink('db_saver').resolve()
            args = {'schema_name':'@[schema]', 'table_name':'@[table]'}
            params = [
                {
                    "name": "schema",
                    "type": "string",
                    "label": "スキーマ名を指定する",
                    "optional": True
                },
                {
                    "name": "table",
                    "type": "string",
                    "label": "テーブル名を指定する",
                    "optional": False
                }
            ]
            
        elif store.type == Datum.RFOLDER_TYPE:
            # リモートフォルダデータデストを作成する
            label = store.label
            saver_cmd = CommandLink('remotefolder_saver').resolve()
            args = {'dir_path':'@[dirPath]'}
            params = [
                {
                    "name": "dirPath",
                    "type": "string",
                    "label": "フォルダパスを指定する",
                    "optional": False
                }
            ]

        # データデストを作成する
        datadest = root.create_datadest(label, store, saver_cmd, args, params)
        # 戻り値のJSONを作成する
        datadest_flow_data = datadest.flow_data
        datadst_json = datadest_flow_data.to_json(contains_nodes=False)
        datadst_json['classification'] = 'data_dest'
        # データデストが参照するデータストアの参照権限は確認済みなので
        # 速度低下を防ぐためto_json()ではノードのマスキングをしない
        datadst_json['flow'] = datadest_flow_data.to_json(ignore_authz=True)
        # データデストの一覧に格納する
        datadsts_json.append(datadst_json)

    return datadsts_json

@mod.route('/subflows', methods=['GET'])
@login_required_api
def fetch_subflows():
    """
    サブフロー一覧を取得する
    """
    subflow_data_list = []
    for subflow in g.factory.data.find_all_subflows():
        # 実行権限のないサブフローは取得しない
        if not subflow.executable:
            continue
        # ゴミ箱にあるサブフローは取得しない
        if g.factory.data.trashed(subflow.uuid):
            continue
        subflow_data = subflow.flow_data.to_json(contains_nodes=False)
        subflow_data['uuid'] = subflow.uuid
        # TODO: フロントエンドから参照された場合に備える、実質的に使用していない(後方互換)
        subflow_data['projectName'] = ''
        subflow_data_list.append(subflow_data)

    return jsonify({'success': True, 'data': subflow_data_list})

@mod.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """
    visible_commands_json = []
    if len(request.args) == 0 or request.args.get('all') == 'on':
        visible_commands_json.append('mcmd')
        # visible_commands_json.append('kcmd')
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
    target_encoding = os.getenv('KSKP_FRAME_CHARACTER_CODE', 'UTF-8').lower()
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
    # 引数から削除対象のノードidを取得する
    ofs = request.args['of'].split('.')
    flow_uuid = ofs[0]
    node_id = ofs[1]

    # 対象のフローのロックのUUIDを取得する
    if request.json is None:
        lock_uuid = None
    else:
        req = RequestJson(request.json)
        lock_uuid = req.get('lock')

    # 対象のフローを取得する
    flow = g.factory.data.find_by_uuid(flow_uuid)
    
    # フローに記録されたキャッシュをクリアする
    unset_cache_uuid = flow.unset_cache(node_id, ignore_lock=True, lock_uuid=lock_uuid)
    if unset_cache_uuid is None:
        return

    # フローからキャッシュUUIDを削除してからキャッシュファイルを削除すること
    cache = g.factory.data.find_by_uuid(unset_cache_uuid)
    cache.throw_away()

@mod.route('/navigation', methods=['GET'])
@login_required_api
def get_navigation():
    from kskp.core import KSKP_VER

    navigation = {
        'user_id': '',
        'user_name': '',
        'project_uuid': '',
        'project_name': '',
        'flow_uuid': '',
        'flow_name': '',
        'user': {},
        'allowlist': {},
        'version': KSKP_VER,
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
