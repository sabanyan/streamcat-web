import functools
from flask import Response, jsonify
from .response import Status

def api_base(func):
    """
    デコレートした関数から例外が創出された場合は、エラーJSONを返す
    関数が正常終了した場合は戻り値を'data'属性に格納して返す
    """

    def error_json(e:Exception, error_code:int):
        return jsonify({
            'code'   : error_code,
            'message': str(e)
        })

    @functools.wraps(func)
    def wrapper(**kwargs):
        from streamcat.store import NothingToPutbackException, NoResultsException
        from streamcat.store.auth import NotAuthorizedException
        from streamcat.store.lock import LockedDatumException
        from . import BadRequestException, InvalidAcceptHeader

        try:
            # デコレート対象関数の呼び出し
            result = func(**kwargs)
            if result is None:
                return {}, Status.NO_CONTENT
            elif isinstance(result, Response):
                return result, Status.OK
            else:
                return jsonify(result), Status.OK
        except LockedDatumException as e:
            return error_json(e, -2), Status.LOCKED
        except NothingToPutbackException as e:
            return error_json(e, -3), Status.PRECONDITION_FAILED
        except NoResultsException as e:
            return error_json(e, -4), Status.OK
        except NotAuthorizedException as e:
            import traceback
            traceback.print_exc()
            return error_json(e, -1), Status.FORBIDDEN
        except InvalidAcceptHeader as e:
            return error_json(e, -1), Status.NOT_ACCEPTABLE
        except BadRequestException as e:
            return error_json(e, -1), Status.BAD_REQUEST
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error_json(e, -1), Status.INERNAL_SERVER_ERROR
    
    return wrapper
