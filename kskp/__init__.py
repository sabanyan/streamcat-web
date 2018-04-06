from flask import Flask
from kskp.model import model
from kskp.api import api

app = Flask('kskp')
app.register_blueprint(model)
app.register_blueprint(api, url_prefix='/api/v0')

@app.route('/')
def top():
    return "i'm top of the world %r" % app.root_path

if __name__ == '__main__':
    app.run()
