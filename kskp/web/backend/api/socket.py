from flask import Blueprint, request, session, jsonify, send_from_directory, render_template
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils import api_base, lock_required
from .frames import run_flow_by_websocket
from kskp.store import *
from kskp.web.backend import app

import os
from geventwebsocket.handler import WebSocketHandler
from watchdog.events import PatternMatchingEventHandler
from watchdog.observers import Observer
import json
import logging
import time

mod = Blueprint('socket', __name__)

MESSAGE_FLOW_EXCUTE_START = "MESSAGE_FLOW_EXCUTE_START"
MESSAGE_FLOW_EXCUTE_LOG = "MESSAGE_FLOW_EXCUTE_LOG"
MESSAGE_FLOW_EXCUTE_END = "MESSAGE_FLOW_EXCUTE_END"
MESSAGE_EXCEPTION = "MESSAGE_EXCEPTION"

@mod.route('/websocket')
@login_required_api
def connect():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        try:
            while True:
                message = ws.receive()
                message = json.loads(message)
                result = messageHandler(ws, message)
                message['type'] = MESSAGE_FLOW_EXCUTE_LOG
                message['data'] = result    
                ws.send(json.dumps(message))
        except Exception as e:
            message['type'] = MESSAGE_EXCEPTION
            message['data'] = str(e)
            logging.info("--------connect---------")
            logging.info(message)
            logging.info(json.dumps(message))
            #ws.send(message)

def messageHandler(ws, message):
    result = False
    # ユーザーがフロー実行ボタンをクリックした時
    if message['type'] == MESSAGE_FLOW_EXCUTE_START:
        result = onFlowExcuteMessageReceived(ws, message)
    else:
        raise Exception(message.type)
    return result

def onFlowExcuteMessageReceived(ws, message):
    args = message['args']
    flow_uuid = message['flowUUID']

    path = './log/' + message['flowUUID']
    job_complete_handler = JobCompleteHandler(ws,path)
    # Nysolのdlog（進捗）確認のため、WatchDog
    observer = Observer()
    observer.schedule(job_complete_handler, job_complete_handler.path)
    # WatchDog Start
    observer.start()
    # 実行
    result = run_flow_by_websocket(message, job_complete_handler.path)
    time.sleep(1)
    observer.stop()
    # observer threadの終了を待つ
    observer.join()

    return result

class JobCompleteHandler(PatternMatchingEventHandler):
    
    def __init__(self, ws, path):
        super().__init__()
        self.ws = ws
        self.path = path
        
        if not os.path.exists(self.path):
            os.makedirs(self.path)
    
    def on_created(self, event):
        self.send_message(event)

    def on_modified(self, event):
        self.send_message(event)
        
    def send_message(self, event):
        if event.is_directory:
            return 

        with open(event.src_path, 'r') as f:
            message = {}
            message['type'] = MESSAGE_FLOW_EXCUTE_LOG
            message['data'] =  f'{f.read()}'

            self.ws.send(json.dumps(message))

