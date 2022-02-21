class RequestHeaders():

    class Accept():
        def __init__(self, accept:str) -> None:
            if accept is None:
                self._mimetype = 'application/json'
                self._charset = 'UTF-8'
            else:
                accept_list = accept.split(';', maxsplit=2)
                if len(accept_list) == 1:
                    self._mimetype = accept_list[0].strip()
                    self._charset = None
                elif len(accept_list) == 2:
                    charset = accept_list[1].strip().split('charset=', maxsplit=1)
                    if len(charset) != 2:
                        raise Exception(f'Acceptヘッダのcharsetが不正です{charset}')
                    self._mimetype = accept_list[0].strip()
                    self._charset = charset[1].strip()
                else:
                    raise Exception('Acceptヘッダが不正です')
        @property
        def mimetype(self):
            return self._mimetype
        @property
        def charset(self):
            return self._charset

    def __init__(self, request_headers):
        if request_headers is None:
            raise Exception('リクエストヘッダが指定されていません')

        accept_str = request_headers.get('Accept')
        self._accept = RequestHeaders.Accept(accept_str)

    @property
    def accept_mimetype(self):
        return self._accept.mimetype

    @property
    def accept_charset(self):
        return self._accept.charset
