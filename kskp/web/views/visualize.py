# 将来的にどうなるかわからないので、ひとまず他のrender_templateと隔離しておく
import json

from pathlib import Path
from flask import Blueprint, request, render_template
from kskp.web.api.auth import login_required

mod = Blueprint('visualize', __name__)

@mod.route('/visualizers', methods=['POST'])
@login_required
def execute_visualizer():
    """
    ビジュアライズコマンドの実行
    """
    from kskp.store import CommandLink

    command = CommandLink(request.args.get('from')).resolve()

    result = command.run(request.json.get('args'), request.json.get('inputs'))['o']

    try:
        if request.args.get('from') == 'csvtohtmltable':
            return render_template('visualize/table.html', header=result['header'], reader=result['reader'])
    except:
        return render_template('visualize/table.html', header=[], reader=[])

    # TODO: tableコマンド以外はまだkskp-data-storeに追加していない
    return render_template('visualize/component.html', script=result['script'], dic=result['div'])
