# TODO: 実装を進めていって、使い始めたものからコメントアウトしていく

# import json
# import uuid
from pathlib import Path
# from .engine.data3 import *
from flask import Blueprint, request, session, jsonify, send_from_directory, render_template
# from .auth import login_required_api
# from .utils.navigation import update_navigation
# from .utils.api_base import api_base
# from .library import (
#     # data3.pyのFrameクラスと名称を被らないようにAS別名を付ける
#     # (将来的にdata3.pyのFrameと統合したい)
#     Frame as FrameModel,
#     Folder,
#     FRAME_FOLDER_UUID,
#     CACHE_FOLDER_UUID
# )
# from .utils.activity import (
#     make_unfinished_history,
#     make_finished_history
# )
# from datetime import datetime, timezone, timedelta
# from . import app


mod = Blueprint('api', __name__)

@mod.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """
    from kskp.store import CommandsPathFileSource
    from kskp.web.core import CommandsPathLink
    
    link = CommandsPathLink(CommandsPathFileSource())

    return jsonify({'success': True, 'data': link.resolve()})
