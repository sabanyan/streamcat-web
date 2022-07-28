from flask import (
    Blueprint,
    request,
    g
)
from streamcat.core import Datum
from streamcat.store.lock import lock_manager
from .utils import (
    RequestHeaders,
    RequestJson,
    Constraints,
    api_base,
    login_required_api
)

mod = Blueprint('flows', __name__)

@mod.route('/locks', methods=['POST'])
@login_required_api
@api_base
def make_new_lock():
    """
    排他ロックを獲得する
    """
    req = RequestJson(request.json)
    if not req.has('target'):
        raise Exception('排他ロック対象データのuuidを指定してください')

    if req.has('lastModifiedAt'):
        # 排他ロックの再獲得の場合
        from datetime import datetime
        target = g.factory.data.find_by_uuid(req['target'])
        last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
        lock = lock_manager.relock(target, lastModifiedAt=last_modified_at, creator=g.user)
    else:
        # 排他ロックの新規獲得の場合
        # (新規獲得の場合はfind_by_uuid()の実行で遅くしたくない)
        lock = lock_manager.lock(req['target'], creator=g.user)

    return lock.to_json()

@mod.route('/locks/<lock_uuid>', methods=['PUT'])
@login_required_api
@api_base
def extend_lock(lock_uuid):
    """
    排他ロックの有効期間を延長する
    """
    from streamcat.store.lock import LockedDatumException
    if not lock_manager.contains(lock_uuid):
        raise LockedDatumException(f'Lock ({lock_uuid}) is already expired')

@mod.route('/locks', methods=['DELETE'])
@login_required_api
@api_base
def delete_all_locks():
    """
    指定したDatumの排他ロックを解除する
    全ての排他ロックを解除する
    """
    if 'of' in request.args:
        target_uuid = request.args['of']
        return lock_manager.unlock_target(target_uuid)
    else:
        return lock_manager.unlock_all()

