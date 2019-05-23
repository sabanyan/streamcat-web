from pathlib import Path
from flask import Blueprint, jsonify, request, jsonify

# from kskp.store import CommandsPathFileSource
# from kskp.web.core import CommandsPathLink

api = Blueprint('api', __name__)

# @api.route('/commands')
# def fetch_commands():
#     """
#     コマンド定義の一覧を返す
#     """
#
#     link = CommandsPathLink(CommandsPathFileSource())
#
#     return jsonify({'success': True, 'data': link.resolve()})

# とりあえずGETだけ
@api.route('/frames', methods=['GET'])
def make_new_frames():
    """
    framesを生成する
    生成方法は以下の通り
    ・フローの実行
    ・フローのアップロード（未実装）
    """

    if 'from' in request.args:
        if '.' in request.args['from']:
            # プレビュー

            # ドットで区切って、具体的に一つだけstepを指定することができる
            # TODO: 後々この部分は文法を拡張していく予定
            froms = request.args['from'].split('.')
            flow_uuid = froms[0]
            step_id = froms[1]
        else:
            # 普通の実行
            flow_uuid = request.args['from']
            step_id = None

        result = execute_flow(flow_uuid, step_ids=[])

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

def execute_flow(flow_uuid, step_ids, inputs={}, args={}):

    # 指定されたIDのフローが存在するかどうかをチェックする
    # まずは、フローファイル一覧を取得する
    # target_flow_file_path = get_flow_path_by_uuid(flow_uuid)
    #
    # if not target_flow_file_path:
    #     # ファイルが存在しないときはここを通る
    #     return jsonify({
    #                         'success': False,
    #                         'code': -1,
    #                         'message': 'flow does not exist'
    #                     })

    try:
        result = execute_flow_internal(flow_uuid, step_ids, inputs, args)
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

def execute_flow_internal(flow_uuid, step_ids=[], inputs={}, args={}):
    """
    エンジンの実行を行い、適切な形に直して返す
    """
    # now = datetime.now()

    # @make_unfinished_history(now, session)
    # @make_finished_history(now)
    def execute_flow_by_uuid(flow_uuid, inputs={}, args={}):
        from kskp.engine import execute
        from kskp.engine import FlowJsonLink, FlowUuidLink

        # TODO:Flowがどこにあるべきか、取得方法を正式に決めないと。。。
        link = FlowUuidLink(Path('kskp/web/flows'), flow_uuid, step_ids)
        return execute(link=link, args=args, inputs=inputs)

    result = execute_flow_by_uuid(flow_uuid=flow_uuid, inputs=inputs, args=args)
    # nodes_dict = get_flow_nodes_by_uuid(flow_uuid)

    # 結果の処理
    # result_list = [{'id':key, 'uuid':value.uuid, 'label':nodes_dict.get(key).get('label')} for key, value in result.items()]
    result_list = [{'id':key, 'uuid':value.uuid} for key, value in result.items()]

    return result_list

def execute_flow_by_add_inputs(request):
    """
    inputsを与えてexecute
    ファイルは必ずuploadするのでPathFileSourceでframeを作れる
    """
    flow_uuid = request.form.get('flow_uuid')
    flow_json = fetch_flow_by_uuid(flow_uuid)

    # executeの引数
    inputs = {}
    args = json.loads(request.form.get('args')) if request.form.get('args') else {}

    upload_file_list = []

    for port in flow_json['ports'][0]:
        # frame（既にkskpに存在するデータソース）の場合
        if request.form.get(port['name']) is not None:
            # フレームを置き換える
            frame_uuid = request.form.get(port['name'])
            inputs[port['name']] = Folder.load(frame_uuid)
            continue

        # 新たにkskpにアップロードする場合
        file = request.files.get(port['name'])
        if file is not None:
            # ファイルアップロードして、フレームを置き換える
            frame_uuid = upload_frame(file, '')['uuid']
            inputs[port['name']] = Folder.load(frame_uuid)

            # 使うかわからないけど、uploadしたファイルを覚えておく
            upload_file_list.append(frame_uuid)
            continue

    # フローの実行
    result = execute_flow(flow_uuid, inputs, args)

    return result
