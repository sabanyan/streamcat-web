import os
from flask import Blueprint

mod = Blueprint('domain', __name__)

DOMAIN_AUTHN_PATH = os.environ.get('KSKP_DOMAIN_AUTHN_PATH', '/.well-known/pki-validation/dummy')
DOMAIN_AUTHN_KEY= os.environ.get('KSKP_DOMAIN_AUTHN_KEY', '')

if DOMAIN_AUTHN_PATH is not None and DOMAIN_AUTHN_PATH.startswith('/'):
    # 
    # APIのパス部分が設定されていない場合は、ドメイン認証APIを定義しない
    # 
    @mod.route(DOMAIN_AUTHN_PATH, methods=['GET'])
    def authz_domain():
        """
        ドメイン認証API
        """
        return DOMAIN_AUTHN_KEY
