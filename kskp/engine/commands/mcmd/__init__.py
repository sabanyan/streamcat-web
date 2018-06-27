import os

from ...core import Parameter, Command
from ...data import Promise

class FieldParameter(Parameter):
    def __init__(self, caption='対象列名'):
        super().__init__()
        self.name = 'f'
        self.caption = caption

class SortFieldParameter(Parameter):
    def __init__(self):
        self.name = 's'
        self.caption = 'ソート対象列名'

class AppendingFieldParameter(Parameter):
    def __init__(self, caption='追加列名'):
        self.name = 'a'
        self.caption = caption

class ValueParameter(Parameter):
    def __init__(self, caption='追加する値'):
        self.name = 'v'
        self.caption = caption

class CalculateParameter(Parameter):
    def __init__(self, caption='条件式'):
        self.name = 'c'
        self.caption = caption

class KeyFieldParameter(Parameter):
    def __init__(self, caption='キー列名'):
        self.name = 'k'
        self.caption = caption

class InputParameter(Parameter):
    def __init__(self, caption='入力ファイル名'):
        self.name = 'i'
        self.caption = caption

class MasterTableParameter(Parameter):
    def __init__(self, caption='参照ファイル名'):
        self.name = 'm'
        self.caption = caption


class MCommand(Command):
    """
    MCMD1つを表す
    """

    def __init__(self):
        super().__init__()

        self.inputs = {
            'in': {
                'type': 'frame'
            }
        }
        self.outputs = {
            'out': {
                'type': 'frame'
            }
        }

    def execute(self, arguments={}, inputs={}):
        """
        MCMD用のコマンド文字列を作成して実行する
        返すのはvalueにData型を持つdictである必要がある
        """

        # まず唯一の引数を受け取る
        input = list(inputs.values())[0]

        # パイプでつなげられそうなら、つなげる
        stdin = input.get_fd()

        # UNIXコマンド用配列を作る
        command_args = self.name.split()

        for key, val in arguments.items():
            command_args.append('%s=%s' % (key, val))

        # コマンド列から作られる結果を返す
        promise = Promise(command_args, stdin=stdin)

                
        key_name = list(self.outputs.keys())[0]
        return { key_name: promise } # keyとDataを返す
