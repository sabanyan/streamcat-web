
from bokeh.resources import INLINE
from flask import render_template, redirect, session, request, Blueprint, url_for

from kskp.web.backend.api.auth import login_required

mod = Blueprint('basic_template', __name__)

@mod.route('/')
def top():
    return redirect(url_for('basic_template.projects'))

@mod.route('/projects', methods=['GET', 'POST'])
@login_required
def projects():
    from kskp.store import get_projects_by_user_id
    # ログインユーザーが閲覧可能なプロジェクト一覧を取得する
    projects = get_projects_by_user_id(session['user_id'])

    return render_template('projects.html', projects=projects)

@mod.route('/flows', methods=['GET', 'POST'])
@login_required
def flows():
    from kskp.store import fetch_flows_by_project_uuid
    return render_template('flows.html', flows=fetch_flows_by_project_uuid(request.args.get('project')),project_uuid=request.args.get('project'))

@mod.route('/flows/<flow_uuid>', methods=['GET', 'POST'])
@login_required
def flow_designer(flow_uuid):
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()
    return render_template('flow_designer.html',flow_uuid=flow_uuid,js_resources=js_resources,css_resources=css_resources)

@mod.route('/library', methods=['GET', 'POST'])
@login_required
def library():
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()
    return render_template('library.html',js_resources=js_resources,css_resources=css_resources)

@mod.route('/folders/<folder_uuid>', methods=['GET', 'POST'])
@login_required
def folders(folder_uuid):
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()
    folder_uuid = folder_uuid.rsplit('?')[0]
    return render_template('library.html',folder_uuid=folder_uuid,js_resources=js_resources,css_resources=css_resources)

@mod.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    return render_template('profile.html', user_id=session['user_id'])
