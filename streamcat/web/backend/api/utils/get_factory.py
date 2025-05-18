from fastapi import Request
from streamcat.store.finder import Factory

def get_factory(request:Request) -> Factory:
    """
    Requestに格納されたfactoryを取得する
    NOTE: FastAPIのDependsで型指定をする為だけに用いる無処理の関数
    """
    pass
