# frameの保存場所は環境変数か、engine.execute()で直接指定する
# os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'


class Job:
    """
    ジョブ
    Stepにinputsとしてデータを値に持つdictが追加されたもの
    また、エラー情報も持つ
    """

    def __init__(self, step, inputs=None):
        self.step = step
        # 基本的にはinputsは元々持っているものを使う
        # もし新しく指定されれば、それで上書きされる
        if inputs is None:
            self.inputs = step.command_or_flow.inputs
        else:
            self.inputs = inputs
        self.errors = []
        print('self.inputs:', self.inputs)

    def execute(self):
        """
        返却するのはデータを値にもつdict
        """
        print('self.inputs:', self.inputs)
        return self.step.execute(self.inputs)


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
        self.inputs = {}
        self.outputs = {}

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

    def get_inputs_from_step(self, step_id):
        """
        指定したstepを実行するために必要なinputのdataを集めてくる
        """
        inputs = {
            k: self.get_datum(k) for k, v in self.edges.items()
            if len(v['dsts']) > 0 and v['dsts'][0].split('.')[0] == step_id
        }
        return inputs

    def get_datum(self, datum_id):
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
        inputs = self.get_inputs_from_step(step_id)

        # 準備ができたので結果を取得
        step = self.steps[step_id]
        job = Job(step, inputs)

        # 実行開始
        # TODO: ひとまずoutputsが1つのみである前提で取得
        print('step.command_or_flow.outputs:', step.command_or_flow.outputs)
        port_name = list(step.command_or_flow.outputs.keys())[0]

        # 結果を返却する
        return job.execute()[port_name]

    def execute(self, arguments={}, inputs={}):
        """
        フローを実行する
        シグニチャはCommand.execute()と同様
        返却するものも同様
        """

        # まずは、グラフ上の終端データを見つける
        lasts = { k: v for k, v in self.edges.items() if len(v['dsts']) == 0 }

        # 引数を与える
        # TODO: まずは1つだけの前提
        input = list(inputs.values())[0]
        input_key = list(self.inputs.keys())[0]
        # そっくり入れ替える
        self.inputs[input_key] = input

        # それぞれについて必要ならば計算して結果を取得する
        result = {}
        for key in lasts.keys():
            datum = self.get_datum(key)
            datum.save()
            result.update({key: datum})

        # 後片付け
        for d in self.data.values():
            # print('後片付け:', d)
            d.close()

        # outputsを集め直す
        return { k: v for k, v in self.outputs.items() }


class Command:
    """
    コマンド
    """

    def __init__(self):
        self.version = '0.1.0'
        self.name = ''
        self.description = ''
        self.inputs = {}
        self.outputs = {}
        self.parameters = []

    def execute(self, arguments={}, inputs={}):
        # TODO: 引数のvalidation
        pass

    def make_path(self):
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

        self.default = None
        self.validation = None
