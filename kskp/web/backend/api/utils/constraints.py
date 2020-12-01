import functools

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

        from flask import request, g, jsonify

        def error(message):
            return jsonify({'success':False, 'code':-1, 'message': message})

        @functools.wraps(func)
        def wrapper(*args, **kwargs):

            # frameのuuidと拡張子指定を取得する
            frame_uuid = request.args.get('uuid')
            try:
                frame = g.factory.data.find_by_uuid(frame_uuid)
            except Exception as e:
                return error(str(e))

            if frame.writable:
                return func(*args, **kwargs)
            else:
                return error(f'{g.user.name}は{frame.label}のダウンロード権限がありません')

        return wrapper
        