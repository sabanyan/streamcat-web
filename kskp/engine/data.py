import io # for StringIO
import csv # for csv reader

# for TempPathFileSource
import os
import tempfile
from pathlib import Path


class Source:
    """
    データの取得元、もしくは書込先になる情報をもつクラス
    基本的にはDataクラスのsource属性を介して使用される
    """

    def __init__(self, source_type=''):
        self.type = source_type

    def dtor(self):
        pass


class FileSource(Source):
    """
    一つのファイルを表すSource。読み書き共に可能
    """

    def __init__(self, source_type):
        super().__init__(source_type)

    @property
    def fd(self):
        pass

    @fd.setter
    def fd(self, value):
        pass


from pathlib import Path


class PathFileSource(FileSource):
    """
    パスでファイルを表すFileSource。
    読み書き共に可能
    """

    def __init__(self, source_type, source_dir, file_name):
        super().__init__(source_type)
        self.source_dir = source_dir
        self.file_name = file_name

    @property
    def fd(self):
        path = Path(self.source_dir).joinpath(self.file_name)
        # print(self)
        # print(path)
        return open(path, 'r')

    @fd.setter
    def fd(self, value):
        pass

    @property
    def fullpath(self):
        return Path(self.source_dir).joinpath(self.file_name)

    def __repr__(self):
        return f'PathFileSource path: {Path(self.source_dir).joinpath(self.file_name)}'

import subprocess


class UnixCommandSource(FileSource):
    """
    UNIXコマンド実行列を持つFileSource。
    読み取りのみが可能
    """

    def __init__(self, source_type, args, stdin=None):
        super().__init__(source_type)
        self.args = args
        self.stdin = stdin
        self.popen = None

    @property
    def fd(self):
        self.popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=subprocess.PIPE, universal_newlines=True)
        return self.popen.stdout

    @fd.setter
    def fd(self, value):
        raise Exception()

    def save(self, stdout):
        """ engineから使う最後の保存用 """
        popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=stdout)
        popen.wait()

    def dtor(self):
        # print('UnixCommandSource dtor:', self.args)
        self.popen.wait()
        self.popen.stdout.close()


class TempPathFileSource(PathFileSource):
    """
    実行後にファイルがすぐ消されるPathFileSource
    テスト用
    """

    def __init__(self, source_type):
        _, path = tempfile.mkstemp()
        self.path = Path(path)
        super().__init__(source_type, self.path.parent.as_posix(), self.path.name)

    def dtor(self):
        os.unlink(self.path)

    def __repr__(self):
        return f'TempPathFileSource path: {Path(self.source_dir).joinpath(self.file_name)}'

class Data:
    """
    データ全般を表すクラス

    :param source: データソース。現時点では以下のどれかの文字列が入る予定
                   'popen', 'csv', 'json', 'postgres', 'mysql'
                   Noneの場合は直接メモリ上だけにデータを持っていることになる
    :param uuid: 各frameを一意に識別するためのID
                 source is Noneであればframe_uuidもNoneであるが、
                 それ以外の場合ではuuid is not Noneのはず
                 (但し代入の順番の都合もあるかもしれないのでチェックはしない)
    """

    def __init__(self, uuid=None, source=Source()):
        self.uuid = uuid
        self.source = source

    def read(self):
        raise Exception()

    def write(self):
        raise Exception()

    def dtor(self):
        self.source.dtor()


import os
import uuid

from pathlib import Path

class Frame(Data):
    """
    列指向の表形式データ
    """

    def __init__(self, frame_uuid=None, source=Source()):
        super().__init__(frame_uuid, source)

    @property
    def contents(self):
        if self.source.type == '':
            return '(no contents)'

        with self.source.fd as fd:
            # text = str(fd.read(), encoding='utf-8').rstrip('\n')
            # print('text:', text)
            # reader = csv.reader(io.StringIO(text))
            reader = csv.reader(fd)
            res = {}
            first_row = True

            for row in reader:
                if first_row:
                    for col in row:
                        res[col] = []
                    cols = row
                    first_row = False
                else:
                    for i, col in enumerate(cols):
                        res[col].append(row[i])

        return res

    def __repr__(self):
        # return f'<Frame({ self.source }) contents:{self.contents.__repr__()}>'
        return f'<Frame({ self.source })>'

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


