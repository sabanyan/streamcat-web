import os


# frameの保存場所は環境変数か、engine.execute()で直接指定する
# os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'


class Job:
    """
    ジョブ
    Stepにinputsとしてデータを値に持つdictが追加されたもの
    また、エラー情報も持つ
    """

    def __init__(self, step, inputs={}):
        self.step = step
        self.inputs = inputs
        self.errors = []

    def execute(self):
        """
        返却するのはデータを値にもつdict
        """
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

    def make_datum(self, datum):
        """
        指定されたデータがFrameでかつまだUUIDが生成されておらず、
        さらに、コマンド列が与えられていれば、それを実行してuuid属性に突っ込む

        TODO: そもそもこれはMCMD前提のコードなので、どこかに移すとかしないと汎用性が保てない
        """

        if datum.uuid is not None or len(datum.command_array) == 0:
            return datum

        # 本来の処理

        # uuidを生成（新しいファイル名）
        import uuid
        datum.uuid = str(uuid.uuid4())

        # frameの保存場所の指定は必須
        if 'KENG_FRAME_PATH' not in os.environ:
            raise Exception()

        o_path = f"{ os.environ['KENG_FRAME_PATH'] }/{ datum.uuid }.csv"

        # 実行を行う
        # TODO: パイプの時はpopenを受け取ってfdだけ取得して入れればいい（それを次に渡す）
        import subprocess

        # 出力パスを追加（パイプを使っていない時）
        datum.command_array.append(f'o={ o_path }')
        popen = subprocess.Popen(datum.command_array)
        popen.wait()

        return datum

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
        port_name = list(step.command_or_flow.outputs.keys())[0]
        executed_datum = job.execute()[port_name]

        # さらに必要な後処理を加える
        return self.make_datum(executed_datum)

    def execute(self, arguments={}, inputs={}):
        """
        フローを実行する
        シグニチャはCommand.execute()と同様
        返却するものも同様
        """

        # まずは、グラフ上の終端データを見つける
        lasts = { k: v for k, v in self.edges.items() if len(v['dsts']) == 0 }

        # それぞれについて必要ならば計算して結果を取得する
        return { k: self.get_datum(k) for k in lasts.keys() }


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
        pass


class Parameter:
    """
    パラメータ定義1つを表す
    """

    def __init__(self):
        self.name = ''
        self.caption = ''
        self.type = 'string'
        self.default = None
        self.validation = None


class Frame:
    """
    表形式データ
    """

    def __init__(self):
        """
        TODO: 表そのもののデータも必要？
        """
        self.command_array = []
        self.path = ''
        self.uuid = None
        self.fd = None

    @classmethod
    def from_command(cls, command_array):
        """
        UNIXコマンドの配列を渡すコンストラクタ
        """
        f = cls()
        f.command_array = command_array
        return f
