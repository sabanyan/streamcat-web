from backend import app
from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer
import argparse

def run(host, port):
    app.debug = True
    host_port = (host, port)
    server = WSGIServer(
        host_port,
        app,
        handler_class=WebSocketHandler
    )
    print("Server is running on {}:{}".format(host, port))
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
    
    run(host, port)