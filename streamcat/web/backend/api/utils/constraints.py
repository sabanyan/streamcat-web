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
        @functools.wraps(func)
        def wrapper(*args, **kwargs):

            # frameとuserを取得する
            frame = args[0]
            user = args[1]

            if frame.writable:
                return func(*args, **kwargs)
            else:
                raise NotAuthorizedException(f'{user.name}は{frame.label}のダウンロード権限がありません')

        return wrapper
