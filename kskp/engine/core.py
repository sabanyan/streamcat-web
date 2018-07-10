import re

# frameの保存場所は環境変数か、engine.execute()で直接指定する
# os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'
from .data import *
from datetime import datetime, timedelta, timezone
import json

class Job:
    """
    ジョブ
    Stepにinputsとしてデータを値に持つdictが追加されたもの
    また、エラー情報も持つ
    """

    def __init__(self, step, inputs=None):
        self.step = step
        if inputs is None:
            self.inputs = {}
        else:
            self.inputs = inputs
        self.errors = []
        # print('self.inputs:', self.inputs)

    def execute(self):
        """
        返却するのはデータを値にもつdict
        """
        # print('self.inputs:', self.inputs)
        jobs_result = self.step.execute(self.inputs)

        # 実行履歴の作成
        # job.executeは再帰処理で何度も呼び出され、Commandのexecute時は避けたいので
        # ひとまずFlowの場合のみ処理を行うようにしている
        # サブフローの場合は今は考えていない
        if isinstance(self.step.command_or_flow, Flow):
            now = datetime.now()

            history_list = []
            history = self.create_result_history(now, 'ユーザー 太郎')
            history_list.append(history)

            # ファイルに書き込み
            # TODO pathは環境変数にする！
            file_name = '{0:%Y%m%d%H%M%S%f}'.format(now)
            path = Path(__file__).parent.parent.as_posix() / Path('data/jobs/%s.json' % file_name)
            with open(path.as_posix(), 'w') as f:
                json.dump(history_list, f, indent = '\t', ensure_ascii=False)

        return jobs_result

    def create_result_history(self, now, user_name):
        """
        libraryで閲覧できる実行履歴jsonを作成する
        指定した時間とユーザ名を実行時情報とする
        """
        # 直書き…とりあえずの実装
        history_json = {'executedAt':'', 'executor':{'name':''}, 'inputs':{}, 'params':{}, 'flow':{'uuid':''}, 'data':{}, 'errors':{}}

        # nowはミリ秒まで入るのでnowを使ってdatetimeを作り直してからisoformat()を行っている
        history_json['executedAt'] = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second,
                                              tzinfo=timezone(timedelta(hours=+9))).isoformat()
        # ユーザ名を取ってくる方法を確立するまでの暫定的な処理
        history_json['executor']['name'] = user_name
        history_json['flow']['uuid'] = self.step.command_or_flow.uuid
        for key in self.step.command_or_flow.data.keys():
            # 現在はデータのクラスの型を'type'に入れているので
            # クラスの型と'type'に入れたい型が一致しているのが前提になっている
            data_type = type(self.step.command_or_flow.data[key]).__name__
            history_json['data'][key] = {'type':data_type.lower(),
                                         'uuid':self.step.command_or_flow.data[key].uuid}

        return history_json

def dtor(self):
        """ デストラクタ """
        # print('Job.dtor()')
        self.step.command_or_flow.dtor()


class Step:
    """
    ステップ
    CommandもしくはFlowに必要な引数がセットされたもの
    ここで言う「引数」は、KSKPの画面右で入力されたものを指している
    """

    def __init__(self, step_type, command_or_flow, arguments):
        self.step_type = step_type
        self.command_or_flow = command_or_flow
        self.arguments = arguments

    def execute(self, inputs={}):
        # CommandでもFlowでも呼び出し方は同じ
        return self.command_or_flow.execute(self.arguments, inputs)


