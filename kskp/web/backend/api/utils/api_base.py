from flask import Response, jsonify
import functools

def api_base(func):
    """
    デコレートした関数から例外が創出された場合は、エラーJSONを返す
    関数が正常終了した場合は戻り値を'data'属性に格納して返す
    """

    def error_json(e:Exception, error_code:int):
        return jsonify({
            'success': False,
            'code'   : error_code,
            'message': str(e)
        })

    # OK
    # リクエストは成功し、レスポンスとともに要求に応じた情報が返される
    OK = 200

    # 内容なし
    # リクエストを受理したが、返すべきレスポンスエンティティが存在しない場合に返される
    # NOTE: 204を返すとレスポンスボディは空になる
    NO_CONTENT = 204

    # 禁止されている
    # リソースにアクセスすることを拒否された/リクエストはしたが処理できないという意味で返される
    FORBIDDEN = 403

    # 前提条件で失敗した
    # 前提条件が偽だった場合に返される
    PRECONDITION_FAILED = 412

    # ロックされている
    LOCKED = 423

    # サーバ内部エラー
    # サーバ内部にエラーが発生した場合に返される
    INERNAL_SERVER_ERROR = 500

    @functools.wraps(func)
    def wrapper(**kwargs):
        from kskp.store import NothingToPutbackException, NoResultsException
        from kskp.store.auth import NotAuthorizedException
        from kskp.store.lock import LockedDatumException

        try:
            # デコレート対象関数の呼び出し
            result = func(**kwargs)
            if result is None:
                return jsonify({'success': True}), OK
            elif isinstance(result, Response):
                return result
            else:
                return jsonify({'success': True, 'data': result}), OK
        except LockedDatumException as e:
            return error_json(e, -2), LOCKED
        except NothingToPutbackException as e:
            return error_json(e, -3), PRECONDITION_FAILED
        except NoResultsException as e:
            return error_json(e, -4), OK
        except NotAuthorizedException as e:
            import traceback
            traceback.print_exc()
            return error_json(e, -1), FORBIDDEN
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error_json(e, -1), INERNAL_SERVER_ERROR
    
    return wrapper
