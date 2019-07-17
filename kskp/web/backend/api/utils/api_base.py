from flask import jsonify
import functools

def api_base(func):
    """
    デコレートした関数から例外が創出された場合は、エラーJSONを返す
    関数が正常終了した場合は戻り値を'data'属性に格納して返す
    """
    @functools.wraps(func)
    def wrapper(**kwargs):
        try:
            result = func(**kwargs)
            if result is None:
                return jsonify({'success': True})
            else:
                return jsonify({'success': True, 'data': result})
        except Exception as e:
            return jsonify({
                            'success': False,
                            'code'   : -1,
                            'message': str(e)
                        })
    return wrapper
