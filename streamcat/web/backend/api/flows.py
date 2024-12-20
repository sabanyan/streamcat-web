from fastapi import APIRouter, Request, Depends
from streamcat.core import SavableDatum
from streamcat.store.factory import Factory
from streamcat.store.lock import lock_manager
from .utils import (
    RequestHeaders,
    RequestJson,
    Constraints,
    login_required_api,
    get_factory,
    jsonify,
    duplicate_datum
)

router = APIRouter()

@router.post('/locks')
@login_required_api
@jsonify
async def make_new_lock(request:Request, factory:Factory=Depends(get_factory)):
    """
    排他ロックを獲得する
    """
    req = RequestJson(await request.json())
    if not req.has('target'):
        raise Exception('排他ロック対象データのuuidを指定してください')

    if req.has('lastModifiedAt'):
        # 排他ロックの再獲得の場合
        from datetime import datetime
        target = factory.data.find_by_uuid(req['target'])
        last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
        lock = lock_manager.relock(target, lastModifiedAt=last_modified_at, creator=factory.myself)
    else:
        # 排他ロックの新規獲得の場合
        # (新規獲得の場合はfind_by_uuid()の実行で遅くしたくない)
        lock = lock_manager.lock(req['target'], creator=factory.myself)

    return lock.to_json()

@router.put('/locks/{lock_uuid}')
@login_required_api
@jsonify
def extend_lock(lock_uuid):
    """
    排他ロックの有効期間を延長する
    """
    from streamcat.store.lock import LockedDatumException
    if not lock_manager.contains(lock_uuid):
        raise LockedDatumException(f'Lock ({lock_uuid}) is already expired')

@router.delete('/locks')
@login_required_api
@jsonify
def delete_all_locks(of=None):
    """
    指定したDatumの排他ロックを解除する
    全ての排他ロックを解除する
    """
    if of is not None:
        return lock_manager.unlock_target(target_uuid=of)
    else:
        return lock_manager.unlock_all()

@router.delete('/locks/{lock_uuid}')
@login_required_api
@jsonify
def delete_lock(lock_uuid):
    """
    指定した排他ロックを解除する
    """
    return lock_manager.unlock(lock_uuid)

@router.post('/delete-locks/{lock_uuid}')
@login_required_api
@jsonify
def delete_lock_by_post(lock_uuid):
    """
    指定した排他ロックを解除する
    (frontendのNavagator.sendBeacon()で発行する為、POSTで定義する必要がある)
    """
    return lock_manager.unlock(lock_uuid)


@router.delete('/caches')
@login_required_api
@jsonify
async def delete_cache(request:Request, of=None, factory:Factory=Depends(get_factory)):
    """
    指定したフローのキャッシュを削除する
    """
    if of is None:
        raise Exception('URI引数"of"が指定されていません')

    # 引数から削除対象のノードidを取得する
    ofs = of.split('.')
    flow_uuid = ofs[0]
    node_id = ofs[1]

    # 対象のフローの排他ロックのUUIDを取得する
    if request.headers.get('Content-Type') != 'application/json':
        lock_uuid = None
    else:
        # NOTE: Content-Typeがapplication/jsonでない場合は、request.json()で例外が発生する
        req = RequestJson(await request.json())
        lock_uuid = req.get('lock')

    # 対象のフローを取得する
    flow = factory.data.find_by_uuid(flow_uuid)
    
    # フローに記録されたキャッシュをクリアする
    unset_cache_uuid = flow.unset_cache(node_id, ignore_lock=True, lock_uuid=lock_uuid)
    if unset_cache_uuid is None:
        return

    # フローからキャッシュUUIDを削除してからキャッシュファイルを削除すること
    cache = factory.data.find_by_uuid(unset_cache_uuid)
    cache.throw_away()


