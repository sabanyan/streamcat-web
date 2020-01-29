# 色々やっていること、考慮しなければいけないことがが多いので隔離
import json
import os
import time

from pathlib import Path
from flask import Blueprint, jsonify, request, jsonify, session
from kskp.store import Datum, Frame, Flow, Folder
from kskp.web.backend import app

from .auth import login_required_api
from .utils import api_base, frame_api_base

mod = Blueprint('frames', __name__)

@mod.route('/frames/<frame_uuid>')
@login_required_api
@api_base
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """
    # オフセットのデフォルトは最初から（なので０）、limitはとりあえず1000行
    offset = int(request.args.get('offset')) if request.args.get('offset') else 0
    limit = int(request.args.get('limit')) if request.args.get('limit') else 999
    no_contents = True if request.args.get('no_contents') else False

    frame = Frame.find_by_uuid(frame_uuid)
    result = csv_to_frame(frame, no_contents=no_contents, offset=offset, limit=limit)

    if request.args.get('header_only') == '1':
        # headerのカラムに改行コードが含まれているケースの対応
        if result.get('contents') is None:
            raise Exception('not use "no_contents" in query parameter')
        headers = []
        for column in result['contents']:
            headers.append(column.replace('\n',''))
        result = headers

    return result

def csv_to_frame(frame, no_contents=False, offset=0, limit=None):
    """
    指定されたCSVファイルを読み込んで、
    詳細情報なども含んだframeを表すdictを返す
    """
    def format_time(file_path):
        """
        指定されたファイルの最終更新時間をyyyy/MM/dd HH:MMで返却する
        """
        wk = time.localtime(os.path.getmtime(file_path))
        return time.strftime('%Y/%m/%d %H:%M', wk)

    result = {}

    if not no_contents:
        contents, number_of_lines = frame.load_as_data_frame(offset, limit)
        result['contents'] = contents
        # 行数は一旦返さないことにする
        # result['numberOfLines'] = number_of_lines
    result['fileSize'] = frame.file_size
    result['lastModifiedAt'] = frame.modified_at_str

    return result

# def load_as_data_frame(path_obj, offset, limit):
#     """
#     CSVの文字列を受け取り、
#     いわゆるデータフレームの形式にして返す
#     TODO: offsetはつかってない
#     """
#     result_text = ''
#     result_data = {}
#     column_list = []
#     with path_obj.open(encoding='utf-8') as f:
#         n = 0
#         limit_count = 0

#         for line in f:
#             if limit is not None and limit_count == limit:
#                 break

#             if n == 0:
#                 # 一行目はヘッダとみなす
#                 # 重複文字があればインデックスをつける
#                 column_list = replace_column_name(line.split(','))
#                 for column_name in column_list:
#                     result_data[column_name] = []
#             else:
#                 if offset < n:
#                     for idx, column_data in enumerate(line.split(',')):
#                         result_data[column_list[idx]].append(column_data)
#                     limit_count += 1
#             n += 1

#     if n == 0:
#         raise Exception('空のCSVを読み込みました。コマンド実行時にエラーが発生した可能性があります。')

#     result_len = n

#     # 行数も返すように変更
#     return result_data, result_len

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