# class CsvFrame(Frame):
#     """
#     CSVから作成されるframe
#
#     :param path: 対象のファイルのパス。まだ保存されていない場合はNoneを指定する。
#     """
#
#     def __init__(self, csv_path=None, frame_uuid=None):
#         super().__init__('csv', frame_uuid)
#         self.path = csv_path
#
#     @classmethod
#     def from_uuid(cls, frame_uuid):
#         """通常KSKPで使うときはこちらから"""
#         return cls(make_path(frame_uuid), frame_uuid)
#
#     def get_fd(self):
#         """
#         ファイルへのfdを返す
#         """
#         return open(self.path, 'r')
#
#     def get_contents(self):
#         """ ファイルの中身を読んでself.contentsに入れる """
#         import csv
#         with open(self.path, 'r', encoding='utf-8') as f:
#             reader = csv.reader(f)
#             for row in reader:
#                 print(row)
#
#     def __repr__(self):
#         return f'<kskp.engine.Frame({ self.source }) path:{ self.path } contents:{self.contents.__repr__()}>'


# class PopenFrame(Frame):
#     """
#     Popenに必要なものを持っているが必要になるまで実行されない
#     実行されると、Frameなどの実際のデータをもつようになる（変換される）
#     """
#
#     def __init__(self, args, stdin=None):
#         new_uuid = str(uuid.uuid4())
#         super().__init__('popen', new_uuid)
#         self.args = args
#         self.stdin = stdin
#
#         self.already_piped = False
#
#         self.mtee_popen = None
#         self.popen = None
#
#         self.path = None
#
#     def to_csv(self):
#         """
#         コマンドを実行してその結果からCsvFrameを作って返す
#         """
#
#         # 出力用パスを作る
#         # uuidを生成（新しいファイル名）
#         # new_uuid = str(uuid.uuid4())
#         new_uuid = self.uuid
#
#         with open(make_path(new_uuid), 'w') as fd:
#             popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=fd)
#             popen.wait()
#
#         return CsvFrame.from_uuid(new_uuid)
#
#     def get_fd(self):
#         " パイプの出口となるfile descriptorを返す "
#         # self.debug_popen = subprocess.Popen(['mtee', f'o=kskp/data/frames/wowow.csv'], stdin=self.stdin, stdout=subprocess.PIPE)
#         # self.mtee_popen = subprocess.Popen(self.args, stdin=self.debug_popen.stdout, stdout=subprocess.PIPE)
#         self.mtee_popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=subprocess.PIPE)
#
#         # waitはここでしてはいけないので、dtorで行う
#         # popen.wait()
#
#         # フラグを立てる（2回目はパイプではなくファイルから読み込むように）
#         self.already_piped = True
#
#         # すでにファイルが存在していれば、mteeは行わない
#         # if Path(make_path(self.uuid)).exists():
#         #     return self.mtee_popen.stdout
#
#         # mteeで中間ファイルを吐く
#         self.path = make_path(self.uuid)
#         self.popen = subprocess.Popen(['mtee', f'o={self.path}'], stdin=self.mtee_popen.stdout, stdout=subprocess.PIPE)
#         return self.popen.stdout
#
#     def dtor(self):
#         self.popen.wait()
#         self.mtee_popen.wait()
#         self.mtee_popen.stdout.close()
#
#         # self.debug_popen.wait()
#
#     def __repr__(self):
#         return f'<kskp.engine.Frame(popen) args:{ self.args } stdin:{ self.stdin } contents:{self.contents.__repr__()}>'



def make_path(frame_uuid):
    """
    uuidからデータのパスを作って返す
    内部使用目的
    """

    # frameの保存場所の指定は必須
    if 'KENG_FRAME_PATH' not in os.environ:
        raise Exception()

    return f"{ os.environ['KENG_FRAME_PATH'] }/{ frame_uuid }.csv"