@router.get('/datasrcs')
@login_required_api
@jsonify
def fetch_datasrcs(factory:Factory=Depends(get_factory)):
    """
    実行可能な全てのデータソースを取得する
    """
    from streamcat.depo.std.commands import CommandLink

    datasrcs_json = []

    # create_datasource()を呼び出すためにRootを用いる
    root = factory.data.load_root()

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

    for store in factory.data.find_all_stores():
        # 参照権限のないデータストアは取得しない
        if not store.readable:
            continue
        # ゴミ箱にあるデータストアは取得しない
        if factory.data.trashed(store.uuid):
            continue

        if store.type == SavableDatum.DATABASE_TYPE:
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
            
        elif store.type == SavableDatum.RFOLDER_TYPE:
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

@router.get('/datadsts')
@login_required_api
@jsonify
def fetch_datadsts(factory:Factory=Depends(get_factory)):
    """
    実行可能な全てのデータデストを取得する
    """
    from streamcat.depo.std.commands import CommandLink

    datadsts_json = []

    # create_datadest()を呼び出すためにRootを用いる
    root = factory.data.load_root()

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

    for store in factory.data.find_all_stores():
        # 参照権限のないデータストアは取得しない
        if not store.readable:
            continue
        # ゴミ箱にあるデータストアは取得しない
        if factory.data.trashed(store.uuid):
            continue

        if store.type == SavableDatum.DATABASE_TYPE:
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

        elif store.type == SavableDatum.RFOLDER_TYPE:
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

@router.get('/subflows')
@login_required_api
@jsonify
def fetch_subflows(factory:Factory=Depends(get_factory)):
    """
    実行可能な全てのサブフローを取得する
    """
    subflow_data_list = []
    for subflow in factory.data.find_all_subflows():
        # 実行権限のないサブフローは取得しない
        if not subflow.executable:
            continue
        # ゴミ箱にあるサブフローは取得しない
        if factory.data.trashed(subflow.uuid):
            continue
        subflow_data = subflow.flow_data.to_json(contains_nodes=False)
        subflow_data['uuid'] = subflow.uuid
        # TODO: フロントエンドから参照された場合に備える、実質的に使用していない(後方互換)
        subflow_data['projectName'] = ''
        subflow_data_list.append(subflow_data)

    return subflow_data_list

@router.get('/commands')
@jsonify
def fetch_commands(request:Request, all=False, mcmd=False, kcmd=False, pcmd=False, scmd=False):
    """
    全てのコマンドJSONを取得する
    """
    visible_commands_json = []
    if len(request.query_params) == 0 or all:
        visible_commands_json.append('mcmd')
        # visible_commands_json.append('kcmd')
        visible_commands_json.append('pcmd')
        visible_commands_json.append('scmd')
    else:
        if mcmd:
            visible_commands_json.append('mcmd') 
        if kcmd:
            visible_commands_json.append('kcmd') 
        if pcmd:
            visible_commands_json.append('pcmd') 
        if scmd:
            visible_commands_json.append('scmd') 

    from streamcat.depo.std.commands import CommandsPathLink, CommandsPathFileSource
    commands_list = []
    for visible_command in visible_commands_json:
        link = CommandsPathLink(CommandsPathFileSource(visible_command))
        commands_list.extend(link.resolve())

    return commands_list

@router.get('/vcommands')
@jsonify
def fetch_visualizers():
    """
    全てのVコマンドのコマンドJSONを取得する
    """
    from streamcat.depo.std.commands import CommandsPathLink, CommandsPathFileSource

    link = CommandsPathLink(CommandsPathFileSource('vcmd'))
    return link.resolve()


@router.get('/flows/{flow_uuid}')
@login_required_api
@jsonify
def fetch_flow(flow_uuid, mini=False, factory:Factory=Depends(get_factory)):
    """
    指定したフローを取得する
    """
    flow = factory.data.find_by_uuid(flow_uuid, folder_path=True)
    ret = flow.to_json()
    ret.update({'flow' : flow.flow_data.to_json(minimize=mini)})
    return ret

@router.post('/flows')
@login_required_api
@jsonify
async def new_flow(request:Request, factory:Factory=Depends(get_factory)):
    """
    新しいフローを作成する
    """
    req = RequestJson(await request.json())

    if req.has('source'):
        # フローを複製する
        return duplicate_datum(factory, req['source'])
    elif req.has_all('parent', 'label', 'flow'):
        # フローを作成する
        from streamcat.store import FlowData
        parent = factory.data.find_by_uuid(req['parent'])
        new_flow = parent.create_flow(req['label'], FlowData(req['flow']))
        # フローをDBに格納する
        new_flow.save()
        return new_flow.reload()
    else:
        raise Exception('new_flow parameter error!')

