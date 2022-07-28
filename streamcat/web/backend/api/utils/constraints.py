import functools
from .response import Status

class Constraints():
    """
    プロジェクト単位での権限設定をするための機能
    権限の基盤機能と分けるためDecoratorとする
    """

    @staticmethod
    def allow_download_only_with_writable(func):
        """
        実行可否を更新権限で判定する
        """
        from flask import jsonify, g

        def error(message:str, status_code:int):
            return jsonify({'code':-1, 'message': message}), status_code

        @functools.wraps(func)
        def wrapper(*args, **kwargs):

            # frameのuuidを取得する
            frame_uuid = args[0]
            try:
                frame = g.factory.data.find_by_uuid(frame_uuid)
            except Exception as e:
                return error(str(e), Status.INERNAL_SERVER_ERROR)

            if frame.writable:
                return func(*args, **kwargs)
            else:
                return error(f'{g.user.name}は{frame.label}のダウンロード権限がありません', Status.FORBIDDEN)

        return wrapper
        