@mod.route('/locks/<lock_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_lock(lock_uuid):
    """
    指定した排他ロックを解除する
    """
    return lock_manager.unlock(lock_uuid)

@mod.route('/delete-locks/<lock_uuid>', methods=['POST'])
@login_required_api
@api_base
def delete_lock_by_post(lock_uuid):
    """
    指定した排他ロックを解除する
    (frontendのNavagator.sendBeacon()で発行する為、POSTで定義する必要がある)
    """
    return lock_manager.unlock(lock_uuid)


@mod.route('/caches', methods=['DELETE'])
@login_required_api
@api_base
def delete_cache():
    """
    指定したフローのキャッシュを削除する
    """
    if 'of' not in request.args:
        raise Exception('URI引数"of"が指定されていません')

    # 引数から削除対象のノードidを取得する
    ofs = request.args['of'].split('.')
    flow_uuid = ofs[0]
    node_id = ofs[1]

    # 対象のフローの排他ロックのUUIDを取得する
    if request.headers.get('Content-Type') != 'application/json':
        lock_uuid = None
    else:
        # NOTE: Content-Typeがapplication/jsonでない場合は、request.json()で例外が発生する
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


@mod.route('/datasrcs', methods=['GET'])
@login_required_api
@api_base
def fetch_datasrcs():
    """
    実行可能な全てのデータソースを取得する
    """
    from streamcat.depo.std.commands import CommandLink

    datasrcs_json = []

    # create_datasource()を呼び出すためにRootを用いる
    root = g.factory.data.load_root()

    # ライブラリデータソースを作成する
    label = 'ライブラリ'
    loader_cmd = CommandLink('loader').resolve()
    args = {'uuid':'@[uuid]'}
    params = [
        {
            'name': 'uuid',
            'type': 'frame',
            'label': 'ファイルを指定する',
            'optional': False
        }
    ]
    # データソースを作成する
    # (store引数にはとりあえずrootを入れておく)
    datasource = root.create_datasource(label, root, loader_cmd, args, params)
    # 戻り値のJSONを作成する
    datasrc_json = datasource.flow_data.to_json(contains_nodes=False)
    datasrc_json['description'] = 'ライブラリに在るファイルからデータを取得する'
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
            description = 'データベースからデータを取得する'
            loader_cmd = CommandLink('db_loader').resolve()
            args = {'schema_name':'@[schema]', 'table_name':'@[table]'}
            params = [
                {
                    'name': 'schema',
                    'type': 'string',
                    'label': 'スキーマ名を指定する',
                    'optional': True
                },
                {
                    'name': 'table',
                    'type': 'string',
                    'label': 'テーブル名を指定する',
                    'optional': False
                }
            ]
            
        elif store.type == Datum.RFOLDER_TYPE:
            # リモートフォルダデータソースを作成する
            label = store.label
            description = 'リモートフォルダに在るファイルからデータを取得する'
            loader_cmd = CommandLink('remotefolder_loader').resolve()
            args = {'file_path':'@[filePath]'}
            params = [
                {
                    'name': 'filePath',
                    'type': 'string',
                    'label': 'ファイルパスを指定する',
                    'optional': False
                }
            ]

        # データソースを作成する
        datasource = root.create_datasource(label, store, loader_cmd, args, params)
        # 戻り値のJSONを作成する
        datasource_flow_data = datasource.flow_data
        datasrc_json = datasource_flow_data.to_json(contains_nodes=False)
        datasrc_json['description'] = description
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
    実行可能な全てのデータデストを取得する
    """
    from streamcat.depo.std.commands import CommandLink

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
    datadst_json['description'] = 'ライブラリにファイルを新規作成しこれにデータを出力する'
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
            description = 'データベースにテーブルを新規作成しこれにデータを出力する'
            saver_cmd = CommandLink('db_saver').resolve()
            args = {'schema_name':'@[schema]', 'table_name':'@[table]'}
            params = [
                {
                    'name': 'schema',
                    'type': 'string',
                    'label': 'スキーマ名を指定する',
                    'optional': True
                },
                {
                    'name': 'table',
                    'type': 'string',
                    'label': 'テーブル名を指定する',
                    'optional': False
                }
            ]

        elif store.type == Datum.RFOLDER_TYPE:
            # リモートフォルダデータデストを作成する
            label = store.label
            description = 'リモートフォルダにファイルを新規作成しこれにデータを出力する'
            saver_cmd = CommandLink('remotefolder_saver').resolve()
            args = {'dir_path':'@[dirPath]'}
            params = [
                {
                    'name': 'dirPath',
                    'type': 'string',
                    'label': 'フォルダパスを指定する',
                    'optional': False
                }
            ]

        # データデストを作成する
        datadest = root.create_datadest(label, store, saver_cmd, args, params)
        # 戻り値のJSONを作成する
        datadest_flow_data = datadest.flow_data
        datadst_json = datadest_flow_data.to_json(contains_nodes=False)
        datadst_json['description'] = description
        datadst_json['classification'] = 'data_dest'
        # データデストが参照するデータストアの参照権限は確認済みなので
        # 速度低下を防ぐためto_json()ではノードのマスキングをしない
        datadst_json['flow'] = datadest_flow_data.to_json(ignore_authz=True)
        # データデストの一覧に格納する
        datadsts_json.append(datadst_json)

    return datadsts_json

@mod.route('/subflows', methods=['GET'])
@login_required_api
@api_base
def fetch_subflows():
    """
    実行可能な全てのサブフローを取得する
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

    return subflow_data_list

@mod.route('/commands')
@api_base
def fetch_commands():
    """
    全てのコマンドJSONを取得する
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

    from streamcat.depo.std.commands import CommandsPathLink, CommandsPathFileSource
    commands_list = []
    for visible_command in visible_commands_json:
        link = CommandsPathLink(CommandsPathFileSource(visible_command))
        commands_list.extend(link.resolve())

    return commands_list

@mod.route('/vcommands')
@api_base
def fetch_visualizers():
    """
    全てのVコマンドのコマンドJSONを取得する
    """
    from streamcat.depo.std.commands import CommandsPathLink, CommandsPathFileSource

    link = CommandsPathLink(CommandsPathFileSource('vcmd'))
    return link.resolve()


@mod.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_flow(flow_uuid):
    """
    指定したフローを取得する
    """
    minimize = request.args.get('mini') is not None
    flow = g.factory.data.find_by_uuid(flow_uuid, folder_path=True)
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

    if req.has('source'):
        source_flow = g.factory.data.find_by_uuid(req['source'])
        source_label = source_flow.label + ' のコピー'
        # 同じフォルダ内の他データと重複しないラベル名を取得する
        parent = source_flow.find_parent()
        new_label = parent.make_unique_label(source_label)
        # フローを複製する
        return source_flow.duplicate(new_label)
    elif req.has_all('parent', 'label', 'flow'):
        # フローを作成する
        from streamcat.store import FlowData
        parent = g.factory.data.find_by_uuid(req['parent'])
        new_flow = parent.create_flow(req['label'], FlowData(req['flow']))
        # フローをDBに格納する
        new_flow.save()
        return new_flow.reload()
    else:
        raise Exception('new_flow parameter error!')

@mod.route('/flows/<flow_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_flow(flow_uuid):
    """
    フローのラベルを変更する、またはフローを移動する
    """
    req = RequestJson(request.json)
    if not req.has('lock'):
        raise Exception('排他ロックのUUIDを指定してください')

    if req.has('parent'):
        if req.has('label'):
            raise Exception('labelとはparent属性は同時に指定できません')
        # flowを移動する
        flow = g.factory.data.find_by_uuid(flow_uuid)
        return flow.move(req['parent'], lock_uuid=req['lock'])
    elif req.has('editLock'):
        flow = g.factory.data.find_by_uuid(flow_uuid)
        flow.set_edit_lock(req['editLock'], lock_uuid=req['lock'])
        return flow
    elif req.has('flow'):
        from streamcat.store import FlowData
        flow = g.factory.data.find_by_uuid(flow_uuid)
        flow_data = FlowData(req['flow'])
        return flow.update_data(req.get('label') or flow.label, flow_data, lock_uuid=req['lock'])
    elif req.has('label'):
        flow = g.factory.data.find_by_uuid(flow_uuid)
        return flow.update_label(req['label'], lock_uuid=req['lock'])
    else:
        raise Exception('parent,editlock,label,flowのいずれか一つを指定してください')

@mod.route('/flows/<flow_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_flow(flow_uuid):
    """
    指定したフローをほかす
    """
    try:
        req = RequestJson(request.json)
        lock_uuid = req['lock']
    except Exception:
        raise Exception('排他ロックのUUIDを指定してください')

    flow = g.factory.data.find_by_uuid(flow_uuid)
    flow.throw_away(lock_uuid=lock_uuid)


@mod.route('/frames/<frame_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_frame(frame_uuid):
    """
    指定したフレームを取得する
    """
    import os

    contents = request.args.get('contents') is not None
    offset = request.args.get('offset') or 0
    limit = request.args.get('limit') or 100

    # Frameを取得する
    frame = g.factory.data.find_by_uuid(frame_uuid)

    if contents:
        # リクエストヘッダを取得する
        headers = RequestHeaders(request.headers)
        if headers.accept_mimetype == 'text/csv':
            # Acceptヘッダから文字コードの指定を取得する
            # 指定がない場合は環境変数から取得する、環境変数の設定値もない場合は'UTF-8'とする
            target_encoding = headers.accept_charset or os.getenv('STREAMCAT_FRAME_CHARACTER_CODE', 'UTF-8').lower()
            # フレームの内容をCSVファイルで返す
            return _convert_file(frame_uuid, target_encoding=target_encoding)
        else:
            # フレームの内容をHTMLで返す
            from .utils import VisConverter
            result_json = frame.to_json()
            # frameの内容を取得する
            vis = _get_vis(frame_uuid, args={'offset':offset, 'limit':limit})
            result_json['args'] = {'column_names':vis.column_names}
            result_json['contents'] = VisConverter(vis)
            return result_json
    else:
        return frame

@Constraints.allow_download_only_with_writable
def _convert_file(frame_uuid:str, target_encoding:str='UTF-8'):
    from .utils import InvalidAcceptHeader

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

    if target_encoding.lower() not in ('utf-8', 'cp932'):
        raise InvalidAcceptHeader(f'Acceptヘッダに指定された文字コード({target_encoding})には対応していません')

    # Frameを取得する
    frame = g.factory.data.find_by_uuid(frame_uuid)

    frame_path = frame.path
    if not frame_path.exists():
        raise Exception(f'指定されたFrame({frame_uuid})のファイル({frame_path})が存在しませんでした')

    # Frameの文字コードと改行コードを識別する
    source_encoding = 'utf-8' if frame.encoding == 'UNKNOWN' else frame.encoding
    source_newline = '\n' if frame.newline == 'UNKNOWN' else frame.newline

    # ダウンロードファイルの改行コードを決定する
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
    else:
        downloadFileName = frame.label + '.csv'

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
        raise Exception(f'指定されたFrame({frame_uuid})のファイル({frame_path})を{source_encoding}で開けませんでした')
    except UnicodeEncodeError:
        raise Exception(f'指定されたFrame({frame_uuid})のファイル({frame_path})を{target_encoding}に変換できませんでした')
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

def _get_vis(frame_uuid:str, args={}):
    """
    指定したframeのVisデータを取得する
    """
    VIZ_POINT_ID = 'd'
    vis_args = {'vis': 
                    {VIZ_POINT_ID: 
                        {
                            'command_id':'csvtohtmltable',
                            'args':args
                        }
                    }
               }
    # Visを取得する
    datasource = _make_flow(frame_uuid=frame_uuid)
    activity = _execute_flow(datasource, vis_args=vis_args)
    if activity is None or len(activity.outs)==0:
        raise Exception('No out exists in activity')
    return activity.outs[0][1]


@mod.route('/vizs', methods=['POST'])
@login_required_api
@api_base
def make_new_vis():
    """
    フローを実行してVisを作成する
    """
    # Vizを取得するには'vis'属性の指定が必須である
    req = RequestJson(request.json)
    args = req.get('args') or {}
    vis_is_specified = 'vis' in args and isinstance(args['vis'], dict) and len(args['vis'].keys()) > 0
    if not vis_is_specified:
        raise Exception("Vizを取得するには'vis'属性の指定が必須です")
    # Activityを作成する
    flow = _make_flow(flow_uuid=req.get('uuid'), frame_uuid=req.get('frame'), flow_json=req.get('flow'))
    return _make_new_acitivity(flow, req.get('lock'), req.get('args'))


@mod.route('/activities/<activity_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_activity(activity_uuid):
    """
    指定したActivityを取得する
    """
    return g.factory.data.find_by_uuid(activity_uuid)

@mod.route('/activities', methods=['POST'])
@login_required_api
@api_base
def make_new_acitivity():
    """
    指定したフローを実行してActivityを作成する
    """
    # Activityを作成する
    req = RequestJson(request.json)
    flow = _make_flow(flow_uuid=req.get('uuid'), flow_json=req.get('flow'))
    return _make_new_acitivity(flow, req.get('lock'), req.get('args'))

def _make_flow(flow_uuid:str=None, frame_uuid:str=None, flow_json:dict=None) -> object:
    """
    リクエストJSONで指定された属性値からフローを用意する
    """
    # 引数の指定を検証する
    if frame_uuid is not None:
        if flow_uuid is not None or flow_json is not None:
            raise Exception('flow,uuidまたはframe属性は同時に指定できません')
    elif flow_uuid is not None:
        if frame_uuid is not None or flow_json is not None:
            raise Exception('flow,uuidまたはframe属性は同時に指定できません')
    elif flow_json is not None:
        if frame_uuid is not None or flow_uuid is not None:
            raise Exception('flow,uuidまたはframe属性は同時に指定できません')
    elif frame_uuid is None and flow_uuid is None and flow_json is None:
        raise Exception('flow,uuidまたはframe属性を指定してください')

    if frame_uuid is not None:
        # FrameのUUIDが指定された場合
        from streamcat.depo.std.commands import LoaderCommand
        frame = g.factory.data.find_by_uuid(frame_uuid)
        parent_folder = frame.find_parent()
        # datasourceは保存しないので、親フォルダはどこでも良い
        return parent_folder.create_datasource('tmp_source', parent_folder, LoaderCommand(), {'uuid':frame.uuid})
    elif flow_uuid is not None:
        # FlowのUUIDが指定された場合
        # AssertCommandがflow.folder_pathを参照するため、folder_path=Trueにする
        return g.factory.data.find_by_uuid(flow_uuid, folder_path=True)
    elif flow_json is not None:
        # フローJSONが指定された場合
        from streamcat.store import FlowData
        root = g.factory.data.load_root()
        return root.create_flow('FLOW_LITERAL', FlowData(flow_json))
    else:
        raise Exception(f'Either flow or flow uuid or frame uuid is required')

def _make_new_acitivity(flow:object, lock_uuid:str=None, args:dict={}) -> dict:
    """
    フローを実行してActivityを作成する
    """
    from .utils import VisConverter

    def is_vis(out):
        from streamcat.store import Vis
        return isinstance(out, Vis)

    # フローを実行してActivityを作成する
    activity = _execute_flow(flow, args=args or {}, lock_uuid=lock_uuid)

    return {'uuid' : activity.uuid,
            'type' : activity.type,
            'label': activity.label,
            'outs' :  [{'id'    : point.id, 
                        'label' : point.label,
                        'datum' : datum.uuid,
                        'parent': None if is_vis(datum) else datum.find_parent().uuid,
                        'args': {'column_names':datum.column_names} if is_vis(datum) else {},
                        'contents': VisConverter(datum) if is_vis(datum) else None
                        }
                        for point, datum in activity.outs
                      ]
    }

def _execute_flow(flow, args={}, inputs={}, vis_args={}, lock_uuid=None):
    """
    指定されたフローを実行し実行結果を取得する
    """
    from streamcat.store import Activity, NoResultsException
    from streamcat.engine import execute, FlowCommand

    args = args.copy()
    args.update(vis_args)
    outs = execute(command=FlowCommand(flow, lock_uuid), args=args, inputs=inputs)

    # Activityを取得して返り値とする
    for datum in outs.values():
        if isinstance(datum, Activity):
            activity = datum
            # 実行に失敗した場合、例外を送出する
            activity.is_success or activity.raise_one()
            # 実行結果が出力されなかった場合、例外を送出する
            if activity.count_outs() == 0:
                break
            # 実行に成功した場合、Activityを返す
            return activity

    # Activityを取得できなかった場合
    raise NoResultsException('実行結果は出力されませんでした.')


@mod.route('/schedules/<schedule_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_schedule(schedule_uuid):
    """
    指定したスケジュールを取得する
    """
    return g.factory.data.find_by_uuid(schedule_uuid)

@mod.route('/schedules', methods=['POST'])
@login_required_api
@api_base
def make_new_schedule():
    """
    スケジュールを作成する
    """
    req = RequestJson(request.json)
    parent = g.factory.data.find_by_uuid(req['parent'])
    args = req.get('args') or {}
    inputs = req.get('inputs') or {}
    schedule = parent.create_schedule(req['label'],
                                      req['runnable'],
                                      args=args,
                                      inputs=inputs,
                                      trigger=req['trigger'])
    schedule.save()
    return schedule.reload()

@mod.route('/schedules/<schedule_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_schedule(schedule_uuid):
    """
    スケジュールのラベルを変更する、またはスケジュールを移動する
    """
    req = RequestJson(request.json)

    if req.has('parent'):
        if req.has('label'):
            raise Exception('labelとはparent属性は同時に指定できません')
        # scheduleを移動する
        schedule = g.factory.data.find_by_uuid(schedule_uuid)
        return schedule.move(req['parent'])
    elif req.has_all('runnable', 'trigger'):
        label = req.get('label') or schedule.label
        args = req.get('args') or {}
        inputs = req.get('inputs') or {}
        schedule = g.factory.data.find_by_uuid(schedule_uuid)
        return schedule.update_data(label,
                                    req['runnable'],
                                    args=args,
                                    inputs=inputs,
                                    trigger=req['trigger'])
    elif req.has('label'):
        schedule = g.factory.data.find_by_uuid(schedule_uuid)
        return schedule.update_label(req['label'])
    else:
        raise Exception('parent,labelのいずれか一つ、またはflowとtriggerを指定してください')

@mod.route('/schedules/<schedule_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_schedule(schedule_uuid):
    """
    指定したスケジュールをほかす
    """
    schedule = g.factory.data.find_by_uuid(schedule_uuid)
    schedule.throw_away()
