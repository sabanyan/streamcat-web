import os
import json

from .core import *
from .data import Frame, CsvFrame
from .util import command_from_name


def execute(flow_uuid, flow_json, arguments={}, inputs=None, frame_path=None):
    """
    エントリポイント
    """

    #　もしframeの保存場所が明示的に指定されていれば、環境変数よりも優先される
    if frame_path is not None:
        os.environ['KENG_FRAME_PATH'] = frame_path

    # 1. argumentsを与えてStepを作成する
    step = Step('flow', parse(flow_uuid, flow_json), arguments)

    # 2. 1のStepにinputsを与えてJobを作成して実行する
    job = Job(step, inputs)

    # 3. その結果をoutputsとして受け取り、そのまま返却する
    result = job.execute()

    # 4. 後始末
    job.dtor()

    return result


def parse(flow_uuid, flow_json):
    """
    Flowファイル(JSON)をパースして返却する
    """

    new_flow = Flow(flow_uuid)

    parsed_json = json.loads(flow_json, encoding='utf-8')

    # 所属projectへの紐付けはナシ。engineのお仕事ではないので

    new_flow.name = parsed_json['name']

    # まず、step情報を格納する
    # labelはGUIで使うのでengineでは無視している
    steps = parsed_json['steps']

    for key, val in steps.items():
        step_type = val['type']

        if step_type == 'command':
            # コマンドから作られたstep
            command_or_flow = command_from_name(val['name'])
        elif step_type == 'flow':
            # サブフロー
            with open(f"kskp/data/flows/{ val['uuid'] }.json", 'r') as f:
                command_or_flow = parse(val['uuid'], f.read())
        else:
            # 通らないはず
            raise Exception()

        s = Step(step_type, command_or_flow, val['args'])

        new_flow.steps[key] = s

    # そして今度はdataを読み込む
    # ここからedgesとinputsとoutputsを全部くくり出す
    data = parsed_json['data']

    # inputs/outputsを取り出す
    # asFlowIn/asFlowOutフラグが立っているデータ
    new_flow.signature = (
        { k: v for k, v in data.items() if v['asFlowIn']  == True },
        { k: v for k, v in data.items() if v['asFlowOut'] == True }
    )

    # 残りは内包表記では書きにくいのでforで
    for key, val in data.items():
        data_type = val['type']
        if data_type == 'frame':
            # Frameの場合
            if val['dataSource'] == 'csv':
                new_frame = CsvFrame()
            else:
                # CSV以外の場合はひとまず
                # DBなどを想定している
                new_frame = Frame()

            # UUIDは存在していれば
            if val['uuid'] is not None:
                # まずdataを設定しよう
                new_frame.uuid = val['uuid']

            new_flow.data[key] = new_frame

            # そしてedgesを取り出す
            edge = { k: v for k, v in val.items() if k in ['srcs', 'dsts'] }
            new_flow.edges[key] = edge
        else:
            # 今のところFrameだけを考えよう
            raise Exception()

    return new_flow
