
class Stores():

    def __init__(self, store_list):
        self._store_list = store_list

    def to_json(self):
        ret = []
        for store in self._store_list:
            ret.append(store.to_json())
        return ret

