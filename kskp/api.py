from flask import Blueprint

api = Blueprint('api', __name__)

@api.route('/')
def api_root():
    return "I'm api root %s" % api.root_path
