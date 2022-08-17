class BadRequestException(Exception):
    """
    不正なHTTPリクエストであることを示す例外
    """
    pass


class InvalidAcceptHeader(Exception):
    """
    不正なAcceptヘッダが渡された場合に発生する例外
    """
    pass
