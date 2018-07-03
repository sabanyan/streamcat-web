import os
import uuid
import subprocess


class Frame:
    """
    列指向の表形式データ

    :param source: データソース。現時点では以下のどれかの文字列が入る予定
                   'popen', 'csv', 'json', 'postgres', 'mysql'
                   Noneの場合は直接メモリ上だけにデータを持っていることになる
    :param uuid: 各frameを一意に識別するためのID
                 source is Noneであればframe_uuidもNoneであるが、
                 それ以外の場合ではuuid is not Noneのはず
                 (但し代入の順番の都合もあるかもしれないのでチェックはしない)
    """

    def __init__(self, source=None, frame_uuid=None):
        self.source = source
        self.uuid = frame_uuid
        self.contents = {}

    def __repr__(self):
        return f'<kskp.engine.Frame({ self.source }) contents:{self.contents.__repr__()}>'

    def row_count(self):
        """
        1つ目の列にあるリストの行数を返すようにする
        """
        return len(self.contents[list(self.contents.keys())[0]])

    def update(self, updating_dict):
        """
        そのまま中身のupdateに使う
        """
        self.contents.update(updating_dict)

    def dtor(self):
        pass


class CsvFrame(Frame):
    """
    CSVから作成されるframe

    :param path: 対象のファイルのパス。まだ保存されていない場合はNoneを指定する。
    """

    def __init__(self, csv_path=None, frame_uuid=None):
        super().__init__('csv', frame_uuid)
        self.path = csv_path

    @classmethod
    def from_uuid(cls, frame_uuid):
        """通常KSKPで使うときはこちらから"""
        return cls(make_path(frame_uuid), frame_uuid)

    def get_fd(self):
        """
        ファイルへのfdを返す
        """
        return open(make_path(self.uuid), 'r')

    def __repr__(self):
        return f'<kskp.engine.Frame({ self.source }) path:{ self.path } contents:{self.contents.__repr__()}>'


class PopenFrame(Frame):
    """
    Popenに必要なものを持っているが必要になるまで実行されない
    実行されると、Frameなどの実際のデータをもつようになる（変換される）
    """

    def __init__(self, args, stdin=None):
        new_uuid = str(uuid.uuid4())
        super().__init__('popen', new_uuid)
        self.args = args
        self.stdin = stdin

        self.already_piped = False

        self.mtee_popen = None
        self.popen = None

        self.path = None

    def to_csv(self):
        """
        コマンドを実行してその結果からCsvFrameを作って返す
        """

        # 出力用パスを作る
        # uuidを生成（新しいファイル名）
        # new_uuid = str(uuid.uuid4())
        new_uuid = self.uuid

        with open(make_path(new_uuid), 'w') as fd:
            popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=fd)
            popen.wait()

        return CsvFrame.from_uuid(new_uuid)

    def get_fd(self):
        " パイプの出口となるfile descriptorを返す "
        # self.debug_popen = subprocess.Popen(['mtee', f'o=kskp/data/frames/wowow.csv'], stdin=self.stdin, stdout=subprocess.PIPE)
        # self.mtee_popen = subprocess.Popen(self.args, stdin=self.debug_popen.stdout, stdout=subprocess.PIPE)
        self.mtee_popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=subprocess.PIPE)

        # waitはここでしてはいけないので、dtorで行う
        # popen.wait()

        # フラグを立てる（2回目はパイプではなくファイルから読み込むように）
        self.already_piped = True

        # すでにファイルが存在していれば、mteeは行わない
        # if Path(make_path(self.uuid)).exists():
        #     return self.mtee_popen.stdout

        # mteeで中間ファイルを吐く
        self.path = make_path(self.uuid)
        self.popen = subprocess.Popen(['mtee', f'o={self.path}'], stdin=self.mtee_popen.stdout, stdout=subprocess.PIPE)
        return self.popen.stdout

    def dtor(self):
        self.popen.wait()
        self.mtee_popen.wait()
        self.mtee_popen.stdout.close()

        # self.debug_popen.wait()

    def __repr__(self):
        return f'<kskp.engine.Frame(popen) args:{ self.args } stdin:{ self.stdin } contents:{self.contents.__repr__()}>'



def make_path(frame_uuid):
    """
    uuidからデータのパスを作って返す
    内部使用目的
    """

    # frameの保存場所の指定は必須
    if 'KENG_FRAME_PATH' not in os.environ:
        raise Exception()

    return f"{ os.environ['KENG_FRAME_PATH'] }/{ frame_uuid }.csv"
