import os
import uuid

from ...core import Parameter, Command
from ...data import *


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
        self.inputs_for_dtor = []

    def execute(self, arguments={}, inputs={}):
        """
        MCMD用のコマンド文字列を作成して実行する
        返すのはvalueにData型を持つdictである必要がある
        """

        # まず唯一の引数を受け取る
        input = list(inputs.values())[0]

        # パイプでつなげられそうなら、つなげる
        # print('execute input:', input)
        stdin = input.source.fd
        self.fds.append(stdin)

        self.inputs_for_dtor.append(input)

        # UNIXコマンド用配列を作る
        command_args = self.name.split()

        for key, val in arguments.items():
            if key == 'x' and val == True:
                # TODO: 場所を移すべき？ mcut用
                command_args.append('-x')
            elif key == 'n' and val == True:
                command_args.append('-n')
            elif key == 'rng' and val == True:
                command_args.append('-rng')
            else:
                command_args.append('%s=%s' % (key, val))


        # コマンド列から作られる結果を返す
        source = UnixCommandSource('csv', command_args, stdin=stdin)
        frame_uuid = str(uuid.uuid4())
        frame = Frame(frame_uuid, source)

        key_name = list(self.signature[1].keys())[0]
        return { key_name: frame } # keyとDataを返す

    def dtor(self):
        # print('MCommand.dtor()', self.fds)
        for fd in self.fds:
            fd.close()

        for i in self.inputs_for_dtor:
            i.dtor()
