from flask import jsonify
import functools

## 「例外を処理している」「JSONで結果を返す」という
## 2種類の処理を行なっているため命名が難しいですが
## あえて大まかな括りで、api_skeltonとかapi_baseとかapi_templateとかの方がいいんですかね
def return_with_json(func):
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
