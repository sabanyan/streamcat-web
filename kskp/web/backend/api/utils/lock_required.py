import functools
from flask import request
# from kskp.web.backend import lock_manager

def lock_required(func):
    """
    指定されたLockのuuidをLockManagerが持っているか確認する
    """
    @functools.wraps(func)
    def wrapper(**kwargs):
        if 'lock' not in request.json:
            raise Exception('ロックのUUIDを指定してください')
        lock_uuid = request.json['lock']
        if not lock_manager.contains(lock_uuid):
            raise Exception('対象データをロックしてから更新・削除してください')
        return func(**kwargs)

    return wrapper
