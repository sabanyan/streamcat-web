
from flask import Blueprint
mod = Blueprint('domain', __name__)

@mod.route('/.well-known/acme-challenge/wV3LsPZFb65LXXXOmdQqahi_mBsnh7pfBjKsZ09WDo8', methods=['GET'])
def auau():
    return 'wV3LsPZFb65LXXXOmdQqahi_mBsnh7pfBjKsZ09WDo8.bbFNSSp2hSSuvPpTtjfAj_P6HAhvna6AsW-KwNnPBzs'
