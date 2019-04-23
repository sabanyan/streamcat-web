# import ptvsd
# ptvsd.enable_attach(address = ('0.0.0.0', 3000))
# ptvsd.wait_for_attach()
# ptvsd.break_into_debugger()

from flask import Flask, render_template, url_for, redirect, session, request
from bokeh.resources import INLINE

app = Flask('kskp')

# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config["JSON_SORT_KEYS"] = False

from .auth import auth_bp, login_required
from .api import api
from .lib import lib
from .model import *

app.register_blueprint(auth_bp, url_prefix='/signup')
app.register_blueprint(api, url_prefix='/api/v0')
app.register_blueprint(lib, url_prefix='/api/v0')

# flaskのjsonifyによるJSONへのデコード処理を、独自に定義したデコード処理に置き換える
from .library_json_encoder import LibraryJSONEncoder
app.json_encoder = LibraryJSONEncoder

from .util_endpoints import endpoints
app.register_blueprint(endpoints, url_prefix='/')

@app.route('/')
def top():
    return redirect(url_for('projects'))

@app.route('/projects', methods=['GET', 'POST'])
@login_required
def projects():

    # ログインユーザーが閲覧可能なプロジェクト一覧を取得する
    projects = get_projects_by_user_id(session['user_id'])

    return render_template('projects.html', projects=projects)

@app.route('/flows', methods=['GET', 'POST'])
@login_required
def flows():
    return render_template('flows.html', flows=fetch_flows_by_project_uuid(request.args.get('project')),project_uuid=request.args.get('project'))

@app.route('/flows/<flow_uuid>', methods=['GET', 'POST'])
@login_required
def flow_designer(flow_uuid):
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()
    return render_template('flow_designer.html',flow_uuid=flow_uuid,js_resources=js_resources,css_resources=css_resources)

@app.route('/library', methods=['GET', 'POST'])
@login_required
def library():
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()
    return render_template('library.html',js_resources=js_resources,css_resources=css_resources)

@app.route('/folders/<folder_uuid>', methods=['GET'])
@login_required
def folders(folder_uuid):
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()
    folder_uuid = folder_uuid.rsplit('?')[0]
    return render_template('library.html',folder_uuid=folder_uuid,js_resources=js_resources,css_resources=css_resources)

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    return render_template('profile.html', user_id=session['user_id'])

def main():
    app.run()

if __name__ == '__main__':
    main()
