from pathlib import Path
from flask import Blueprint, jsonify, request, jsonify

from kskp.store import CommandsPathFileSource
from kskp.web.core import CommandsPathLink

api = Blueprint('api', __name__)

@api.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """

    link = CommandsPathLink(CommandsPathFileSource())

    return jsonify({'success': True, 'data': link.resolve()})
