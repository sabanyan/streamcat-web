import os
import json

from .core3 import *
from .data3 import *
from .util import command_from_name


def execute(flow_uuid, flow_json, arguments={}, inputs=None, step_paths=None, frames_path=None, flows_path=None):
    """
    エントリポイント
    JSONをパースして、そのまま実際の処理はexecute_internalに移譲する
    """
    #　もしframeの保存場所が明示的に指定されていれば、環境変数よりも優先される
    if frames_path is not None:
        os.environ['KENG_FRAMES_PATH'] = frames_path

    # flowも同様
    if flows_path is not None:
        os.environ['KENG_FLOWS_PATH'] = flows_path

    job = parse(flow_uuid, inputs=inputs, args=arguments)
    result = job.execute(step_paths=step_paths)
    job.dtor()

    _result = {}
    _result['outputs'] = job.lasts
    _result['caches'] = job.caches

    return _result


def persist_to_files(job):
    """
    file descriptorのままのdataがある場合は、それらを永続化する

    そもそもengine内で実行履歴(job)を保存しているので、engineの実行結果は必ず永続化する必要がある
    また、file descriptorをengineの外で使いたい場合は極めて稀であると思われるので
    1つのプロセス内で複数のengineを協調して動作させるというユースケースは明確に除外しておく
    (必要になりそうであれば別途オプションで制御できるようにしたいと考えている)
    """

    # command_or_flowはここでは必ずflowであるはずなので
    # get_lastsを持っているかどうかはチェックしない
    flow = job.step.command_or_flow
    for key in flow.get_lasts().keys():
        datum = flow.data[key]

        # 対象データが永続化されていない場合は永続化する
        # TODO: 今のところsourceがUnixCommandSourceの場合だけが永続化されていないはずなので、
        #       決め打ちで書いておく
        if isinstance(datum.source, UnixCommandSource):
            # ファイルの拡張子はdatum.source.typeから決定する
            if datum.source.type == 'csv':
                ext = '.csv'
            else:
                # その他の場合は今は考えない
                raise Exception()

            from pathlib import Path
            out_fd = Path(os.environ['KENG_FRAMES_PATH']).joinpath(datum.uuid + ext)
            fd = out_fd.open(mode='w', encoding='utf-8')
            datum.source.save(fd)
            fd.close()


            # TODO: ここではsaveしてファイルを保存はしているものの、
            #       datum.sourceをUnixCommandSourceから（例えば）FilePathSourceにはしていない
            #       その必要がないからと今のところ考えているが、後々変わるかもしれない
            #       言い換えれば、sourceを変更してもそれを使う場所がないので変換は不要では、ということ


# def parse(flow_uuid, flow_json):
#     """
#     Flowファイル(JSON)をパースして返却する
#     """
#
#     new_flow = Flow(flow_uuid)
#
#     parsed_json = json.loads(flow_json, encoding='utf-8')
#
#     # 所属projectへの紐付けはナシ。engineのお仕事ではないので
#
#     new_flow.name = parsed_json['name']
#
#     # まず、step情報を格納する
#     # labelはGUIで使うのでengineでは無視している
#     steps = parsed_json['steps']
#
#     for key, val in steps.items():
#         step_type = val['type']
#
#         if step_type == 'command':
#             # コマンドから作られたstep
#             command_or_flow = command_from_name(val['name'])
#         elif step_type == 'flow':
#             # サブフロー
#             with open(f"kskp/data/flows/{ val['uuid'] }.json", 'r') as f:
#                 command_or_flow = parse(val['uuid'], f.read())
#         else:
#             # 通らないはず
#             raise Exception()
#
#         s = Step(step_type, command_or_flow, val['args'])
#
#         new_flow.steps[key] = s
#
#     # そして今度はdataを読み込む
#     # ここからedgesとinputsとoutputsを全部くくり出す
#     data = parsed_json['data']
#
#     # inputs/outputsを取り出す
#     # asFlowIn/asFlowOutフラグが立っているデータ
#     new_flow.signature = (
#         { k: v for k, v in data.items() if v['asFlowIn']  == True },
#         { k: v for k, v in data.items() if v['asFlowOut'] == True }
#     )
#
#     # 残りは内包表記では書きにくいのでforで
#     for key, val in data.items():
#         data_type = val['type']
#         if data_type == 'frame':
#             # Frameの場合
#
#             if val['dataSource'] == 'csv':
#                 # UUIDは存在していれば
#                 if val['uuid'] is not None:
#                     frame_uuid = val['uuid']
#                     source = PathFileSource('csv', os.environ['KENG_FRAMES_PATH'], frame_uuid + '.csv')
#                     new_frame = Frame(frame_uuid, source)
#
#                     # new_frame = CsvFrame.from_uuid(val['uuid'])
#                 else:
#                     new_frame = Frame()
#             else:
#                 # CSV以外の場合はひとまず
#                 # DBなどを想定している
#                 new_frame = Frame()
#
#
#             new_flow.data[key] = new_frame
#
#             # そしてedgesを取り出す
#             edge = { k: v for k, v in val.items() if k in ['srcs', 'dsts'] }
#             new_flow.edges[key] = edge
#         else:
#             # 今のところFrameだけを考えよう
#             raise Exception()
#
#     return new_flow