@router.put('/flows/{flow_uuid}')
@login_required_api
@jsonify
async def update_flow(request:Request, flow_uuid, factory:Factory=Depends(get_factory)):
    """
    フローのラベルを変更する、またはフローを移動する
    """
    req = RequestJson(await request.json())
    if not req.has('lock'):
        raise Exception('排他ロックのUUIDを指定してください')

    if req.has('parent'):
        if req.has('label'):
            raise Exception('labelとはparent属性は同時に指定できません')
        # flowを移動する
        flow = factory.data.find_by_uuid(flow_uuid)
        return flow.move(req['parent'], lock_uuid=req['lock'])
    elif req.has('editLock'):
        flow = factory.data.find_by_uuid(flow_uuid)
        flow.set_edit_lock(req['editLock'], lock_uuid=req['lock'])
        return flow
    elif req.has('flow'):
        from streamcat.store import FlowData
        flow = factory.data.find_by_uuid(flow_uuid)
        flow_data = FlowData(req['flow'])
        return flow.update_data(req.get('label') or flow.label, flow_data, lock_uuid=req['lock'])
    elif req.has('label'):
        flow = factory.data.find_by_uuid(flow_uuid)
        return flow.update_label(req['label'], lock_uuid=req['lock'])
    else:
        raise Exception('parent,editlock,label,flowのいずれか一つを指定してください')

@router.delete('/flows/{flow_uuid}')
@login_required_api
@jsonify
async def throw_away_flow(request:Request, flow_uuid, factory:Factory=Depends(get_factory)):
    """
    指定したフローをほかす
    """
    try:
        req = RequestJson(await request.json())
        lock_uuid = req['lock']
    except Exception:
        raise Exception('排他ロックのUUIDを指定してください')

    flow = factory.data.find_by_uuid(flow_uuid)
    return flow.throw_away(lock_uuid=lock_uuid)


@router.get('/frames/{frame_uuid}')
@login_required_api
@jsonify
def fetch_frame(request:Request, frame_uuid, contents=False, offset=0, limit=100, factory:Factory=Depends(get_factory)):
    """
    指定したフレームを取得する
    """
    import os
    from .utils import InvalidAcceptHeader

    # Frameを取得する
    frame = factory.data.find_by_uuid(frame_uuid)

    if contents:
        # リクエストヘッダを取得する
        headers = RequestHeaders(request.headers)
        if headers.accept_mimetype == 'text/csv':
            # Acceptヘッダから文字コードの指定を取得する
            # 指定がない場合は環境変数から取得する、環境変数の設定値もない場合は'UTF-8'とする
            target_encoding = headers.accept_charset or os.getenv('STREAMCAT_FRAME_CHARACTER_CODE', 'UTF-8').lower()
            if target_encoding.lower() not in ('utf-8', 'cp932'):
                raise InvalidAcceptHeader(f'Acceptヘッダに指定された文字コード({target_encoding})には対応していません')
            # フレームを取得する
            frame = factory.data.find_by_uuid(frame_uuid)
            # フレームの内容をCSVファイルで返す
            return _convert_file(frame, factory.myself, target_encoding=target_encoding)
        else:
            # フレームの内容をHTMLで返す
            from .utils import VisConverter
            result_json = frame.to_json()
            # frameの内容を取得する
            vis = _get_vis(factory, frame_uuid, args={'offset':offset, 'limit':limit})
            result_json['args'] = {'column_names':vis.column_names}
            result_json['contents'] = VisConverter(request, vis)
            return result_json
    else:
        return frame

