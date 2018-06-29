from . import *

class Mcat(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.parameters.append(Parameter('i', '入力ファイル名'))

class Mcommon:
    pass

class Mjoin(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mjoin'
        self.description = '結合'

        # inもoutも一つずつ
        self.signature = (
            {
                'i' : { 'type': 'frame' },
                'm' : { 'type': 'frame' }
            },
            { 'out': { 'type': 'frame' } }
        )

        self.parameters.append(Parameter('k', '結合キー名'))
        # self.parameters.append(Parameter('m', '参照ファイル名'))

    def execute(self, args={}, inputs={}):
        """
        MCMD用のコマンド文字列を作成して実行する
        返すのはvalueにData型を持つdictである必要がある
        """

        # print('mjoin:', inputs)

        # まず唯一の引数を受け取る
        input = list(inputs.values())[0]

        # パイプでつなげられそうなら、つなげる
        stdin = input.get_fd()
        self.fds.append(stdin)

        # UNIXコマンド用配列を作る
        command_args = self.name.split()

        for key, val in args.items():
            command_args.append('%s=%s' % (key, val))

        command_args.append(f"m={ inputs['d1'].path }")

        # コマンド列から作られる結果を返す
        frame = PopenFrame(command_args, stdin=stdin)

        key_name = list(self.signature[1].keys())[0]
        return { key_name: frame } # keyとDataを返す


class Mnjoin:
    pass

class Mnrcommon:
    pass

class Mnrjoin:
    pass

class Mpaste:
    pass

class Mproduct:
    pass

class Mrjoin:
    pass

class Mvcommon:
    pass

class Mvjoin:
    pass

class Mvreplace:
    pass
