# TODO: 実装を進めていって、使い始めたものからコメントアウトしていく
import os
from flask import Blueprint, request, jsonify, g, render_template, redirect, url_for
from .auth import login_required_api
from .frames import execute_flow
from .utils.navigation import update_navigation
from .utils import api_base, lock_required
from kskp.store import *
from kskp.engine import execute, FlowJsonLink
from kskp.web.backend import app
from pathlib import Path
import json
from kskp.store import (
    Datum,
    Folder,
    DatabaseConn,
    Flow
)

mod = Blueprint('assert', __name__)
@mod.route('/flow_tester', methods=['GET'])
@login_required_api
# @update_navigation
# @api_base
def get_all_uuid():
    """
    入力された階層およびより下に存在するflow_uuidを全て取得する

    get_cuttent_uuids
    初期呼び出しの引数には、

    1.any_uuidのフォルダパス
    2.set() <- 最初は空なんじゃないかな
    3.any_uuid

    でOK!（多分）
    """
    session = g.factory._session

    # # -----------動作チェック領域1

    # flow_uuid_getter = Flow_uuid_getter(g.factory)
    # any_uuid = request.args.get('uuid')
    root_datum = g.factory.data.load_root()

    # list_uuid = flow_uuid_getter.get_folder(root_datum, set(), any_uuid)
    # # -----------動作チェック領域1

    # -----------動作チェック領域2
    # flow_uuid = request.args.get('uuid')
    # uuid_list = {flow_uuid}
    # make_mcat_json(uuid_list)
    # -----------動作チェック領域2

    # -----------動作チェック領域3
    flow_uuid_getter = Flow_uuid_getter(g.factory)
    any_uuid = request.args.get('uuid')
    root_datum = g.factory.data.load_root()
    list_uuid = flow_uuid_getter.get_folder(root_datum, set(), any_uuid)
    
    # print(list_uuid)
    mcat_flow_json = make_mcat_json(list_uuid)
    # print(mcat_flow_json)
    # print(mcat_flow_json["label"])
    # execute_flow(mcat_flow_json, g.factory)
    # print(mcat_flow_json)
    from kskp.store  import Flow

    # flow_store = Store(None, None, 'flow',mcat_flow_json['label'])
    # flow_link = flow_store.create_flow(mcat_flow_json['label'], mcat_flow_json)
    

    # Flowオブジェクト作成時、どうしてもFlow.pyの271行目のゴミ箱チェックで引っかかる（ゴミ箱に何もないのに）
    # ->　解決、load_rootでdatum作成で、そのdatumが作成する仕組みを持つ
    # flow_link = Flow(session, None, mcat_flow_json['label'], mcat_flow_json)
    flow_link = root_datum.create_flow("All_asserted_flow", mcat_flow_json)

    # print("mcat_flow_json")
    # print(mcat_flow_json)
    # mcat_flow_json = create_flow(mcat_flow_json['label'], mcat_flow_json)
    # import uuid
    # mcat_flow_json.uuid = str(uuid.uuid4()) 
    # mcat_flow_json.save()
    flow_link = FlowJsonLink(flow_link, g.factory)
    lasts = execute(flow_link,{},{})
    # print('check2')
    lasts = convert_from_activity(lasts)
    # print(lasts['mcat_output'])]

    
    # print(g.factory.data.find_by_uuid(lasts[0]['uuid']))
    # print(lasts)
    # -----------動作チェック領域3
   

    result = "成功"
    # テスト結果の情報を元に、returnするjsonを作成、返却する
    if root_datum:
        # return render_template('result_assert.html', result_assert="成功")
        return render_template('result_assert.html', test_result=mcat_flow_json)
    else:
        return render_template('result_assert.html', test_result=mcat_flow_json)




import uuid
from kskp.core import Datum
from kskp.store import Store
from kskp.store.flow_dumper import FlowDumper
from pathlib import Path

