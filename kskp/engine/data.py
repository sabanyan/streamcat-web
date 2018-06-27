import os
import uuid
import subprocess


class Promise:
    """
    Popenに必要なものを持っているが必要になるまで実行されない
    実行されると、Frameなどの実際のデータをもつようになる（変換される）
    """

    def __init__(self, args, stdin=None):
        self.args = args
        self.stdin = stdin
        self.fd = None

    def get_fd(self):
        " パイプの出口となるfile descriptorを返す "

        if self.fd is None:
            popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=subprocess.PIPE)
            self.fd = popen.stdout

        return self.fd

    def save(self):
        """
        コマンドを実行してDataを作って保存する 何も返却しない
        """

        # 出力用パスを作る
        # uuidを生成（新しいファイル名）
        new_uuid = str(uuid.uuid4())

        with open(make_path(new_uuid), 'w') as fd:
            popen = subprocess.Popen(self.args, stdin=self.stdin, stdout=fd)
            popen.wait()

    def close(self):
        if self.fd is not None:
            self.fd.close()


class Frame:
    """
    表形式データ
    """

    def __init__(self, frame_uuid=None):
        """
        TODO: 表そのもののデータも取得できるように
        """
        self.uuid = frame_uuid
        self.fd = None

    def get_fd(self):
        """
        ファイルへのfdを返す
        """
        if self.fd is None:
            self.fd = open(make_path(self.uuid), 'r')
        return self.fd

    def save(self):
        """
        すでにファイルはできているので何もする必要はない
        """
        pass

    def close(self):
        if self.fd is not None:
            self.fd.close()


def make_path(frame_uuid):
    """
    uuidからデータのパスを作って返す
    内部使用目的
    """

    # frameの保存場所の指定は必須
    if 'KENG_FRAME_PATH' not in os.environ:
        raise Exception()

    return f"{ os.environ['KENG_FRAME_PATH'] }/{ frame_uuid }.csv"
