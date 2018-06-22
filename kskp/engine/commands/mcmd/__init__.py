from ...core import Parameter, Command, Frame, FRAME_DIR

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

        command_array = self.name.split()

        # コマンドライン引数を作る
        for key, val in arguments.items():
            command_array.append('%s=%s' % (key, val))

        # inputがpipeでないなら、i=のパラメータを作る必要がある
        # ここでは、基本的に「全てのinput.fd is Noneだったら」パイプから来ていない、と判断する
        if len(inputs) > 0 and all([i.fd is None for i in inputs.values()]):

            # 普通はiに取れるのは一つだけなので、ひとまず最初のものを選びます
            # TODO: inputを選ぶルールは変わるかもしれないが、随分後になるとは思う
            i_uuid = inputs[list(inputs.keys())[0]].uuid

            # TODO: framesへのパス、engineの中からちゃんと指定できないとね
            i_path = f'{ FRAME_DIR }/{ i_uuid }.csv'

            command_array.append(f'i={ i_path }')

        # コマンド列から作られる結果を返す
        f = Frame.from_command(command_array)

        key_name = list(self.outputs.keys())[0]
        return { key_name: f } # keyとDataを返す
