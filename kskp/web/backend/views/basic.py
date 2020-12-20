from flask import Blueprint, render_template
from ..api.utils import login_required, login_required_api

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
    return render_template('profile.html')

@mod.route('/admin/users', methods=['GET', 'POST'])
@login_required
def admin_users():
    return _render_template('admin/users.html')

@mod.route('/library', methods=['GET', 'POST'])
@login_required
@login_required_api
def library():
    from flask import g
    uuid = g.factory.data.load_root().uuid
    return _render_template('library.html', folder_uuid=uuid, is_project='false', is_trash='false')

@mod.route('/projects/<project_uuid>', methods=['GET', 'POST'])
@login_required
def projects(project_uuid):
    uuid = project_uuid.rstrip('?')
    return _render_template('library.html', folder_uuid=uuid, is_project='true', is_trash='false')

@mod.route('/folders/<folder_uuid>', methods=['GET', 'POST'])
@login_required
def folders(folder_uuid):
    uuid = folder_uuid.rstrip('?')
    return _render_template('library.html', folder_uuid=uuid, is_project='false', is_trash='false')

@mod.route('/trashes', methods=['GET', 'POST'])
@login_required
def trashes():
    return render_template('library.html', is_project='false', is_trash='true')

@mod.route('/flows/<flow_uuid>', methods=['GET', 'POST'])
@login_required
def flow_designer(flow_uuid):
    return _render_template('flow_designer.html', flow_uuid=flow_uuid)

@mod.route('/preview', methods=['GET', 'POST'])
@login_required
def preview():
    return _render_template('preview.html')

# 開発用画面
# TODO: 将来、見れる権限の検討が必要かも
@mod.route('/dev', methods=['GET', 'PUT'])
@login_required
def dev():
    return render_template('dev/dev.html')

def _render_template(template_name, **context):
    import uuid
    from flask import make_response
    from bokeh.resources import INLINE
    from kskp.web.backend import SECURITY_LEVEL

    nonce = str(uuid.uuid4()).upper()[0:6]

    contents = render_template(template_name,
                                nonce=nonce,
                                js_resources=INLINE.render_js(),
                                css_resources=INLINE.render_css(),
                                **context)
    response = make_response(contents)

    if SECURITY_LEVEL >= 1:
        # Webブラウザに対し、コンテンツの取得元をディレクティブに従い制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/CSP
        response.headers['Content-Security-Policy-Report-Only'] = \
            f"default-src 'self'; script-src 'self' 'nonce-{nonce}' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"

        # Webブラウザに対し、<frame>,<iframe>,<embed>,<object>から取得するコンテンツを自身のドメインに制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Frame-Options
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'

    return response