class Flow_uuid_getter(FlowDumper):
    def __init__(self,factory):
        self.factory = factory

        self.tmp_path = Path('/tmp')
        self.gathering_path = self.tmp_path / str(uuid.uuid4())
        self.gathering_path.mkdir()
        self.labels_path = self.gathering_path / 'labels.txt'
    
    def get_folder(self,parent_path, gathered_uuids, folder_uuid):
        f_data = self.factory.data
        folder_frame = f_data.find_by_uuid(folder_uuid)
        parent_path = folder_frame.get_current_folder_path(str(folder_uuid))
        
        if isinstance(folder_frame, Flow):
            # 対象がflowだった場合
            return {folder_frame.uuid}

        children = folder_frame.find_children()

        if len(children) == 0:
            return gathered_uuids

        for child in children:
            # print(child.uuid)
            # print(child.type)
            # どうやらget_flowを行う中で、flow中のcsvデータのUUIDも引っ張ってきている様子
            if isinstance(child, Folder):
                # print(1)
                gathered_uuids.union(self.get_folder(Path(parent_path), gathered_uuids, child.uuid))
            elif child.type == Datum.FLOW_TYPE:
                # print(2)
                gathered_uuids.union(self.get_flow(Path(parent_path), gathered_uuids, child.uuid))

        catch_other_uuid_list = []
        for catch_other_uuid in gathered_uuids:
            if isinstance(f_data.find_by_uuid(catch_other_uuid),Flow ):
                continue
            else:
                catch_other_uuid_list.append(catch_other_uuid)
        
        for remove_uuid in catch_other_uuid_list:
            gathered_uuids.discard(remove_uuid)
        
        return gathered_uuids


    def get_flow(self, parent_tmp_path, gathered_uuids, flow_uuid):
        import os

        (frame_uuids, store_uuids, flow_uuids) = self.get_flows_and_frames(flow_uuid, exclude_uuids=gathered_uuids)

        uuid_type_label = []

        for flow_uuid in flow_uuids:
            flow = self.factory.data.find_by_uuid(flow_uuid, type=Datum.FLOW_TYPE)
            flow_path = parent_tmp_path / (flow.uuid + '.json')
            # with flow_path.open('w') as f:
            #     f.write(json.dumps(flow.flow_data.to_json(), indent=2, ensure_ascii=False))
            uuid_type_label.append((flow.uuid, flow.type, flow.label))

        return gathered_uuids

@mod.route('/flow_test_checker/<any_uuid>', methods=['POST'])
@login_required_api
@update_navigation
@api_base
def start_assert_cmd(any_uuid):
    """
    あるflowもしくはproject内のflow全てのassertコマンドの実行結果を表示する
    """
    # 入力はuuid,flowか、projectのuuidが対象
    root_datum = g.factory.data.load_root()
    flow_uuid_getter = Flow_uuid_getter(g.factory)
    any_uuid = request.args.get('uuid')

    # もしprojectのuuidだったならば、その中の全て（サブフォルダ内も含む）のflowのuuidを取り出す
    list_uuid = flow_uuid_getter.get_folder(root_datum, set(), any_uuid)

    # それぞれのflowを子フローとし、親フローの入力に小フローの出力pointを配置、これらをmcatで一つの出力にまとめ上げる、といった内容のflow_jsonを作成する(フローネームはtestdata_mcat_flowとし、出力csvのidはd_outとする)
    testdata_mcat_flow = None

    # 作成したflow_jsonをflow_object(Datum)に変換する
    root = g.factory.data.load_root()
    flow = root.create_flow("assertコマンド全実行用フロー", testdata_mcat_flow)

    # flow_object(Datum)を実行する

    from kskp.store import Activity, NoResultsException
    from kskp.engine import execute, FlowJsonLink

    link = FlowJsonLink(flow, g.factory)
    lasts = execute(link=link, args={}, inputs={})
    lasts = self.convert_flow_activity(lasts)

    # 実行結果のcsvからテスト結果の情報を取り出す
    result = self.get_frame_by_uuid(lasts['d_out'].uuid)

    columns = result.pop(0)# ここはcolumnが入っている
    test_result = True
    column_number = columns.index('isTrue')
    for l in columns:
        if l[column_number] == 'false':
            test_result = False
            break
    # テスト結果の情報を元に、returnするjsonを作成、返却する
    if test_result:
        # return jsonify({
        #     'success'       : True,
        #     'test_result'   : True,
        #     'message'       : "テストは成功"
        # })
        return render_template("dev/result_assert.html", result="成功")
    else:
        # return jsonify({
        #     'success'       : True,
        #     'test_result'   : False,
        #     'message'       : "テストは失敗"
        # })
        return render_template("dev/result_assert.html", result="失敗")




# ________

