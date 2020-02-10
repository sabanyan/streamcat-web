from backend import app
from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer
import argparse

# https://coderwall.com/p/q2mrbw/gevent-with-debug-support-for-flask
from werkzeug.serving import run_with_reloader
from werkzeug.debug import DebuggedApplication
import logging
logging.basicConfig(level=logging.INFO) 


host = "0.0.0.0"
port = 5000

#@run_with_reloader
def run_server():
    app.debug = True
    if app.debug:
        application = DebuggedApplication(app)
    else:
        application = app
    server = WSGIServer(
        (host, port),
        app,
        handler_class=WebSocketHandler
    )
    print("Server is Starting on {}:{}".format(host, port))
    server.serve_forever()
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Process')
    parser.add_argument('host', metavar='host', type=str, default="0.0.0.0",
                    help='an str for hostname')
    parser.add_argument('port', metavar='port', type=int, default=5000,
                    help='an integer for port')
    args = parser.parse_args()
    host = args.host
    port = args.port
    
    if host and port:
        run_server()
    else:
        print("Host, Portが入力されていません。")