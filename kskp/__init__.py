from flask import Flask, render_template
from .model import model
from .auth import login_required
from .api import api

app = Flask('kskp')
app.register_blueprint(model)
app.register_blueprint(api, url_prefix='/api/v0')

# デコレータで設定できないので直接渡す
app.teardown_appcontext_funcs.append(model.app_context_teardown)

app.secret_key = '-jm624cqpry89e'


@app.route('/login')
def login():
    session['user_id'] = 'me'
    return 'login'

from flask import session

@app.route('/logout')
def logout():
    del session['user_id']
    return 'logout'

@app.route('/')
def top():
    return "i'm top of the world %r" % app.root_path

@app.route('/projects')
@login_required
def projects():
    return render_template('projects.html')
    

if __name__ == '__main__':
    app.run()
