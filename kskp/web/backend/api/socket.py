from flask import Blueprint, request, session, jsonify, send_from_directory, render_template
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils import api_base, lock_required
from .frames import run_flow
from kskp.store import *
from kskp.web.backend import app

from geventwebsocket.handler import WebSocketHandler
from watchdog.events import PatternMatchingEventHandler

mod = Blueprint('socket', __name__)

@mod.route('/websocket')
@login_required_api
def connect():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            message = ws.receive()
            ws.send(f'you send {message}. thanx.')
    
    '''
    isDone = False
    while isDone is False:
        message = ws.receive()
        isDone = messageHandler(message, request)
    '''

MESSAGE_FLOW_EXCUTE_START = "MESSAGE_FLOW_EXCUTE_START"
MESSAGE_FLOW_EXCUTE_LOG = "MESSAGE_FLOW_EXCUTE_LOG"
MESSAGE_FLOW_EXCUTE_END = "MESSAGE_FLOW_EXCUTE_END"
def messageHandler(message, request):
    result = False
    if message.type == MESSAGE_FLOW_EXCUTE_START:
    # フロントエンドでフローが実行された時
        result = onFlowExcuteMessageReceived(request)
    else:
        raise Exception(message.type)
    return result

def onFlowExcuteMessageReceived(request):
    args = request.json['args']
    flow_uuid = request.json['flow_uuid']
    lock_uuid = request.json['lock_uuid']
    path = "kskp/messages/" + flow_uuid
    handler = JobCompleteHandler(ws, path)

    run_flow(flow_uuid, args, request, handler)

    return True


class JobCompleteHandler(PatternMatchingEventHandler):
    
    def __init__(self, ws, path):
        super().__init__()
        self.ws = ws
        self.path = path

    def on_created(self, event):
        self.send_message(event)

    def on_modified(self, event):
        self.send_message(event)
    
    def send_message(self, event):
        if event.is_directory:
            return 

        with open(event.src_path, 'r') as f:
            self.ws.send(f'{f.read()}')

