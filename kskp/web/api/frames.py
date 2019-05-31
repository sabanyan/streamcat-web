# 色々やっていること、考慮しなければいけないことがが多いので隔離
import json

from pathlib import Path
from flask import Blueprint, jsonify, request, jsonify

from .auth import login_required_api

mod = Blueprint('frames', __name__)

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
        from kskp.engine import execute
        from kskp.engine import FlowJsonLink, FlowUuidLink

        # TODO:Flowがどこにあるべきか、取得方法を正式に決めないと。。。
        link = FlowUuidLink(Path('kskp/data/flows'), flow_uuid, step_ids)
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
    from kskp.engine import Folder
    from kskp.store import fetch_flow_by_uuid

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