@Constraints.allow_download_only_with_writable
def _convert_file(frame, user, target_encoding:str='UTF-8'):
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

    frame_path = frame.path
    if not frame_path.exists():
        raise Exception(f'指定されたFrame({frame.uuid})のファイル({frame_path})が存在しませんでした')

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
    from fastapi.responses import StreamingResponse
    try:
        response = StreamingResponse(convert(frame_path, source_encoding, source_newline, target_encoding, target_newline))
        response.media_type = f'text/csv; {target_encoding}'
        if downloadFileSize is not None:
            # 設定することでWebブラウザがダウンロードの進捗状況を表示してくれるかも
            response.headers['content-length'] = str(downloadFileSize)
        # filename*=はFirefox用
        response.headers['Content-Disposition'] = f'attachment; filename={downloadFileName}; filename*={downloadFileName}'
        return response
    except UnicodeDecodeError:
        raise Exception(f'指定されたFrame({frame.uuid})のファイル({frame_path})を{source_encoding}で開けませんでした')
    except UnicodeEncodeError:
        raise Exception(f'指定されたFrame({frame.uuid})のファイル({frame_path})を{target_encoding}に変換できませんでした')
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

def _get_vis(factory:Factory, frame_uuid:str, args={}):
    """
    指定したframeのVisデータを取得する
    """
    from streamcat.store import NoResultsException

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
    datasource = _make_flow(factory, frame_uuid=frame_uuid)
    job = _execute_flow(datasource, vis_args=vis_args)
    outs = _get_outs(job)
    if len(outs.outs) == 0:
        raise NoResultsException('プレビュー結果は出力されませんでした.')
    return outs.outs[0].datum


@router.post('/vizs')
@login_required_api
@jsonify
async def make_new_vis(request:Request, factory:Factory=Depends(get_factory)):
    """
    フローを実行してVisを作成する
    """
    # Vizを取得するには'vis'属性の指定が必須である
    req = RequestJson(await request.json())
    args = req.get('args') or {}
    vis_is_specified = 'vis' in args and isinstance(args['vis'], dict) and len(args['vis'].keys()) > 0
    if not vis_is_specified:
        raise Exception("Vizを取得するには'vis'属性の指定が必須です")
    # Activityを作成する
    flow = _make_flow(factory, flow_uuid=req.get('uuid'), frame_uuid=req.get('frame'), flow_json=req.get('flow'))
    return _make_new_acitivity(request, flow, req.get('lock'), req.get('args'))


@router.get('/activities/{activity_uuid}')
@login_required_api
@jsonify
def fetch_activity(activity_uuid, factory:Factory=Depends(get_factory)):
    """
    指定したActivityを取得する
    """
    return factory.data.find_by_uuid(activity_uuid)

@router.post('/activities')
@login_required_api
@jsonify
async def make_new_acitivity(request:Request, factory:Factory=Depends(get_factory)):
    """
    指定したフローを実行してActivityを作成する
    """
    # Activityを作成する
    req = RequestJson(await request.json())
    flow = _make_flow(factory, flow_uuid=req.get('uuid'), flow_json=req.get('flow'))
    return _make_new_acitivity(request, flow, req.get('lock'), req.get('args'))

def _make_flow(factory:Factory, flow_uuid:str=None, frame_uuid:str=None, flow_json:dict=None) -> object:
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
        frame = factory.data.find_by_uuid(frame_uuid)
        parent_folder = frame.find_parent()
        # datasourceは保存しないので、親フォルダはどこでも良い
        return parent_folder.create_datasource('tmp_source', parent_folder, LoaderCommand(), {'uuid':frame.uuid})
    elif flow_uuid is not None:
        # FlowのUUIDが指定された場合
        # AssertCommandがflow.folder_pathを参照するため、folder_path=Trueにする
        return factory.data.find_by_uuid(flow_uuid, folder_path=True)
    elif flow_json is not None:
        # フローJSONが指定された場合
        from streamcat.store import FlowData
        root = factory.data.load_root()
        return root.create_flow('FLOW_LITERAL', FlowData(flow_json))
    else:
        raise Exception(f'Either flow or flow uuid or frame uuid is required')

