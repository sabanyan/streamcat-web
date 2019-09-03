from flask import Blueprint
mod = Blueprint('front_static', __name__, static_url_path='/front_static', static_folder='./static')
