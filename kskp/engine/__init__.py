import json
import subprocess
import importlib
from pathlib import Path


def execute(flow_file):
    '''
    実行のメイン処理を行う
    '''

    run(parse(flow_file))


def parse(flow_file):
    '''
    フローファイルを解析して、Flowインスタンスを返す
    '''

    with open(flow_file, 'r') as f:
        json_object = json.loads(f.read())

    steps = {}
    for key, step in json_object['steps'].items():
        ope = Operator(resolve_operator_name(step['operator']))
        param = step['parameters'] if 'parameters' in step else {}
        steps[key] = Step(ope, param)

    edges = {(e['v'], e['w']) for e in json_object['edges']}

    return Flow(steps, edges)


def run(flow):
    '''
    各種コマンドを実行
    '''

    # ここで受け取ったフローを実行する
    flow.execute()


def resolve_operator_name(key):
    '''
    TODO: この対応表は後々どこかに移しましょう
    '''
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

    return d[key]


class Flow:
    '''
    フロー
    '''

    def __init__(self, steps, edges):
        """
        フローファイルを引数にとる奴もほしいな
        いや、この中でパースしてちゃんとしたFlowオブジェクトにする方がいい気がしてきた
        """
        self.steps = steps # Stepインスタンスのlist
        self.edges = edges # (source_index, destination_index) の list


    def execute(self):
        # まず、グラフの終端を探す
        # self.edgesの中で、右側destinationにしか出てこないもの
        # ダサいがまずは見本として一つずつロジックを進める

        # stepが一つしか置かれていない場合、以下のロジックでは何も起きないので、
        # 先にそれを判定する
        if len(self.steps) == 1 and len(self.edges) == 0:
            # 単純にそのstepを実行するだけになる
            path = Path(__file__).parent.parent / Path('data/frames/_.csv')
            stdout = open(path.as_posix(), 'w')
            res = self.steps[0].execute({'stdout': stdout})
            return res.wait()

        # source, destinationそれぞれの集合を作る
        srcs = {s for (s,d) in self.edges}
        dsts = {d for (s,d) in self.edges}

        # その中から、edgeにも存在するindexを排除する
        # この集合を終端であると定義しておく
        end_indices = dsts - srcs

        # 簡易的に、現在は終端はFlow1つにつき1つだけに限定しておく
        if len(end_indices) == 1:
            # 開始(後ろからデータの流れとは逆順に実行していくので、一番最後のstepとなる)stepを取得

            # 後始末用に処理の終わったCompletedProcessを集めるためのリスト
            results = []

            # 再帰的にグラフを潜っていくので、そのための関数を定義
            def execute_recursive(step_index, last=False):
                step = self.steps[step_index]

                # referrerは複数ありえるが、ひとまず、一つだけだと決めつけて書く
                # そもそもreferrerがたくさんあったらそれらをどのように処理してから次のstepに渡すべきなのだろう？
                # 標準入力は一つしかないので、そのような場合は、外から引数で渡すしかないのではないか？
                # そうなると、自動的に一旦ファイルに書き出して、それを所定の引数に入れるしかない
                # だから、「何番目のreferrerが次のコマンドの何（パイプも含めて）に対応しているのかの定義が必要となる
                # 裏を返すと、現在は暗黙的に「referrerは一つ、しかも次はpipeで繋ぐ」という定義の基で進めていることになる
                # その定義は正直、あとでもいいかもしれないが、少し怖いので何をすべきなのかは考えたい

                # 勝手に1つと決めつけて最初のindexを取得
                referrer_indices = self.referrers(step_index)

                stdin = None
                stdout = None
                if (len(referrer_indices) > 0):
                    referrer_index = referrer_indices.pop()

                    stdin = execute_recursive(referrer_index).stdout
                    if not last:
                        # 途中ならPIPEに吐いて次に繋げる
                        stdout = subprocess.PIPE
                    else:
                        # 最後は決まったファイルに吐きます
                        path = Path(__file__).parent.parent / Path('data/frames/_.csv')
                        stdout = open(path.as_posix(), 'w')
                else:
                    # もう最後まで行ったら終わりだよ
                    # path = Path(__file__).parent.parent / Path('data/frames/_.csv')
                    # stdout = open(path.as_posix(), 'w')
                    stdout = subprocess.PIPE

                # リダイレクト指定があった場合はstdoutを上書き
                # でも書く場所がここで良いかは要検討

                try:
                    if 'stdout' in step.parameters:
                        stdout = open(step.parameters['stdout'], 'w')

                    # 実行開始
                    print('step_index: %s stdin: %s stdout: %s' % (step_index, stdin, stdout))
                    res = step.execute({'stdin': stdin, 'stdout': stdout})
                    results.append(res)
                    # stdout.close()
                    return res
                finally:
                    if 'stdout' in step.parameters:
                        stdout.close()

            # ラストから実行開始！
            execute_recursive(end_indices.pop(), True)

            # 後片付け
            # result_pair = results.pop().commnuicate()
            for p in results:
                p.wait()

            # return result_pair # (stdout, stderr)
        else:
            # 終端が複数ある場合のエラー処理もあとで
            pass


    def referrers(self, step_index):
    '''
    指定したstepを指しているsourceとなるstepのリストを返す
    '''
    return {s for (s,d) in self.edges if d == step_index}


class Step:
    '''
    ステップ
    Operatorがフローに属するとこのクラスのインスタンスになる
    '''

    def __init__(self, operator, parameters={}):

        # Operatorインスタンスをもらう
        self.operator = operator

        # paramterは実際に動作に対して必要な引数
        # 形式（型）に関しては未定
        self.parameters = parameters

    def execute(self, context={}):

        # そのままoperatorに処理を移譲
        return self.operator.execute(context, self.parameters)


class Operator:
    '''
    オペレータ
    '''

    def __init__(self, module_name, parameterDefinition={}):

        # オペレータ処理の本体
        self.module_name = 'operators.' + module_name

        # オペレータに対して外部から与えることのできる、パラメータ定義
        # こちらも形式は未定、UIを含むので、YAMLかJSONか
        # そのファイル名？クラス名？色々な方法がある
        # 今の所dictにしておく
        self.parameterDefinition = parameterDefinition


    def execute(self, context={}, parameters={}):
        """
        与えられた情報を元に実行を行う
        TODO: クラス名を変更予定
        """

        # モジュールを読み込み実行
        mod = importlib.import_module(self.module_name)
        return mod.execute(context, parameters)
