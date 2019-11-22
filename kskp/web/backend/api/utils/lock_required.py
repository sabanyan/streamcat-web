import functools
from flask import request
from kskp.web.backend import app

def lock_required(func):
    """
    指定されたLockのuuidをLockManagerが持っているか確認する
    """
    @functools.wraps(func)
    def wrapper(**kwargs):
        if request.json is None or 'lock' not in request.json:
            raise Exception('ロックのUUIDを指定してください')
        lock_uuid = request.json['lock']
        lock_manager = app.config['LOCK_MANAGER'] 
        if not lock_manager.contains(lock_uuid):
            raise Exception('対象データをロックしてから更新・削除してください')
        return func(**kwargs)

    return wrapper
