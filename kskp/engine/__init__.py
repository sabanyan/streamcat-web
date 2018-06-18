# 以下のように、定義情報を特別にもつようにしてもいいのだが、どうもしっくり来ない。
# やはり、一つのコマンドにつき定義情報を１つずつ持つ必要がある。めんどくさいけど、仕方ない。
# ということは、今の状態で、定義情報だけを各モジュールに持たせて、
# それぞれが'MCommand'クラスのインスタンスであるべき、という情報を追加する、ということでいけるのではないか
# その分、executeなどのメソッドは省くことができるし、utilモジュールは不要になる

# 問題は、そういう枠組みから外れるコマンド（自作コマンドなど）をどう扱うか、である
# 統一感のある追加方法にならないのだ、例えばexecuteメソッドそのものを変えたい場合は。

# これらを統一して扱いたい場合は、どうしてもそれぞれを継承してクラスを作るしかない。うーん。
commands = {
    MCommand('mcut')
}

d = {
    'ls': 'unix.ls',
    'grep': 'unix.grep',
    'wc': 'unix.wc',
    'cat': 'unix.cat',

    'mcut_n': 'mcmd.col_edit.mcut_n',
    'mcut': 'mcmd.col_edit.mcut',
    'msel': 'mcmd.row_edit.msel',
    'mselstr': 'mcmd.row_edit.mselstr',
    'mjoin': 'mcmd.table_join.mjoin',
    'msortf': 'mcmd.row_sort.msortf',
    'mcount': 'mcmd.table_grouping.mcount',
    'muniq': 'mcmd.row_edit.muniq',
    'mcat': 'mcmd.table_join.mcat',
    'mslide': 'mcmd.table_grouping.mslide',
    'msetstr': 'mcmd.col_edit.msetstr',
    'mnullto': 'mcmd.value_transform.mnullto',
    'mnumber': 'mcmd.col_edit.mnumber',
    'msum': 'mcmd.table_grouping.msum',
    'mbest': 'mcmd.row_edit.mbest',
    'mtra': 'mcmd.value_crossing.mtra',
    'mdelnull': 'mcmd.row_edit.mdelnull',
    'msed': 'mcmd.value_transform.msed',
    'mcal': 'mcmd.mcal', # これは将来変わるかも

    'mchkcsv': 'mcmd.validation.mchkcsv',
    'mbucket': 'mcmd.table_split.mbucket',
    'mstats': 'mcmd.table_grouping.mstats',
    'mavg': 'mcmd.table_grouping.mavg',

    'aggregate': 'util.aggregate',

    'mtee': 'mcmd.data_source.mtee'
}


class Job:
    """
    ジョブ
    Stepにinputsとしてデータを値に持つdictが追加されたもの
    また、エラー情報も持つ
    """

    def __init__(self, step):
        self.step = step
        self.inputs = {
            "d1": {
                "type": "frame",
                "uuid": null
            },
            "d2": {
                "type": "frame",
                "uuid": null
            }
        }
        self.errors = []


class Step:
    """
    ステップ
    CommandもしくはFlowに必要な引数がセットされたもの
    """

    pass


class Flow:
    """
    フロー
    Stepがグラフ状に連結されたもの
    """

    pass


class MCommand(Command):
    """
    MCMD1つを表す
    """

    def __init__(self):
        self.inputs = {
            'input': {
                'type': 'frame'
            }
        }
        self.outputs = {
            'output': {
                'type': 'frame'
            }
        }

    def execute(self, arguments={}, inputs={}):
        """
        MCMD用のコマンド文字列を作成して実行する
        返すのはvalueにData型を持つdictである必要がある
        """

        command_array = self.info.name.split()

        # 共通パラメータ
        if 'i' in parameters:
            command_array.append('i=%s' % parameters['i'])
            del parameters['i']

        # その他のパラメータを処理する
        for key, val in parameters.items():
            command_array.append('%s=%s' % (key, val))

        # コマンド列から作られる結果を返す
        f = Frame.from_command(command_array)

        return { 'output': f } # keyとDataを返す


class Command:
    """
    コマンド
    """

    def __init__():
        self.version = '0.1.0'
        self.name = ''
        self.description = ''
        self.inputs = {}
        self.outputs = {}
        self.parameters = []

    def execute(self, arguments={}, inputs={}):
        pass


class Frame:
    """
    表形式データ
    """

    def __init__(self):
        self.command_array = []
        self.path = ''
        self.uuid = None
        self.fd = None
        # 表そのもののデータも欲しいところ

    @classmethod
    def from_command(cls, command_array):
        """
        UNIXコマンドの配列を渡すコンストラクタ
        """
        f = cls()
        f.command_array = command_array