def _make_new_acitivity(request:Request, flow:object, lock_uuid:str=None, args:dict={}) -> dict:
    """
    フローを実行してActivityを作成する
    """
    from .utils import VisConverter

    def is_vis(out):
        from streamcat.store import Vis
        return isinstance(out, Vis)

    # フローを実行してApparentOutsを取得する
    job = _execute_flow(flow, args=args or {}, lock_uuid=lock_uuid)
    outs = _get_outs(job)

    return {
            'uuid' : job.activity_uuid,
            # 'type' : activity.type,
            # 'label': activity.label,
            'outs' :  [{'id'    : out.out_point.id, 
                        'label' : out.out_point.label,
                        'datum' : out.datum.uuid,
                        'parent': None if is_vis(out.datum) else out.datum.find_parent().uuid,
                        'args': {'column_names':out.datum.column_names} if is_vis(out.datum) else {},
                        'contents': VisConverter(request, out.datum) if is_vis(out.datum) else None
                        }
                        for out in outs
                      ]
    }

def _execute_flow(flow, args={}, inputs={}, vis_args={}, lock_uuid=None):
    """
    指定されたフローを実行しJobを取得する
    """
    from streamcat.engine import execute, FlowCommand
    args = args.copy()
    args.update(vis_args)
    return execute(command=FlowCommand(flow, lock_uuid), args=args, inputs=inputs)

def _get_outs(job):
    """
    Jobから実行結果を取得する
    """
    from streamcat.store import ApparentOuts
    # ApparentOutsを取得して返り値とする
    for datum in job.join().values():
        if isinstance(datum, ApparentOuts):
            outs = datum
            # 実行に失敗した場合、例外を送出する
            outs.is_success or outs.raise_one()
            # 実行結果が出力されなかった場合、例外を送出する
            if len(outs) == 0:
                break
            # 実行に成功した場合、ApparentOutsを返す
            return outs

    # ApparentOutsを取得できなかった場合は空のApparentOutsを返す
    return ApparentOuts()


@router.get('/schedules/{schedule_uuid}')
@login_required_api
@jsonify
def fetch_schedule(schedule_uuid, factory:Factory=Depends(get_factory)):
    """
    指定したスケジュールを取得する
    """
    return factory.data.find_by_uuid(schedule_uuid)

@router.post('/schedules')
@login_required_api
@jsonify
async def make_new_schedule(request:Request, factory:Factory=Depends(get_factory)):
    """
    スケジュールを作成する
    """
    req = RequestJson(await request.json())

    if req.has('source'):
        # スケジュールを複製する
        return duplicate_datum(factory, req['source'])
    else:
        parent = factory.data.find_by_uuid(req['parent'])
        args = req.get('args') or {}
        inputs = req.get('inputs') or {}
        schedule = parent.create_schedule(req['label'],
                                        req['runnable'],
                                        args=args,
                                        inputs=inputs,
                                        trigger=req['trigger'])
        schedule.save()
        return schedule.reload()

@router.put('/schedules/{schedule_uuid}')
@login_required_api
@jsonify
async def update_schedule(request:Request, schedule_uuid, factory:Factory=Depends(get_factory)):
    """
    スケジュールのラベルを変更する、またはスケジュールを移動する
    """
    req = RequestJson(await request.json())

    if req.has('parent'):
        if req.has('label'):
            raise Exception('labelとはparent属性は同時に指定できません')
        # scheduleを移動する
        schedule = factory.data.find_by_uuid(schedule_uuid)
        return schedule.move(req['parent'])
    elif req.has_all('runnable', 'trigger'):
        label = req.get('label') or schedule.label
        args = req.get('args') or {}
        inputs = req.get('inputs') or {}
        schedule = factory.data.find_by_uuid(schedule_uuid)
        return schedule.update_data(label,
                                    req['runnable'],
                                    args=args,
                                    inputs=inputs,
                                    trigger=req['trigger'])
    elif req.has('label'):
        schedule = factory.data.find_by_uuid(schedule_uuid)
        return schedule.update_label(req['label'])
    else:
        raise Exception('parent,labelのいずれか一つ、またはflowとtriggerを指定してください')

@router.delete('/schedules/{schedule_uuid}')
@login_required_api
@jsonify
def throw_away_schedule(schedule_uuid, factory:Factory=Depends(get_factory)):
    """
    指定したスケジュールをほかす
    """
    schedule = factory.data.find_by_uuid(schedule_uuid)
    return schedule.throw_away()
