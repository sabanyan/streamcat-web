import functools
from streamcat.store.auth import NotAuthorizedException

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
        from flask import g

        @functools.wraps(func)
        def wrapper(*args, **kwargs):

            # frameのuuidを取得する
            frame_uuid = args[0]
            frame = g.factory.data.find_by_uuid(frame_uuid)

            if frame.writable:
                return func(*args, **kwargs)
            else:
                raise NotAuthorizedException(f'{g.user.name}は{frame.label}のダウンロード権限がありません')

        return wrapper
