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

class NotAuthenticationException(Exception):
    """
    未認証であることを通知する例外
    """
    def __init__(self, message, response=None) -> None:
        super().__init__(message)
        self.response = response

    @property
    def has_response(self):
        return self.response is not None
