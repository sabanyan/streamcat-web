class RequestJson():

    _request_json = {}

    def __init__(self, request_json):
        if request_json is None:
            raise Exception('リクエストJsonが指定されていません')
        self._request_json = request_json

    def __getitem__(self, key):
        return self._request_json[key]

    def get(self, key):
        return self._request_json.get(key)

    def has(self, key):
        """
        指定したキーが存在し、かつ値が設定されていることを確認する
        """
        d = self._request_json
        return key in d and d[key] is not None and d[key] != ''

    def isnull(self, key):
        """
        指定したキーが存在し、かつnullが設定されていることを確認する
        """
        d = self._request_json
        return key in d and d[key] is None

    # def has_or_null(self, key):
    #     """
    #     指定したキーが存在し、値が設定されているかnullが設定されていることを確認する
    #     """
    #     d = self._request_json
    #     return key in d and d[key] is None and d[key] != ''

    def has_all(self, *keys):
        """
        全てのキーについて、
        指定したキーが存在し、かつ値が設定されていることを確認する
        """
        for key in keys:
            if not self.has(key):
                return False
        return True

    def has_no_all(self, *keys):
        """
        全てのキーについて、
        指定したキーが存在しない、または値が設定されていないことを確認する
        """
        for key in keys:
            if self.has(key):
                return False
        return True

    def has_at_least(self, *keys):
        """
        指定したキーのうち少なくとも1つについて、
        指定したキーが存在し、かつ値が設定されていることを確認する
        """
        return not self.has_no_all(*keys)

