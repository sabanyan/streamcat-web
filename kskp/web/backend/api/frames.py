from flask import (
    Blueprint,
    request,
    g
)
from kskp.core import Datum
from kskp.store.lock import lock_manager
from .utils import (
    RequestJson,
    api_base,
    login_required_api
)

mod = Blueprint('frames', __name__)

@mod.route('/locks', methods=['POST'])
@login_required_api
@api_base
def make_new_lock():
    """
    ロックを獲得する
    """
    req = RequestJson(request.json)
    if not req.has('target'):
        raise Exception('排他ロック対象データのuuidを指定してください')

    if req.has('lastModifiedAt'):
        # 排他ロックの再取得の場合
        from datetime import datetime
        target = g.factory.data.find_by_uuid(req['target'])
        last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
        lock = lock_manager.relock(target, lastModifiedAt=last_modified_at, creator=g.user)
    else:
        # 排他ロックの新規取得の場合
        # (新規取得の場合はfind_by_uuid()の実行で遅くしたくない)
        lock = lock_manager.lock(req['target'], creator=g.user)
    
    return lock.to_json()

@mod.route('/extend-locks/<lock_uuid>', methods=['POST'])
@login_required_api
@api_base
def extend_lock(lock_uuid):
    """
    ロックの有効期間を延長する
    """
    from kskp.store.lock import LockedDatumException
    if not lock_manager.contains(lock_uuid):
        raise LockedDatumException(f'Lock ({lock_uuid}) is already expired')

@mod.route('/delete-locks', methods=['POST'])
@login_required_api
@api_base
def delete_all_locks():
    """
    指定したuuidのロックを解除する
    全てのロックを解除する
    """
    if 'of' in request.args:
        target_uuid = request.args['of']
        return lock_manager.unlock_target(target_uuid)
    else:
        return lock_manager.unlock_all()

"""
frontendのNavagator.sendBeacon()に対応するため、下記のように変更
methods: DELETE => POST
url=/locks/<lock_uuid> => /delete-locks/<lock_uuid>に変更
"""
@mod.route('/delete-locks/<lock_uuid>', methods=['POST'])
@login_required_api
@api_base
def delete_lock(lock_uuid):
    """
    ロックを解除する
    """ 
    return lock_manager.unlock(lock_uuid)


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


    # Apache Beamライブラリデータソースを作成する
    # TODO: 間に合わせの実装
    label = 'ライブラリ(Apache Beam)'
    loader_cmd = CommandLink('beam_loader').resolve()
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
@api_base
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

    return subflow_data_list

@mod.route('/commands')
@api_base
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

    return commands_list

@mod.route('/visualizers')
@api_base
def fetch_visualizers():
    """
    ビジュアライズ用コマンド定義の一覧を返す
    """
    from kskp.depo.std.commands import CommandsPathLink, CommandsPathFileSource

    link = CommandsPathLink(CommandsPathFileSource('vcmd'))
    return link.resolve()


@mod.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_flow(flow_uuid):
    """
    指定されたフローを取得する
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
        from kskp.store import FlowData
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
    指定されたフローをほかす
    """
    try:
        req = RequestJson(request.json)
        lock_uuid = req['lock']
    except Exception:
        raise Exception('ロックのUUIDを指定してください')

    flow = g.factory.data.find_by_uuid(flow_uuid)
    flow.throw_away(lock_uuid=lock_uuid)


@mod.route('/frames/<frame_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_frame(frame_uuid):
    """
    Frameを取得する
    """
    contents = request.args.get('contents') is not None
    offset = request.args.get('offset') or 0
    limit = request.args.get('limit') or 100

    # Frameを取得する
    frame = g.factory.data.find_by_uuid(frame_uuid)

    if contents:
        from .utils import VisConverter
        result_json = frame.to_json()
        # frameの内容を取得する
        vis = _get_vis(frame_uuid, args={'offset':offset, 'limit':limit})
        result_json['args'] = {'column_names':vis.column_names}
        result_json['contents'] = VisConverter(vis)
        return result_json
    else:
        return frame

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
    指定されたActivityを取得する
    """
    return g.factory.data.find_by_uuid(activity_uuid)

@mod.route('/activities', methods=['POST'])
@login_required_api
@api_base
def make_new_acitivity():
    """
    フローを実行してActivityを作成する
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
        from kskp.depo.std.commands import LoaderCommand
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
        from kskp.store import FlowData
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
        from kskp.store import Vis
        return isinstance(out, Vis)

    # フローを実行してActivityを作成する
    activity = _execute_flow(flow, args=args or {}, lock_uuid=lock_uuid)

    return {'uuid' : activity.uuid,
            'type' : activity.type,
            'label': activity.label,
            'outs' :  [{'id'    : point.id, 
                        'label' : point.label,
                        'uuid'  : out.uuid,
                        'parent': None if is_vis(out) else out.find_parent().uuid,
                        'args': {'column_names':out.column_names} if is_vis(out) else {},
                        'contents': VisConverter(out) if is_vis(out) else None
                        }
                        for point, out in activity.outs
                      ]
    }

def _execute_flow(flow, args={}, inputs={}, vis_args={}, lock_uuid=None):
    """
    指定されたフローを実行し実行結果を取得する
    """
    from kskp.store import Activity, NoResultsException
    from kskp.engine import execute, FlowCommand

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
    schedule = parent.create_schedule(req['label'], req['flow'], args=args, trigger=req['trigger'])
    schedule.save()
    return schedule.reload()

@mod.route('/schedules/<schedule_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_schedule(schedule_uuid):
    """
    スケジュールをほかす
    """
    schedule = g.factory.data.find_by_uuid(schedule_uuid)
    schedule.throw_away()
