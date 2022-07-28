class Status:
    # OK
    # リクエストは成功し、レスポンスとともに要求に応じた情報が返される
    OK = 200

    # 内容なし
    # リクエストを受理したが、返すべきレスポンスエンティティが存在しない場合に返される
    # NOTE: 204を返すとレスポンスボディは空になる
    NO_CONTENT = 204

    # リクエストが不正
    BAD_REQUEST = 400

    # 認証が必要である
    UNAUTHORIZED = 401

    # 禁止されている
    # リソースにアクセスすることを拒否された/リクエストはしたが処理できないという意味で返される
    FORBIDDEN = 403

    # 指定された形式のリソースを返せない
    # Accept/Accept-Charset/Accept-Encoding/Accept-Languageヘッダに対応したレスポンスを返せない
    NOT_ACCEPTABLE = 406

    # 前提条件で失敗した
    # 前提条件が偽だった場合に返される
    PRECONDITION_FAILED = 412

    # ロックされている
    LOCKED = 423

    # サーバ内部エラー
    # サーバ内部にエラーが発生した場合に返される
    INERNAL_SERVER_ERROR = 500

def is_ok(status_code:int):
    return status_code in (Status.OK, Status.NO_CONTENT)
