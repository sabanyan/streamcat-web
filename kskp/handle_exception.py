from flask import jsonify
import functools

def handle_exception(return_json=False):
    def _handle_exception(func):
        """
        デコレートした関数から例外が創出された場合は、エラーJSONを返す
        return_json : 関数が正常終了した場合は戻り値をto_json()して返す
        """
        @functools.wraps(func)
        def wrapper(**kwargs):
            try:
                result = func(**kwargs)
                if return_json:
                    if result is None:
                        return jsonify({'success': True})
                    else:
                        return jsonify({'success': True, 'data': result.to_json()})
                else:
                    return result
            except Exception as e:
                return jsonify({
                                'success': False,
                                'code'   : -1,
                                'message': str(e)
                            })
        return wrapper
    return _handle_exception
