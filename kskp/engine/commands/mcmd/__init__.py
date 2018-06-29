import os

from ...core import Parameter, Command
from ...data import PopenFrame


class MCommand(Command):
    """
    MCMD1つを表す
    """

    def __init__(self):
        super().__init__()

        # inもoutも一つずつ
        self.signature = (
            { 'in' : { 'type': 'frame' } },
            { 'out': { 'type': 'frame' } }
        )
        self.fds = []

    def execute(self, arguments={}, inputs={}):
        """
        MCMD用のコマンド文字列を作成して実行する
        返すのはvalueにData型を持つdictである必要がある
        """

        # まず唯一の引数を受け取る
        input = list(inputs.values())[0]

        # パイプでつなげられそうなら、つなげる
        stdin = input.get_fd()
        self.fds.append(stdin)

        # UNIXコマンド用配列を作る
        command_args = self.name.split()

        for key, val in arguments.items():
            command_args.append('%s=%s' % (key, val))


        # コマンド列から作られる結果を返す        
        frame = PopenFrame(command_args, stdin=stdin)

        key_name = list(self.signature[1].keys())[0]
        return { key_name: frame } # keyとDataを返す

    def dtor(self):
        # print('MCommand.dtor()', self.fds)
        for fd in self.fds:
            fd.close()