@mod.route('/frames/<frame_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_frame(frame_uuid):
    """
    frameのラベルを修正する、またはframeを移動する
    """
    if ('label'  not in request.json or request.json['label']  == '') and \
       ('parent' not in request.json or request.json['parent'] == ''):
        raise Exception('labelまたはparent属性を指定してください')
    elif 'label' in request.json and 'parent' in request.json:
        raise Exception('labelとはparent属性は同時に指定できません')
        
    if 'label' in request.json and request.json['label'] != '':
        # frameのラベルを修正する
        label = request.json['label']
        modifier = session['user_id']
        return Frame.update_data(frame_uuid, label, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # frameを移動する
        new_parent = request.json['parent']
        modifier = session['user_id']
        frame = Frame.find_by_uuid(frame_uuid)
        return frame.move(new_parent, modifier)
    else:
        raise Exception('update_frame parameter error!')

@mod.route('/frames/<frame_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_frame(frame_uuid):
    """
    指定したframeを物理削除する
    """
    from kskp.store import get_all_frame_uuid_in_frame, Flow

    frame = Frame.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')

    # 削除しようとするframeが、フローで使用されている場合は例外を送出する
    for flow in Flow.find_all_flows():
        using_frame_uuids = get_all_frame_uuid_in_frame(flow.uuid)
        if frame_uuid in using_frame_uuids:
            raise Exception('このCSVファイルはフロー(%s)で使用しているため削除できません' % flow.label)

    # フレームを削除する
    frame.delete()
    return frame

@mod.route('/frames', methods=['POST'])
@login_required_api
def create_frame():
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
            new_frame = Frame(request.form.get('parent')
                            , request.form.get('label')
                            , request.files.get('file').stream
                            , creator=session['user_id'])
            # documentレコードをDBに格納する
            new_frame.save()
            return jsonify({'success': True, 'data': new_frame})

        elif request.json.get('flow_uuid'):
            # 
            # フロー一覧から実行する
            # 
            flow_uuid = request.json.get('flow_uuid')
            args = request.json.get('args') if request.json.get('args') else {}
            inputs = _make_flow_inputs(flow_uuid, request)
            # フローの実行
            flow = Flow.find_by_uuid(flow_uuid)
            result = execute_flow(flow, args=args, inputs=inputs)
            result = format_result(result)
            return jsonify({'success': True, 'lasts': result})
        
        else:
            raise Exception('引数等の指定が誤っています')
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
                        'success': False,
                        'code'   : -1,
                        'message': str(e)
                      })

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

    flow = Flow.find_by_uuid(flow_uuid)     
    activity = execute_flow(flow)
    return format_result(activity)

@mod.route('/vizs/<frame_uuid>', methods=['POST'])
@login_required_api
@frame_api_base
def fetch_vis(frame_uuid):
    """
    指定したframeのVisデータを直接UUIDで指定して取得する
    """
    vis_args = {"d" : request.json}

    import uuid
    from kskp.store import Datum, DataSource
    from kskp.depo.std.commands import LoaderCommand
    from kskp.engine import Step
    parent_folder = Datum.find_parent(frame_uuid)
    loader_step = Step(str(uuid.uuid4()), LoaderCommand(), {'uuid': frame_uuid})
    datasource = DataSource(None, 'tmp_source', parent_folder, loader_step, session['user_id'])
    activity = execute_flow(datasource, vis_args=vis_args)
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

    flow = Flow.find_by_uuid(flow_uuid)
    activity = execute_flow(flow, vis_args=vis_args)
    return format_vis(activity)

def run_flow_by_websocket(websocket_message, dlog_path):
    flow_uuid = websocket_message['flowUUID']
    args = websocket_message['args'] if websocket_message['args'] else {}

    # log出力のため、dlog pathの設定
    args['dlog'] = dlog_path

    from kskp.store import Library, NysolModule, fetch_flow_by_uuid

    flow_json = fetch_flow_by_uuid(flow_uuid)    
    # make_flow_inputs
    inputs = {}
    for port in flow_json['ports'][0]:
        # frame（既にkskpに存在するデータソース）の場合
        if websocket_message[port['nodeId']] is not None:
            # フレームのUUIDを取得する
            frame_uuid = websocket_message[port['nodeId']]
            # 指定したuuidのframeを取得する
            nysol_module = _load_frame(frame_uuid)
            inputs[port['nodeId']] = nysol_module
            continue

    flow = Flow.find_by_uuid(flow_uuid)
    result = execute_flow_by_websocket(flow, args=args, inputs=inputs, dlog_path=dlog_path)
    result = format_result(result)

    return result

def execute_flow_by_websocket(flow, args={}, inputs={}, vis_args={}, dlog_path=None):
    """
    指定されたフローを実行し実行結果を取得する
    """
    try:
        from kskp.engine import execute, FlowJsonLink
        
        link = FlowJsonLink(flow, vis_args, None, dlog_path)
        activity = execute(link=link, args=args, inputs=inputs)
        
        if not activity:
            raise Exception('実行結果は出力されませんでした')
        return activity
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(str(e))

def execute_flow(flow, args={}, inputs={}, vis_args={}, job_complete_handler=None):
    """
    指定されたフローを実行し実行結果を取得する
    """
    try:
        from kskp.engine import execute, FlowJsonLink
        link = FlowJsonLink(flow, vis_args)
        activity = execute(link=link, args=args, inputs=inputs, job_complete_handler=job_complete_handler)
        if not activity:
            raise Exception('実行結果は出力されませんでした')
        return activity
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(str(e))

def format_result(activity):
    from kskp.store import Activity
    return [{'id':point.id, 'uuid':frame.uuid, 'label':point.label} for point, frame in activity.result]

def format_vis(activity):
    from kskp.store import Activity
    return [{'id':point.id, 'args':{'column_names': vis.column_names}, 'contents': vis} for point, vis in activity.result]

def _make_flow_inputs(flow_uuid, request):
    """
    inputsを作成する
    """
    from kskp.store import Library, NysolModule, fetch_flow_by_uuid

    flow_json = fetch_flow_by_uuid(flow_uuid)

    # executeの引数
    inputs = {}

    for port in flow_json['ports'][0]:
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
    loader = CommandLink('loader').resolve()
    result = loader.run({'uuid':frame_uuid}, {'store':Folder(None, '')})
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
