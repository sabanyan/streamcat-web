from flask import Flask

import kskp.store

from .api import api

app = Flask('kskp.web')

app.register_blueprint(api, url_prefix='/api/v0')

if __name__ == '__main__':
    app.run()
