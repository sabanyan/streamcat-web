from flask import jsonify
import functools
from kskp.store import NothingToPutbackException, NoResultsException
from kskp.store import LockedDatumException

def api_base(func):
    """
    デコレートした関数から例外が創出された場合は、エラーJSONを返す
    関数が正常終了した場合は戻り値を'data'属性に格納して返す
    """
    @functools.wraps(func)
    def wrapper(**kwargs):
        try:
            # デコレート対象関数の呼び出し
            result = func(**kwargs)
            if result is None:
                return jsonify({'success': True})
            else:
                return jsonify({'success': True, 'data': result})
        except LockedDatumException as e:
            return jsonify({
                            'success': False,
                            'code'   : -2,
                            'message': str(e)
                        })
        except NothingToPutbackException as e:
            return jsonify({
                            'success': False,
                            'code'   : -3,
                            'message': str(e)
                        })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                            'success': False,
                            'code'   : -1,
                            'message': str(e)
                        })
    return wrapper


def frame_api_base(func):
    """
    Frame関連のAPIは戻り値を'lasts'属性に格納して返す
    そのためapi_baseとは別のクラスを用意する
    """
    @functools.wraps(func)
    def wrapper(**kwargs):
        try:
            # デコレート対象関数の呼び出し
            result = func(**kwargs)
            if result is None:
                return jsonify({'success': True})
            else:
                return jsonify({'success': True, 'lasts': result})
        except NoResultsException as e:
            return jsonify({
                            'success': False,
                            'code'   : -4,
                            'message': str(e)
                        })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                            'success': False,
                            'code'   : -1,
                            'message': str(e)
                        })
    return wrapper