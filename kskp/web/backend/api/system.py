import os
from flask import (
    Blueprint,
    send_from_directory,
    jsonify,
    request,
    g
)
from .utils import (
    Constraints,
    api_base,
    login_required_api
)

mod = Blueprint('api', __name__)

@mod.route('/navigation', methods=['GET'])
@login_required_api
@api_base
def get_navigation():
    """
    ナビゲーションバーに表示する情報などを取得する
    """
    from kskp.core import KSKP_VER

    navigation = {
        'version': KSKP_VER,
        'depoName': os.environ.get('KSKP_DEPO') or 'Unit Test',
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


@mod.route('/files')
@login_required_api
@Constraints.allow_download_only_with_writable
def download_file():

    def convert(file_path, source_encoding, source_newline, target_encoding, target_newline):
        """
        指定されたファイルの文字コードと改行コードを変換する
        """
        with file_path.open(encoding=source_encoding, newline=source_newline, errors='replace') as f:
            for line in f:
                if source_encoding == target_encoding and source_newline == target_newline:
                    # 変換処理が必要ない場合は処理を軽くする
                    yield line
                else:
                    # 変換できない文字があれば、
                    # UTF-8への変換の場合は�(U+FFFD)に置き換える
                    # CP932への変換の場合は?(3F)に置き換える
                    line = line.rstrip(source_newline) + target_newline
                    yield line.encode(target_encoding, errors='replace')

    def error(message):
        return jsonify({'success':False, 'code':-1, 'message': message})

    # frameのuuidと拡張子指定を取得する
    frame_uuid = request.args.get('uuid')
    ext = request.args.get('ext')

    try:
        frame = g.factory.data.find_by_uuid(frame_uuid)
    except Exception as e:
        return error(str(e))

    frame_path = frame.path
    if not frame_path.exists():
        return error(f'指定されたFrame({frame_uuid})のファイル({frame_path})が存在しませんでした')

    # frameの文字コードと改行コードを識別する
    source_encoding = 'utf-8' if frame.encoding == 'UNKNOWN' else frame.encoding
    source_newline = '\n' if frame.newline == 'UNKNOWN' else frame.newline

    # 環境変数からダウンロードファイルの文字コード設定値を取得する
    # (設定値がない場合は'UTF-8'とする)
    target_encoding = os.getenv('KSKP_FRAME_CHARACTER_CODE', 'UTF-8').lower()
    target_newline = '\r\n' if target_encoding in ('cp932', 'CP932') else '\n'

    # ダウンロードファイルのサイズを計算する
    if source_encoding == target_encoding and source_newline == target_newline:
        # 変換処理がない場合は元ファイルサイズがダウンロードファイルのサイズである
        downloadFileSize = frame.file_size
    else:
        downloadFileSize = None

    # ダウンロードファイル名を作成する
    if frame.label.endswith('.csv') or frame.label.endswith('.txt'):
        downloadFileName = frame.label
    elif ext is None or ext == '':
        downloadFileName = frame.label + '.csv'
    else:
        downloadFileName = frame.label + '.' + ext
    
    # ファイル名をURLエンコードする
    import urllib.parse
    downloadFileName = urllib.parse.quote(downloadFileName)

    # frameを返す
    # ・文字コード変換と改行コード変換をしながら返す
    # ・Streamで返すため一時ファイルは作成されない
    # ・変換に失敗した文字は代替する文字に置き換える
    from flask import Response
    try:
        response = Response(convert(frame_path, source_encoding, source_newline, target_encoding, target_newline))
        response.content_type = f'text/csv; {target_encoding}'
        if downloadFileSize is not None:
            # 設定することでWebブラウザがダウンロードの進捗状況を表示してくれるかも
            response.content_length = downloadFileSize
        # filename*=はFirefox用
        response.headers['Content-Disposition'] = f'attachment; filename={downloadFileName}; filename*={downloadFileName}'
        return response
    except UnicodeDecodeError:
        return error(f'指定されたFrame({frame_uuid})のファイル({frame_path})を{source_encoding}で開けませんでした')
    except UnicodeEncodeError:
        return error(f'指定されたFrame({frame_uuid})のファイル({frame_path})を{target_encoding}に変換できませんでした')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error(str(e))


@mod.route('/flow_files/<uuid>', methods=['GET'])
@login_required_api
def download_flow(uuid):
    from kskp.store import FlowDumper
    flow_dumper = FlowDumper(g.factory)
    (archive_path, archive_name) = flow_dumper.dump_archive(uuid)

    # アーカイブファイルを返す
    ret = send_from_directory(archive_path.parent, archive_path.name, as_attachment = True,
                              download_name = archive_name + '.tgz', mimetype = 'application/x-tar')
    archive_path.unlink()
    return ret

@mod.route('/flow_files', methods=['POST'])
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

    from kskp.store import FlowDumper
    flow_dumper = FlowDumper(g.factory)
    flow_dumper.restore_archive(parent, folder_label, file_name, stream)


@mod.route('/dump', methods=['GET'])
@login_required_api
def get_dump():
    """
    KSKPのDumpファイルを取得する
    """
    from datetime import datetime
    from kskp.core import Tmp
    from kskp.engine import execute
    from kskp.depo.std.commands.scmd.script import DumpCommand

    try:
        # Dumpコマンドを実行する
        outs = execute(DumpCommand(), args={'datum_factory': g.factory.data})
        if 'o' not in outs or isinstance(outs['o'], Exception):
            raise Exception(f'DumpCommandの実行に失敗しました {outs.get("o","")}')

        # Dumpファイルをクライアントに返す
        archive_path = outs['o']
        archive_name = 'backup_' + datetime.now().strftime('%Y%m%d') + '.tgz'
        return send_from_directory(archive_path.parent, archive_path.name, as_attachment=True,
                                   download_name=archive_name, mimetype='application/x-tar')
    finally:
        # Dumpコマンドで作成した一時ファイルを削除する
        Tmp.remove_files()
    
@mod.route('/dump', methods=['POST'])
@login_required_api
@api_base
def upload_dump():
    """
    KSKPのDumpファイルをリストアする
    """
    from kskp.engine import execute
    from kskp.depo.std.commands.scmd.script import RestoreCommand

    if 'file' not in request.files or request.files.get('file') is None:
        raise Exception('Dumpファイルを指定してください')

    # 入力ストリームを取得する
    stream = request.files.get('file').stream

    # Restoreコマンドを実行する
    outs = execute(RestoreCommand(), args={'factory': g.factory}, inputs={'i':stream})
    if 'o' not in outs or isinstance(outs['o'], Exception):
        raise Exception(f'RestoreCommandの実行に失敗しました {outs.get("o","")}')


@mod.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """
    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
