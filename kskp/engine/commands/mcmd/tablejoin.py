from . import *

class Mcat(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.signature = (
            { '*' : { 'type': 'frame' } }, # 何個でも取れる
            { 'out': { 'type': 'frame' } }
        )

    def execute(self, arguments={}, inputs={}):
        """
        MCMD用のコマンド文字列を作成して実行する
        返すのはvalueにData型を持つdictである必要がある
        """

        # print('mcat:', list(inputs.values()))
        # UNIXコマンド用配列を作る
        command_args = self.name.split()

        # 引数をそれぞれパスにしていく
        inputs_for_arg_i = []
        for key, input in inputs.items():
            if isinstance(input.source, UnixCommandSource):
                # ファイルの拡張子はdatum.source.typeから決定する
                if input.source.type == 'csv':
                    ext = '.csv'
                else:
                    # その他の場合は今は考えない
                    raise Exception()

                path = Path(os.environ['KENG_FRAMES_PATH']).joinpath(input.uuid + ext)
                with path.open(mode='w', encoding='utf-8') as fd:
                    input.source.save(fd)
                input.source = PathFileSource('csv', path.parent, path.name)

            inputs_for_arg_i.append(input.source.fullpath.as_posix())

        command_args.append(f"i={','.join(inputs_for_arg_i)}")

        # コマンド列から作られる結果を返す
        source = UnixCommandSource('csv', command_args, stdin=None)
        frame = Frame(str(uuid.uuid4()), source)

        key_name = list(self.signature[1].keys())[0]
        return { key_name: frame } # keyとDataを返す


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

        # まずメインの入力を受け取る
        input = inputs['i']

        # パイプでつなげられそうなら、つなげる
        stdin = input.source.fd
        # print('mjoin:', stdin)

        # UNIXコマンド用配列を作る
        command_args = self.name.split()

        for key, val in args.items():
            command_args.append('%s=%s' % (key, val))
        # print('mjoin inputs:', inputs)

        # パイプなら、CSVに吐く
        input_m = inputs['m']

        if isinstance(input_m.source, UnixCommandSource):
            # ファイルの拡張子はdatum.source.typeから決定する
            if input_m.source.type == 'csv':
                ext = '.csv'
            else:
                # その他の場合は今は考えない
                raise Exception()

            path = Path(os.environ['KENG_FRAMES_PATH']).joinpath(input_m.uuid + ext)
            with path.open(mode='w', encoding='utf-8') as fd:
                input_m.source.save(fd)
            input_m.source = PathFileSource('csv', path.parent, path.name)

        command_args.append(f"m={ input_m.source.fullpath }")

        # print('mjoin:', command_args)

        # コマンド列から作られる結果を返す
        source = UnixCommandSource('csv', command_args, stdin=stdin)
        frame_uuid = str(uuid.uuid4())
        frame = Frame(frame_uuid, source)

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
