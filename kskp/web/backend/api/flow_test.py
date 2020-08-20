# TODO: 実装を進めていって、使い始めたものからコメントアウトしていく
import os
from flask import Blueprint, request, jsonify, g, render_template
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils import api_base, lock_required
from kskp.store import *
from kskp.web.backend import app
from pathlib import Path
import json
from kskp.store import (
    Datum,
    Folder,
    DatabaseConn,
)

mod = Blueprint('assert', __name__)
@mod.route('/flow_tester', methods=['GET'])
@login_required_api
@update_navigation
@api_base
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
    # print(vars(request))
    # print(request.form["uuid"])
    # print(request['uuid'])
    # any_uuid = request.
    flow_uuid_getter = Flow_uuid_getter(g.factory)
    any_uuid = request.args.get('uuid')
    folder = g.factory.data.find_by_uuid(any_uuid)
    # first_path = folder.path()
    first_path = g.factory.data.load_root()
    # first_path = True

    list_uuid = flow_uuid_getter.get_folder(first_path, set(), any_uuid)
    print(list_uuid)
    # return jsonify({'success': True, 'data': flow_uuid_getter.get_folder(first_path,set(), any_uuid)})
   
    # テスト結果の情報を元に、returnするjsonを作成、返却する
    if first_path:
        return render_template('result_assert.html', result_assert="成功")
    else:
        return render_template('result_assert.html', result_assert="失敗")




from kskp.core import Datum
from kskp.store import Store
from kskp.store.flow_dumper import FlowDumper

# flow_uuids = []

# flow_dumper = FlowDumper(g.factory)
# return flow_dumper.dump_archive(any_uuid)
class Flow_uuid_getter(FlowDumper):
    def __init__(self,factory):
        self.factory = factory
        # self.first_path = g.factory.data.load_root()

        import uuid
        self.tmp_path = Path('/tmp')
        self.gathering_path = self.tmp_path / str(uuid.uuid4())
        self.labels_path = self.gathering_path / 'labels.txt'
    
    def get_folder(self,parent_path, gathered_uuids, folder_uuid):
        folder_frame = self.factory.data.find_by_uuid(folder_uuid)
        # parent_path = folder_frame
        # parent_path = folder_frame.path()
        print(folder_frame)
        print(type(folder_frame))
        parent_path = folder_frame.get_current_folder_path()
        # parent_path_list = parent_path.get_folder_path()

        print(parent_path)
        print(type(parent_path))
        # parent_path = parent_path / Path(parent_path2[0][''])

        if not isinstance(folder_frame, Folder):
            return {folder_frame.uuid}
        children = folder_frame.find_children()

        if len(children) == 0:
            return gathered_uuids

        for child in children:
            if isinstance(child, Folder):
                gathered_uuids.union(self.get_folder(parent_path, gathered_uuids, child.uuid))
            elif child.type == Datum.FLOW_TYPE:
                gathered_uuids.union(self._get_flow(parent_path, gathered_uuids, child.uuid))

        return gathered_uuids


# ーーーーーーーーーーーーー


@mod.route('/flow_test_checker/<any_uuid>', methods=['POST'])
@login_required_api
@update_navigation
@api_base
def start_assert_cmd(any_uuid):
    """
    あるflowもしくはproject内のflow全てのassertコマンドの実行結果を表示する
    """
    # 入力はuuid,flowか、projectのuuidが対象
    # もしprojectのuuidだったならば、その中の全て（サブフォルダ内も含む）のflowのuuidを取り出す

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