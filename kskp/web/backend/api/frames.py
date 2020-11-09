# 色々やっていること、考慮しなければいけないことがが多いので隔離

from pathlib import Path
from flask import Blueprint, jsonify, request, g
from .auth import login_required_api
from .utils import (
    api_base,
    frame_api_base,
    RequestJson
)

mod = Blueprint('frames', __name__)

@mod.route('/frames', methods=['GET'])
@login_required_api
@frame_api_base
def make_new_frames():
    """
    フローを実行してフレームを取得する
    """
    step_ids = []

    if 'from' not in request.args:
        raise Exception('No frame parameter is designated')

    if '.' in request.args['from']:
        # Vis
        # ドットで区切って、具体的に一つだけstepを指定することができる
        # TODO: 後々この部分は文法を拡張していく予定
        froms = request.args['from'].split('.')
        flow_uuid = froms[0]
        step_ids.append(froms[1])
    else:
        # 普通の実行
        flow_uuid = request.args['from']

    flow = g.factory.data.find_by_uuid(flow_uuid)     
    activity = execute_flow(flow, g.factory)
    return format_result(activity)

@mod.route('/frames/<frame_uuid>')
@login_required_api
@api_base
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """
    # オフセットのデフォルトは最初から（なので０）、limitはとりあえず1000行
    # offset = int(request.args.get('offset')) if request.args.get('offset') else 0
    # limit = int(request.args.get('limit')) if request.args.get('limit') else 999
    # no_contents = True if request.args.get('no_contents') else False

    frame = g.factory.data.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')

    result = csv_to_frame(frame)  

    # if request.args.get('header_only') == '1':
    #     # headerのカラムに改行コードが含まれているケースの対応
    #     if result.get('contents') is None:
    #         raise Exception('not use "no_contents" in query parameter')
    #     headers = []
    #     for column in result['contents']:
    #         headers.append(column.replace('\n',''))
    #     result = headers

    return result

def csv_to_frame(frame, no_contents=False, offset=0, limit=None):
    """
    指定されたCSVファイルを読み込んで、
    詳細情報なども含んだframeを表すdictを返す
    """
    result = {}

    # if not no_contents:
    #     contents, number_of_lines = frame.load_as_data_frame(offset, limit)
    #     result['contents'] = contents
    #     # 行数は一旦返さないことにする
    #     # result['numberOfLines'] = number_of_lines
    result['encoding'] = frame.encoding_str
    result['newline'] = frame.newline_str
    result['fileSize'] = frame.file_size
    result['lastModifier'] = frame.modifier_str
    result['lastModifiedAt'] = frame.modified_at_str

    return result

@mod.route('/frames', methods=['POST'])
@login_required_api
def create_frame():
    from kskp.store import NoResultsException
    try:
        if 'file' in request.files:
            # 
            # Frameをアップロードする
            # 
            if request.files.get('file') is None:
                raise Exception('No frame file found.')
            if 'parent' not in request.form:
                raise Exception('No parent is designated.')
            if 'label' not in request.form:
                raise Exception('No label is designated.')
            
            # parentとlabel属性があれば新形式のPOST /framesだとみなす
            parent = g.factory.data.find_by_uuid(request.form.get('parent'))
            new_frame = parent.create_frame(request.form.get('label')
                                            , request.files.get('file').stream)
            # documentレコードをDBに格納する
            new_frame.save()
            return jsonify({'success': True, 'data': new_frame})

        elif request.json.get('flow_uuid'):
            # 
            # フロー一覧から実行する
            # 
            flow_uuid = request.json.get('flow_uuid')
            args = request.json.get('args') if request.json.get('args') else {}
            inputs = _make_flow_inputs(g.factory, flow_uuid, request)
            # フローの実行
            flow = g.factory.data.find_by_uuid(flow_uuid)
            result = execute_flow(flow, g.factory, args=args, inputs=inputs)
            result = format_result(result)
            return jsonify({'success': True, 'lasts': result})
        
        else:
            raise Exception('引数等の指定が誤っています')

    except NoResultsException as e:
        return jsonify({
                        'success': False,
                        'code'   : -4,
                        'message': str(e)
                    })    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
                        'success': False,
                        'code'   : -1,
                        'message': str(e)
                      })

@mod.route('/frames/<frame_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_frame(frame_uuid):
    """
    frameのラベルを修正する、またはframeを移動する
    """
    req = RequestJson(request.json)

    if req.has_no_all('parent', 'label', 'encoding', 'newline'):
        raise Exception('label,encoding,newlineまたはparent属性を指定してください')
    elif req.has('parent') and req.has_at_least('label', 'encoding', 'newline'):
        raise Exception('label,encoding,newlineとはparent属性は同時に指定できません')

    frame = g.factory.data.find_by_uuid(frame_uuid)

    if req.has('parent'):
        # frameを移動する
        new_parent = req['parent']
        return frame.move(new_parent)

    else:
        if req.has('label'):
            # frameのラベルを修正する
            label = req['label']
            # ret = Frame.update_label(frame_uuid, label, modifier)
            ret = frame.update_label(label)

        if req.has_all('encoding', 'newline'):
            encoding_str = req['encoding']
            newline_str = req['newline']
            ret = frame.update_encoding_newline(encoding_str, newline_str)

        if ret is None:
            raise Exception('update_frame parameter error!')

        return ret

@mod.route('/frames/<frame_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_frame(frame_uuid):
    """
    指定したframeをほかす
    """
    frame = g.factory.data.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')
    frame.throw_away()

@mod.route('/vizs/<frame_uuid>', methods=['POST'])
@login_required_api
@frame_api_base
def fetch_vis(frame_uuid):
    """
    指定したframeのVisデータを直接UUIDで指定して取得する
    """
    vis_args = {"d" : request.json}

    import uuid
    from kskp.depo.std.commands import LoaderCommand
    from kskp.engine import Step

    frame = g.factory.data.find_by_uuid(frame_uuid)
    parent_folder = frame.find_parent()
    loader_step = Step(str(uuid.uuid4()), LoaderCommand(), {'uuid': frame_uuid})
    datasource = g.factory.data.create_datasource(None, 'tmp_source', parent_folder, loader_step)
    activity = execute_flow(datasource, g.factory, vis_args=vis_args)
    return format_vis(activity)

@mod.route('/vizs', methods=['POST'])
@login_required_api
@frame_api_base
def make_new_viss():
    """
    Visデータを取得する
    """
    if 'from' not in request.args:
        raise Exception('from引数を指定してください')

    flow_uuid = request.args['from']
    vis_args = request.json

    flow = g.factory.data.find_by_uuid(flow_uuid)
    activity = execute_flow(flow, g.factory, vis_args=vis_args)
    return format_vis(activity)

def execute_flow(flow, session, args={}, inputs={}, vis_args={}):
    """
    指定されたフローを実行し実行結果を取得する
    """
    try:
        from kskp.store import Activity, NoResultsException
        from kskp.engine import execute, FlowJsonLink
        link = FlowJsonLink(flow, session, vis_args)
        lasts = execute(link=link, args=args, inputs=inputs)

        # Activityを取得して返り値とする
        for point_id, datum in lasts.items():
            if isinstance(datum, Activity):
                activity = datum
                # 実行に失敗した場合、例外を送出する
                activity.is_success or activity.raise_one()
                # 実行に成功した場合、Activityを返す
                return activity

        # Activityを取得できなかった場合
        raise NoResultsException('実行結果は出力されませんでした')

    except Exception as e:
        # import traceback
        # traceback.print_exc()
        # raise Exception(str(e))
        raise

def format_result(activity):
    from kskp.store import Activity
    return [{'id':point.id, 'uuid':frame.uuid, 'label':point.label} for point, frame in activity.lasts]

def format_vis(activity):
    from kskp.store import Activity
    # キャッシュ設定=ONのポイントをプレビューするとactivity.resultには、そのポイントにCacheとVisが紐づく
    return [{'id':point.id, 'args':{'column_names': vis.column_names}, 'contents': vis} for point, vis in activity.lasts]

def _make_flow_inputs(factory, flow_uuid, request):
    """
    inputsを作成する
    """
    flow_data = factory.data.find_by_uuid(flow_uuid).flow_data

    # executeの引数
    inputs = {}

    for port in flow_data.ports[0]:
        # frame（既にkskpに存在するデータソース）の場合
        if request.json.get(port['nodeId']) is not None:
            # フレームのUUIDを取得する
            frame_uuid = request.json.get(port['nodeId'])
            # 指定したuuidのframeを取得する
            nysol_module = _load_frame(frame_uuid)
            inputs[port['nodeId']] = nysol_module
            continue

        # 新たにkskpにアップロードする場合
        file = request.files.get(port['nodeId'])
        if file is not None:
            # ファイルアップロードして、フレームを置き換える
            # from kskp.web.backend.api.basic import upload_frame
            frame_uuid = _upload_frame(file, '')['uuid']
            # 指定したuuidのframeを取得する
            nysol_module = _load_frame(frame_uuid)
            inputs[port['nodeId']] = nysol_module
            continue

    return inputs

def _load_frame(frame_uuid):
    # Loaderを用いて指定したuuidのframeを取得する
    from kskp.depo.std.commands import CommandLink
    store = g.factory.data.find_by_uuid(frame_uuid).find_parent()
    loader = CommandLink('loader').resolve()
    result = loader.run({'uuid':frame_uuid}, {'store':store})
    # NYSOLコマンドを返す
    nysol_module = result['o']
    return nysol_module

def _upload_frame(file, file_name):
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

@mod.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
