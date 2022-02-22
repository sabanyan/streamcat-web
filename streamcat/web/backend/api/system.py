import os
from flask import (
    Blueprint,
    send_from_directory,
    request,
    g
)
from .utils import (
    RequestJson,
    api_base,
    login_required_api,
    make_refresh_token,
    make_access_token
)

mod = Blueprint('system', __name__)

@mod.route('/navigation', methods=['GET'])
@login_required_api
@api_base
def get_navigation():
    """
    ナビゲーションバーに表示する情報などを取得する
    """
    from streamcat.core import STREAMCAT_VER

    navigation = {
        'version': STREAMCAT_VER,
        'depoName': os.environ.get('STREAMCAT_DEPO') or 'Unit Test',
        'user': {},
        'allowlist': {}
    }

    if g.user is not None:
        navigation['user'] = g.user.to_json()
        navigation['allowlist'] = g.user.get_allowlist()

    return navigation


@mod.route('/stores', methods=['GET'])
@login_required_api
@api_base
def fecth_stores():
    """
    データストアの定義(雛形)の一覧を返却する
    """
    return g.factory.store.find_all()

@mod.route('/stores/<store_id>', methods=['GET'])
@login_required_api
@api_base
def fecth_store(store_id):
    """
    データストアの定義(雛形)を返却する
    """
    return g.factory.store.find_by_id(store_id)

@mod.route('/stores', methods=['POST'])
@login_required_api
@api_base
def make_new_store():
    """
    データストアの定義(雛形)を作成する
    """
    new_store = g.factory.store.create(request.json['id'],
                                       request.json['version'],
                                       request.json['label'],
                                       request.json['description'],
                                       request.json['url'],
                                       request.json['params'])
    new_store.save()
    return new_store

@mod.route('/stores/<store_id>', methods=['DELETE'])
@login_required_api
@api_base
def delete_store(store_id):
    """
    データストアの定義(雛形)を削除する
    """
    store = g.factory.store.find_by_id(store_id)
    store.delete()


@mod.route('/archives/flows/<uuid>', methods=['GET'])
@login_required_api
def download_flow(uuid):
    from streamcat.store import FlowDumper
    flow_dumper = FlowDumper(g.factory)
    (archive_path, archive_name) = flow_dumper.dump_archive(uuid)

    # アーカイブファイルを返す
    ret = send_from_directory(archive_path.parent, archive_path.name, as_attachment = True,
                              download_name=archive_name + '.tgz', mimetype='application/gzip')
    archive_path.unlink()
    return ret

@mod.route('/archives/flows', methods=['POST'])
@login_required_api
@api_base
def upload_flow():
    from pathlib import Path

    if 'file' not in request.files or request.files.get('file') is None:
        raise Exception('No archive file found.')
    if 'parent' not in request.form:
        raise Exception('No parent is designated.')

    if 'label' in request.form:
        folder_label = request.form['label']
    else:
        folder_label = None

    parent = g.factory.data.find_by_uuid(request.form['parent'])
    file_name = Path(request.files.get('file').filename).stem
    stream = request.files.get('file').stream

    from streamcat.store import FlowDumper
    flow_dumper = FlowDumper(g.factory)
    flow_dumper.restore_archive(parent, folder_label, file_name, stream)


@mod.route('/dump', methods=['GET'])
@login_required_api
def get_dump():
    """
    StreamCatのDumpファイルを取得する
    """
    from datetime import datetime
    from streamcat.core import Tmp
    from streamcat.engine import execute
    from streamcat.depo.std.commands.scmd.script import DumpCommand

    try:
        # Dumpコマンドを実行する
        outs = execute(DumpCommand(), args={'datum_factory': g.factory.data})
        if 'o' not in outs or isinstance(outs['o'], Exception):
            raise Exception(f'DumpCommandの実行に失敗しました {outs.get("o","")}')

        # Dumpファイルをクライアントに返す
        archive_path = outs['o']
        archive_name = 'backup_' + datetime.now().strftime('%Y%m%d') + '.tgz'
        return send_from_directory(archive_path.parent, archive_path.name, as_attachment=True,
                                   download_name=archive_name, mimetype='application/gzip')
    finally:
        # Dumpコマンドで作成した一時ファイルを削除する
        Tmp.remove_files()
    
@mod.route('/dump', methods=['POST'])
@login_required_api
@api_base
def upload_dump():
    """
    StreamCatのDumpファイルを復元する
    """
    from streamcat.engine import execute
    from streamcat.depo.std.commands.scmd.script import RestoreCommand

    if 'file' not in request.files or request.files.get('file') is None:
        raise Exception('Dumpファイルを指定してください')

    # 入力ストリームを取得する
    stream = request.files.get('file').stream

    # Restoreコマンドを実行する
    outs = execute(RestoreCommand(), args={'factory': g.factory}, inputs={'i':stream})
    if 'o' not in outs or isinstance(outs['o'], Exception):
        raise Exception(f'RestoreCommandの実行に失敗しました {outs.get("o","")}')


@mod.route('/tokens/refresh', methods=["POST"])
@login_required_api
@api_base
def get_refresh_token():
    """
    リフレッシュトークンを発給する
    """
    req = RequestJson(request.json)

    if not req.has('currentPassword'):
        raise Exception('現在のパスワードを指定してください')
    if not g.user.authenticate(req['currentPassword']):
        raise Exception('現在のパスワードが誤っています')

    return make_refresh_token(g.user.uuid)

@mod.route('/tokens/access', methods=["POST"])
@login_required_api
@api_base
def get_access_token():
    """
    アクセストークンを発給する
    """
    # アクセストークンを用いて新たなアクセストークンを
    # 発給できるが脆弱性にはならないだろう
    return make_access_token(g.user.uuid)


@mod.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """
    from flask import jsonify
    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