class Flow:
    """
    フロー
    Stepがグラフ状に連結されたもの
    """

    def __init__(self, flow_uuid):
        """
        stepsのdictとdataのdictを持つのが基本
        """
        self.uuid = flow_uuid

        self.steps = {}
        self.data = {}
        self.edges = {}
        self.signature = {}

        self.jobs = [] # 現在のところリソース管理のため(fd削除)

    def get_src_ports_from_result_datum(self, datum_id):
        """
        指定された一つのデータからsrcになるstepを取得
        普通はこれは1つだけのはずだが、一応将来のためにもリストを返しておく
        """

        # TODO: edgeもしくはport専用クラスを作った方がいいのかも
        # そしてedgeはtupleで保持するようにした方が良いのではないか
        # 以下は少し冗長
        return [
            tuple(src.split('.'))
            for src in self.edges[datum_id]['srcs']
        ]

    def check_duplicate_use(self, datum_id, datum):
        """
        同じpopenを2度は使えないので、CSVに変換する
        """
        if datum.source == 'popen' and datum.already_piped:
            return CsvFrame.from_uuid(datum.uuid)
        else:
            return datum
        #     self.data[datum_id] = CsvFrame.from_uuid(datum.uuid)
        #
        # return self.data[datum_id]

    def get_inputs_from_step(self, step_id, args):
        """
        指定したstepを実行するために必要なinputのdataを集めてくる
        """
        inputs = {
            k: self.check_duplicate_use(k, self.get_datum(k, args)) for k, v in self.edges.items()
            if len(v['dsts']) > 0 and step_id in [dst.split('.')[0] for dst in v['dsts']]
        }
        return inputs

    def get_datum(self, datum_id, args):
        """
        指定したidのdataがすでに存在すればそれを返す
        まだ存在していなければ、それを作る
        """
        datum = self.data[datum_id]

        # dataがすでに存在すればそれを返す
        if datum.uuid is not None:
            return datum

        # なければ作る

        # まずは元になるstepのportを取得
        ports = self.get_src_ports_from_result_datum(datum_id)

        # 普通はsrcになるのは一つだけのstepなので、ひとまずはそれを取得する
        step_id = ports[0][0]

        # 次にそのstepを作るためのinputsを集める
        inputs = self.get_inputs_from_step(step_id, args)

        # 準備ができたので結果を取得
        step = self.steps[step_id]

        # argumentsを書き換える必要がある
        for key, val in step.arguments.items():

            # もし書き換え対象のものがあれば
            if isinstance(val, str):
                g = re.search(r'@\[(\S*)\]', val)
                if g is not None:
                    for parent_key in g.groups():
                        step.arguments[key] = val.replace(f'@[{parent_key}]', args[parent_key])

        # inputsをちゃんと実行するstepのsignatureに合わせる必要がある
        # print('get_datum inputs:', inputs)
        # print('get_datum step signature:', step.command_or_flow.signature[0])
        # print('get_datum edges:', self.edges)
        # print('get_datum step_id:', step_id)

        signatured_inputs = {}
        for k, v in inputs.items():
            for port in step.command_or_flow.signature[0].keys():
                target_port = f'{step_id}.{port}'
                if target_port in self.edges[k]['dsts']:
                    signatured_inputs[port] = v

        # print('get_datum signatured_inputs:', signatured_inputs)

        job = Job(step, signatured_inputs)
        self.jobs.append(job)

        # 実行開始
        # TODO: ひとまずoutputsが1つのみである前提で取得
        port_name = list(step.command_or_flow.signature[1].keys())[0]

        # 結果を返却する
        return job.execute()[port_name]

    def get_lasts(self):
        """
        flow上の終端データをdictにして返す
        engineからも使っている
        """
        return { k: v for k, v in self.edges.items() if len(v['dsts']) == 0 }

    def execute(self, arguments={}, inputs={}):
        """
        フローを実行する
        シグニチャはCommand.execute()と同様
        返却するものも同様
        """

        # まずは、グラフ上の終端データを見つける
        lasts = self.get_lasts()

        # 引数を与える
        inputs = list(inputs.values())
        if len(inputs) > 0:
            # TODO: まずは1つだけの前提
            input = inputs[0]
            input_key = list(self.signature[0].keys())[0]
            # そっくり入れ替える
            self.data[input_key] = input

        # それぞれについて必要ならば計算して結果を取得する
        result = { k: self.get_datum(k, arguments) for k in lasts.keys() }

        # resultをself.dataに移す
        for k, v in result.items():
            self.data[k] = v

        # outputsを集め直す
        return { k: self.data[k] for k in self.signature[1].keys() }

    def dtor(self):
        # print('Flow.dtor():', self.jobs)
        for j in self.jobs:
            j.dtor()


class Command:
    """
    コマンド

    :param name: コマンドにつける名称。必須。
                 現在、フローファイルに書かれた情報をここに取り込み、
                 それに従い、読み込むべきCommandクラスの名前を決定する。
    """

    def __init__(self, name=''):
        # assert name is not None and name != ''

        self.name = name

        # このコマンドに与えることができるパラメータの定義リスト
        # 中身はParameterインスタンス
        self.parameters = []

        # このコマンドに与えることができるデータの定義。
        # dict二つのtupleで、１つ目は入力、２つ目は出力。
        self.signature = ({}, {})

        self.description = ''
        # self.version = '0.1.0'

    def execute(self, arguments={}, inputs={}):
        # TODO: 引数のvalidation
        raise Exception()

    def dtor(self):
        """ デストラクタ """
        pass


from enum import Enum, auto


class Parameter:
    """
    パラメータ定義1つを表す

    :param name: パラメータ名。必須
    :param caption: このパラメータを表す短いタイトル。GUI上でのラベルとして使われる。
                    オプショナルで、未指定だとnameと同じになる。
    """

    class WidgetType(Enum):
        """
        パラメータ値の分類を表す。
        type属性に使われ、
        この値によってGUI上で使われる部品が変化することを想定している
        """
        TEXTBOX = auto()


    def __init__(self, name, caption=None):
        assert name is not None and name != '', 'nameは必須です'

        self.name = name
        if caption is None:
            self.caption = name
        else:
            self.caption = caption

        self.widget_type = self.WidgetType.TEXTBOX

        # self.default = None
        # self.validation = None