def convert_from_activity(lasts):
    """
    execute()の戻り値から
    pointのidとframeのDictに置き換える
    """
    from kskp.store import Activity
    # Activityを取得して返り値とする
    for point_id, datum in lasts.items():
        if isinstance(datum, Activity):
            return {point.id : frame for point, frame in datum.results}
# Helpler
def get_frame_by_uuid(self, uuid, header=True):
    """
    指定したuuidのframeを取得する
    """
    import csv
    result = []
    frame = self.factory.data.find_by_uuid(uuid)
    try:
        with open(frame.path, 'r') as f:
            rows = csv.reader(f)
            if header:
                header = next(rows)
            for row in rows:
                result.append(row)
    except Exception as e:
        # import pprint
        # pprint.pprint(f)
        raise e

    return result

# def create_flow(flow_id, uuid):
#     """
#     指定されたidのフローを作成し、そのuuidを返す
#     """
#     flow.uuid = uuid
#     flow.save()
#     # save()によりreadable=Noneになるため再取得する
#     return self.factory.data.find_by_uuid(flow.uuid)

# ----------------

def make_mcat_json(uuid_list):
    import time
    import uuid
    
    # jsonの初期設定
    mcat_json = {
        "label": "assert処理",
        "params": [],
        "description": "",
        "ports": [
            [],
            []
        ],
        "nodes": [],
        "creator": "システム管理者",
	    "projectId": None,
    }
    time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
    mcat_json['createdAt'] = time
    mcat_json['uuid'] = None

    # jsonにそれぞれのflowの出力データ情報を配置
    flow_uuid_getter = Flow_uuid_getter(g.factory)# flow object

    all_output_port_ids = [] # mcatで統合する全てのnodeのidを格納

    # 各子フローの出力ポート情報をJSONに登録
    for uuid in uuid_list:
        # print(uuid)
        # print(child_flow_datum)
        # print(type(child_flow_datum))
        child_flow_datum = g.factory.data.find_by_uuid(uuid)
        flow_ports = child_flow_datum.flow_data.ports[1]
        flow_ports = [ x['nodeId'] for x in flow_ports ]
        # print(flow_ports)

        child_flow_info = {}
        output_port_ids = [] # このuuidのフローが作成するidを取得

        # フロー情報をnodesに配置
        child_flow_info["id"] = uuid
        child_flow_info["uuid"] = uuid
        child_flow_info["type"] = 'flow'
        child_flow_info["args"] = {}
        child_flow_info["srcs"] = {}
        child_flow_info["dsts"] = {}

        for port_num in range(len(flow_ports)):
            output_node = uuid + "_" + str(port_num)
            child_flow_info["dsts"][flow_ports[port_num]] = output_node
            all_output_port_ids.append(output_node)
            output_port_ids.append(output_node)

        mcat_json['nodes'].append(child_flow_info)

        # フローの出力ノードを配置
        for node_output in output_port_ids:
            child_output_node = {}
            child_output_node['id'] =  node_output
            child_output_node["uuid"] = None
            child_output_node["type"] = 'frame'
            child_output_node["label"] = node_output
            child_output_node["dataSource"] = 'csv'

            mcat_json['nodes'].append(child_output_node)

    # mcatコマンドを配置
    mcat_node = {}
    mcat_node['id'] = 'mcat_c'
    mcat_node['args'] = {}
    mcat_node['type'] = 'command'
    mcat_node['label'] = 'mcat_c'
    mcat_node['commandId'] = 'mcat'
    mcat_node['dsts'] = {
        'o': 'mcat_output'
    }


    mcat_node['srcs'] = {}
    for node_num in range(len(all_output_port_ids)):
        mcat_node['srcs']["*" + str(node_num)] = all_output_port_ids[node_num]


    # フローの出力情報
    mcat_output = {}
    mcat_output['id'] =  'mcat_output'
    mcat_output["uuid"] = None
    mcat_output["type"] = 'frame'
    mcat_output["label"] = 'mcat_output'
    mcat_output["dataSource"] = 'csv'

    mcat_json['nodes'].append(mcat_node)
    mcat_json['nodes'].append(mcat_output)

    # mcat_json['ports'][1].append({
    #     "type": "frame",
    #     "label": "mcat_output",
    #     "nodeId": "mcat_output"
    # })

    # print()
    # print(mcat_json)
    # import json
    # mcat_json = json.dumps(mcat_json)

    return mcat_json