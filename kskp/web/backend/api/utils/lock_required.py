import functools
from flask import request, jsonify
from kskp.web.backend import app

def lock_required(func):
    """
    指定されたLockのuuidをLockManagerが持っているか確認する
    """
    @functools.wraps(func)
    def wrapper(**kwargs):
        if request.json is None or 'lock' not in request.json:
            return jsonify({
                            'success': False,
                            'code'   : -1,
                            'message': 'ロックのUUIDを指定してください'
                        })
        lock_uuid = request.json['lock']
        lock_manager = app.config['LOCK_MANAGER'] 
        if not lock_manager.contains(lock_uuid):
            return jsonify({
                            'success': False,
                            'code'   : -1,
                            'message': 'ロックが強制解除された、または有効期限が切れました'
                        })
        return func(**kwargs)

    return wrapper
