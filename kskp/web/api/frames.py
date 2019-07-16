# 色々やっていること、考慮しなければいけないことがが多いので隔離
import json
import os
import time

from pathlib import Path
from flask import Blueprint, jsonify, request, jsonify, session
from kskp.store import FrameModel
from kskp.web import app

from .auth import login_required_api
from .utils import api_base

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

    frame = FrameModel.find_by_uuid(frame_uuid)
    result = csv_to_frame(frame.path_obj, no_contents=no_contents, offset=offset, limit=limit)

    if request.args.get('header_only') == '1':
        # headerのカラムに改行コードが含まれているケースの対応
        if result.get('contents') is None:
            raise Exception('not use "no_contenst" in query parameter')
        headers = []
        for column in result['contents']:
            headers.append(column.replace('\n',''))
        result = headers

    return result

def csv_to_frame(file_path, no_contents=False, offset=0, limit=None):
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
        contents, number_of_lines = load_as_data_frame(file_path, offset, limit)
        result['contents'] = contents
        # 行数は一旦返さないことにする
        # result['numberOfLines'] = number_of_lines
    result['fileSize'] = os.path.getsize(file_path)
    result['lastModifiedAt'] = format_time(file_path)

    return result

def load_as_data_frame(path_obj, offset, limit):
    """
    CSVの文字列を受け取り、
    いわゆるデータフレームの形式にして返す
    TODO: offsetはつかってない
    """
    result_text = ''
    result_data = {}
    column_list = []
    with path_obj.open(encoding='utf-8') as f:
        n = 0
        limit_count = 0

        for line in f:
            if limit is not None and limit_count == limit:
                break

            if n == 0:
                # 一行目はヘッダとみなす
                # 重複文字があればインデックスをつける
                column_list = replace_column_name(line.split(','))
                for column_name in column_list:
                    result_data[column_name] = []
            else:
                if offset < n:
                    for idx, column_data in enumerate(line.split(',')):
                        result_data[column_list[idx]].append(column_data)
                    limit_count += 1
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

@mod.route('/frames/<frame_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_frame(frame_uuid):
    """
    指定したframeのラベル名を変更する
    """
    label = request.json['label']
    modifier = session['user_id']
    FrameModel.update_data(frame_uuid, label, modifier)
    return

@mod.route('/frames/<frame_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_frame(frame_uuid):
    """
    指定したframeを物理削除する
    """
    from kskp.store import get_all_frame_uuid_in_frame, FLOW_PATH

    frame = FrameModel.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')

    # 削除しようとするframeが、フローで使用されている場合は例外を送出する
    for flow_path in Path(FLOW_PATH).iterdir():
        if not flow_path.suffix == '.json':
            continue
        flow_uuid = flow_path.stem
        using_frame_uuids = get_all_frame_uuid_in_frame(flow_uuid)
        if frame_uuid in using_frame_uuids:
            raise Exception('このCSVファイルはフロー(%s)で使用しているため削除できません' % flow_uuid)

    # フレームを削除する
    frame.delete()
    return

@mod.route('/frames', methods=['GET', 'POST'])
@login_required_api
def make_new_frames():
    """
    framesを生成する
    生成方法は以下の通り
    ・フローの実行
    ・フローのアップロード（未実装）
    """
    step_ids = []
    if 'from' in request.args:
        if '.' in request.args['from']:
            # プレビュー

            # ドットで区切って、具体的に一つだけstepを指定することができる
            # TODO: 後々この部分は文法を拡張していく予定
            froms = request.args['from'].split('.')
            flow_uuid = froms[0]
            step_ids.append(froms[1])
        else:
            # 普通の実行
            flow_uuid = request.args['from']

        result = execute_flow(flow_uuid, step_ids=step_ids)

        return result
    elif request.json.get('flow_uuid'):
        # 一覧より実行
        return execute_flow_by_add_inputs(request)
    else:
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'invalid json'
                        })

def execute_flow(flow_uuid, step_ids, args={}, inputs={}):
    """
    フローの実行を行う
    実行後の判定など
    """
    from kskp.store import get_flow_path_by_uuid
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

    try:
        result = execute_flow_internal(flow_uuid, step_ids, args, inputs)
        if not result:
            return jsonify({
                                'success': False,
                                'code': -1,
                                'message': 'result is empty.'
                               })
        else:
            return jsonify({'success': True, 'lasts': result})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': repr(e)
                        })

def execute_flow_internal(flow_uuid, step_ids=[], args={}, inputs={}):
    """
    エンジンの実行を行い、適切な形に直して返す
    """
    from kskp.store import get_flow_nodes_by_uuid

    def execute_flow_by_uuid(flow_uuid, inputs={}, args={}):
        from kskp.engine import execute,FlowJsonLink, FlowUuidLink
        from kskp.store import FLOW_PATH

        # TODO:Flowがどこにあるべきか、取得方法を正式に決めないと。。。
        link = FlowUuidLink(Path(FLOW_PATH), flow_uuid, step_ids)
        return execute(link=link, args=args, inputs=inputs)

    result = execute_flow_by_uuid(flow_uuid=flow_uuid, inputs=inputs, args=args)
    nodes_dict = get_flow_nodes_by_uuid(flow_uuid)

    # 結果の処理
    result_list = [{'id':key, 'uuid':value.uuid, 'label':nodes_dict.get(key).get('label')} for key, value in result.items()]

    return result_list

def execute_flow_by_add_inputs(request):
    """
    inputsを与えてexecute
    """
    from kskp.store import Folder, fetch_flow_by_uuid

    folder = Folder(Path('kskp/data'))

    # プレビューとかすることがあるかもしれないから
    step_ids = []

    flow_uuid = request.json.get('flow_uuid')
    flow_json = fetch_flow_by_uuid(flow_uuid)

    # executeの引数
    inputs = {}
    args = json.loads(request.json.get('args')) if request.json.get('args') else {}

    upload_file_list = []

    for port in flow_json['ports'][0]:
        # frame（既にkskpに存在するデータソース）の場合
        if request.json.get(port['nodeId']) is not None:
            # フレームを置き換える
            frame_uuid = request.json.get(port['nodeId'])
            inputs[port['nodeId']] = folder.load(frame_uuid)
            continue

        # 新たにkskpにアップロードする場合
        file = request.files.get(port['nodeId'])
        if file is not None:
            # ファイルアップロードして、フレームを置き換える
            frame_uuid = upload_frame(file, '')['uuid']
            inputs[port['nodeId']] = folder.load(frame_uuid)

            # 使うかわからないけど、uploadしたファイルを覚えておく
            upload_file_list.append(frame_uuid)
            continue

    # フローの実行
    result = execute_flow(flow_uuid, step_ids, args, inputs)

    return result

@mod.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
