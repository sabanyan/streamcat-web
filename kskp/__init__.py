from flask import Flask, render_template

app = Flask('kskp')
app.secret_key = '-jm624cqpry89e'

import kskp.model
from .auth import login_required
from .api import api

app.register_blueprint(api, url_prefix='/api/v0')

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
    with app.open_resource('data/frame/dat1.csv') as data:
        contents = data.read()
        return "i'm top of the world %r" % contents

@app.route('/projects')
@login_required
def projects():
    return render_template('projects.html')


if __name__ == '__main__':
    app.run()
