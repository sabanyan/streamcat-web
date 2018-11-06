from flask import Flask, render_template, url_for, redirect, session, request

app = Flask('kskp')

# jsonify関数を使うときにUTF-8として返却できるようにするための設定
app.config['JSON_AS_ASCII'] = False
# jsonify関数を使ってJSON形式で返すと勝手に並び順がソートされてしまうので、それを無効にする
app.config["JSON_SORT_KEYS"] = False

from .auth import auth_bp, login_required
from .api import api
from .model import *

app.register_blueprint(auth_bp, url_prefix='/signup')
app.register_blueprint(api, url_prefix='/api/v0')


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
    return render_template('flow_designer.html',flow_uuid=flow_uuid)

@app.route('/library', methods=['GET', 'POST'])
@login_required
def library():
    return render_template('library.html')

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    return render_template('profile.html')

if __name__ == '__main__':
    app.run()
