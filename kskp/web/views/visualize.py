import json

from pathlib import Path
from flask import Blueprint, jsonify, request, jsonify, render_template
from kskp.store import CommandLink

mod = Blueprint('visualize', __name__)

@mod.route('/visualizers', methods=['POST'])
def execute_visualizer():
    """
    ビジュアライズコマンドの実行
    """
    command = CommandLink(request.args.get('from')).resolve()

    result = command.run(request.json.get('args'), request.json.get('inputs'))['o']

    if request.args.get('from') == 'csvtohtmltable':
        return render_template('visualize/table.html', header=result['header'], reader=result['reader'])

    # TODO: tableコマンド以外はまだkskp-data-storeに追加していない
    return render_template('visualize/component.html', script=result['script'], dic=result['div'])
