class Command:
    """
    コマンド

    :param name: コマンドにつける名称。必須。
                 現在、フローファイルに書かれた情報をここに取り込み、
                 それに従い、読み込むべきCommandクラスの名前を決定する。
    """

    def __init__(self, name=''):
        # assert name is not None and name != ''

        self.name = name

        # このコマンドに与えることができるパラメータの定義リスト
        # 中身はParameterインスタンス
        self.parameters = []

        # このコマンドに与えることができるデータの定義。
        # dict二つのtupleで、１つ目は入力、２つ目は出力。
        self.signature = ({}, {})

        self.description = ''
        # self.version = '0.1.0'

    def execute(self, arguments={}, inputs={}):
        # TODO: 引数のvalidation
        raise Exception()


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

        # self.default = None
        # self.validation = None
