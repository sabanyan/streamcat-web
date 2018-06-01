from flask import Flask, render_template, url_for, redirect

app = Flask('kskp')

from .auth import login_required
from .api import api

app.register_blueprint(api, url_prefix='/api/v0')


@app.route('/')
def top():
    return redirect(url_for('projects'))

@app.route('/projects', methods=['GET', 'POST'])
@login_required
def projects():
    return render_template('projects.html')

@app.route('/flows', methods=['GET', 'POST'])
@login_required
def flows():
    return render_template('flows.html')

@app.route('/flows/<flow_uuid>', methods=['GET', 'POST'])
@login_required
def flow_designer(flow_uuid):
    return render_template('flow_designer.html')


if __name__ == '__main__':
    app.run()
