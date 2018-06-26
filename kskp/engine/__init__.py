import os
import json

from .core import *
from .util import command_from_name


def execute(flow_uuid, flow_json, arguments={}, inputs={}, frame_path=None):
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
    return job.execute()


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
            command = command_from_name(val['name'])
        elif step_type == 'flow':
            # サブフロー
            pass
        else:
            # 通らないはず
            raise Exception()

        s = Step(step_type, command, val['args'])

        new_flow.steps[key] = s

    # そして今度はdataを読み込む
    # ここからedgesとinputsとoutputsを全部くくり出す
    data = parsed_json['data']

    # inputsを取り出す
    # asFlowInフラグが立っているデータ
    new_flow.inputs = [v for v in data.values() if v['asFlowIn'] == True]

    # outputsを取り出す
    # asFlowOutフラグが立っているデータ
    new_flow.outputs = [v for v in data.values() if v['asFlowOut'] == True]

    # 残りは内包表記では書きにくいのでforで
    for key, val in data.items():
        data_type = val['type']
        if data_type == 'frame':
            # Frameの場合
            new_data = Frame()

            # UUIDは存在していれば
            if val['uuid'] is not None:
                new_data.uuid = val['uuid']

            # まずdataを設定しよう
            new_flow.data[key] = new_data

            # そしてedgesを取り出す
            edge = { k: v for k, v in val.items() if k in ['srcs', 'dsts'] }
            new_flow.edges[key] = edge
        else:
            # 今のところFrameだけを考えよう
            raise Exception()

    return new_flow
