from flask import Blueprint
from ..api.utils import login_required_api
from .utils import login_required, make_response

mod = Blueprint('basic_template', __name__)

@mod.route('/', methods=['GET'])
def top():
    from flask import redirect, url_for
    return redirect(url_for('basic_template.library'))

@mod.route('/favicon.ico', methods=['GET'])
def favicon():
    from flask import send_from_directory
    return send_from_directory('../frontend/static/images', 'kskp.ico', mimetype='image/x-icon')

@mod.route('/settings/profile', methods=['GET', 'POST'])
@login_required
def profile():
    return make_response('profile.html')

@mod.route('/admin/users', methods=['GET', 'POST'])
@login_required
def admin_users():
    return make_response('admin/users.html')

@mod.route('/library', methods=['GET', 'POST'])
@login_required
@login_required_api
def library():
    from flask import g
    uuid = g.factory.data.load_root().uuid
    return make_response('library.html', folder_uuid=uuid, is_project='false', is_trash='false')

@mod.route('/projects/<project_uuid>', methods=['GET', 'POST'])
@login_required
def projects(project_uuid):
    uuid = project_uuid.rstrip('?')
    return make_response('library.html', folder_uuid=uuid, is_project='true', is_trash='false')

@mod.route('/folders/<folder_uuid>', methods=['GET', 'POST'])
@login_required
def folders(folder_uuid):
    uuid = folder_uuid.rstrip('?')
    return make_response('library.html', folder_uuid=uuid, is_project='false', is_trash='false')

@mod.route('/trashes', methods=['GET', 'POST'])
@login_required
def trashes():
    return make_response('library.html', is_project='false', is_trash='true')

@mod.route('/flows/<flow_uuid>', methods=['GET', 'POST'])
@login_required
def flow_designer(flow_uuid):
    return make_response('flow_designer.html', flow_uuid=flow_uuid)

@mod.route('/preview', methods=['GET', 'POST'])
@login_required
def preview():
    return make_response('preview.html', is_preview=True)

# 開発用画面
# TODO: 将来、見れる権限の検討が必要かも
@mod.route('/dev', methods=['GET', 'PUT'])
@login_required
def dev():
    return make_response('dev/dev.html')
