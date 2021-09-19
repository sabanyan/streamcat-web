from flask import Blueprint, send_from_directory, request, g
from kskp.store import DatabaseConn, RemoteFolderConn
from kskp.store.lock import lock_manager
from .utils import (
    RequestJson,
    api_base,
    update_projects_info,
    login_required_api
)

mod = Blueprint('lib', __name__)

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

def _jsonify_folder(folder):
    """
    NOTE: この関数を呼び出す前にfolderがNoneで無いかチェックすること
    """
    if folder is None:
        raise Exception('The folder argument must not be None.')

    # フォルダ直下のフォルダとデータベースとドキュメントを取得する
    children = folder.find_children()

    # children属性を作成する
    data = folder.to_json()
    data['children'] = children
    
    # folderPath属性を作成する
    folder_list = folder.get_folder_path()
    data['folderPath'] = [folder for folder in folder_list]
    return data

@mod.route('/library', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fecth_library():
    """
    ルートデータストアを返却する
    """
    root = g.factory.data.load_root()
    return _jsonify_folder(root)

@mod.route('/trashes', methods=['GET'])
@login_required_api
@api_base
def fetch_trashes():
    """
    ゴミ箱を返却する
    """
    trash_folder = g.factory.data.find_trashcan()
    return _jsonify_folder(trash_folder)

@mod.route('/trashes/<datum_uuid>', methods=['PUT'])
@login_required_api
@api_base
def return_trashes(datum_uuid):
    """
    ゴミを捨てる前の場所に戻す
    """
    datum = g.factory.data.find_by_uuid(datum_uuid)
    return datum.put_back()

@mod.route('/trashes', methods=['DELETE'])
@login_required_api
@api_base
def empty_all():
    """
    ゴミ箱を空にする
    """
    trash_folder = g.factory.data.find_trashcan()
    trash_folder.trash_all()

@mod.route('/locks', methods=['POST'])
@login_required_api
@api_base
def make_new_lock():
    """
    ロックを獲得する
    """
    req = RequestJson(request.json)
    if not req.has('target'):
        raise Exception('排他ロック対象データのuuidを指定してください')

    if req.has('lastModifiedAt'):
        # 排他ロックの再取得の場合
        from datetime import datetime
        target_uuid = request.json['target']
        target = g.factory.data.find_by_uuid(target_uuid)
        last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
        lock = lock_manager.relock(target, lastModifiedAt=last_modified_at, creator=g.user)
    else:
        # 排他ロックの新規取得の場合
        # (新規取得の場合はfind_by_uuid()の実行で遅くしたくない)
        target_uuid = request.json['target']
        lock = lock_manager.lock(target_uuid, creator=g.user)
    
    return lock.to_json()

@mod.route('/extend-locks/<lock_uuid>', methods=['POST'])
@login_required_api
@api_base
def extend_lock(lock_uuid):
    """
    ロックの有効期間を延長する
    """
    from kskp.store.lock import LockedDatumException
    if not lock_manager.contains(lock_uuid):
        raise LockedDatumException(f'Lock ({lock_uuid}) is already expired')

@mod.route('/delete-locks', methods=['POST'])
@login_required_api
@api_base
def delete_all_locks():
    """
    指定したuuidのロックを解除する
    全てのロックを解除する
    """
    if 'of' in request.args:
        target_uuid = request.args['of']
        return lock_manager.unlock_target(target_uuid)
    else:
        return lock_manager.unlock_all()

"""
frontendのNavagator.sendBeacon()に対応するため、下記のように変更
methods: DELETE => POST
url=/locks/<lock_uuid> => /delete-locks/<lock_uuid>に変更
"""
@mod.route('/delete-locks/<lock_uuid>', methods=['POST'])
@login_required_api
@api_base
def delete_lock(lock_uuid):
    """
    ロックを解除する
    """ 
    return lock_manager.unlock(lock_uuid)

@mod.route('/folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fetch_folder(folder_uuid):
    """
    フォルダを返却する
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    return _jsonify_folder(folder)

@mod.route('/folders', methods=['POST'])
@login_required_api
@api_base
def make_new_folder():
    """
    フォルダを作成する
    """
    parent = g.factory.data.find_by_uuid(request.json['parent'])
    new_folder = parent.create_folder(request.json['label'])
    new_folder.save()
    return new_folder

@mod.route('/folders/<folder_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_folder(folder_uuid):
    """
    フォルダのラベルを修正する、またはフォルダを移動する
    """
    if ('label'  not in request.json or request.json['label']  == '') and \
       ('parent' not in request.json or request.json['parent'] == ''):
        raise Exception('labelまたはparent属性を指定してください')
    elif 'label' in request.json and 'parent' in request.json:
        raise Exception('labelとはparent属性は同時に指定できません')
        
    if 'label' in request.json and request.json['label'] != '':
        # フォルダのラベルを修正する
        label = request.json['label']
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.update_data(label)
    elif 'parent' in request.json and request.json['parent'] != '':
        # フォルダを移動する
        new_parent = request.json['parent']
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.move(new_parent)
    else:
        raise Exception('update_folder parameter error!')

@mod.route('/folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_folder(folder_uuid):
    """
    フォルダをほかす
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    folder.throw_away()

@mod.route('/awss3s/<awss3_uuid>', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fetch_awss3_folder(awss3_uuid):
    """
    AWS S3フォルダを返却する
    """
    folder = g.factory.data.find_by_uuid(awss3_uuid)
    return _jsonify_folder(folder)

@mod.route('/awss3s', methods=['POST'])
@login_required_api
@api_base
def make_new_awss3_folder():
    """
    AWS S3フォルダを作成する
    """
    parent = g.factory.data.find_by_uuid(request.json['parent'])
    new_folder = parent.create_awss3(request.json['label'],
                                     request.json['bucket'])
    # AwsS3レコードをDBに格納する
    new_folder.save()
    return new_folder.to_json()

@mod.route('/awss3s/<awss3_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_awss3_folder(awss3_uuid):
    """
    AWS S3フォルダを修正する
    """
    label = request.json['label']
    bucket_name = request.json['bucket']
    awss3 = g.factory.data.find_by_uuid(awss3_uuid)
    return awss3.update_data(label, bucket_name)


@mod.route('/awss3s/<awss3_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_awss3(awss3_uuid):
    """
    AWS S3フォルダをほかす
    """
    # AWS S3ディレクトリ直下のファイルをDBから登録解除する
    pass

    folder = g.factory.data.find_by_uuid(awss3_uuid)
    # AWS S3 folderレコードをDBから削除する
    folder.throw_away()

@mod.route('/databases/<database_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_database(database_uuid):
    """
    データベースを返却する
    """
    database = g.factory.data.find_by_uuid(database_uuid)
    return database

@mod.route('/databases', methods=['POST'])
@login_required_api
@api_base
def make_new_database():
    """
    データベースを作成する
    """
    database_conn = DatabaseConn(request.json)

    # 接続情報に漏れがあれば例外を送出する
    database_conn.valid_or_raise()

    parent = g.factory.data.find_by_uuid(request.json['parent'])
    new_database= parent.create_database(request.json['label'],
                                         database_conn)
    ret = new_database.to_json()
    new_database.save()
    return ret

@mod.route('/databases/<database_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_database(database_uuid):
    """
    データベースを修正する、またはデータベースを移動する
    """
    if ('label'  not in request.json or request.json['label']  == '') and \
       ('parent' not in request.json or request.json['parent'] == ''):
        raise Exception('labelまたはparent属性を指定してください')
    elif 'label' in request.json and 'parent' in request.json:
        raise Exception('labelとはparent属性は同時に指定できません')

    if 'label' in request.json and request.json['label'] != '':
        # データベースを修正する
        database_conn = DatabaseConn(request.json)

        # 接続情報に漏れがあれば例外を送出する
        database_conn.valid_or_raise()

        label = request.json['label']
        database = g.factory.data.find_by_uuid(database_uuid)
        return database.update_data(label, database_conn)
    elif 'parent' in request.json and request.json['parent'] != '':
        # データベースを移動する
        new_parent = request.json['parent']
        database = g.factory.data.find_by_uuid(database_uuid)
        return database.move(new_parent)
    else:
        raise Exception('update_database parameter error!')

@mod.route('/databases/<database_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_database(database_uuid):
    """
    データベースをほかす
    """
    database = g.factory.data.find_by_uuid(database_uuid)
    # DatabaseレコードをDBから削除する
    database.throw_away()


@mod.route('/remote-folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fetch_remote_folder(folder_uuid):
    """
    リモートフォルダを返却する
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    return folder


@mod.route('/remote-folders', methods=['POST'])
@login_required_api
@api_base
def make_new_remote_folder():
    """
    リモートフォルダを作成する
    """
    remote_folder_conn = RemoteFolderConn(request.json)

    # 接続情報に漏れがあれば例外を送出する
    remote_folder_conn.valid_or_raise()

    parent = g.factory.data.find_by_uuid(request.json['parent'])
    new_folder = parent.create_remote_folder(request.json['label'],
                                             remote_folder_conn)
    ret = new_folder.to_json()
    new_folder.save()
    return ret

@mod.route('/remote-folders/<folder_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_remote_folder(folder_uuid):
    """
    リモートフォルダを修正する、またはリモートフォルダを移動する
    """
    if ('label'  not in request.json or request.json['label']  == '') and \
       ('parent' not in request.json or request.json['parent'] == ''):
        raise Exception('labelまたはparent属性を指定してください')
    elif 'label' in request.json and 'parent' in request.json:
        raise Exception('labelとはparent属性は同時に指定できません')

    if 'label' in request.json and request.json['label'] != '':
        # リモートフォルダを修正する
        remote_folder_conn = RemoteFolderConn(request.json)

        # 接続情報に漏れがあれば例外を送出する
        remote_folder_conn.valid_or_raise()

        label = request.json['label']
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.update_data(label, remote_folder_conn)
    elif 'parent' in request.json and request.json['parent'] != '':
        # リモートフォルダを移動する
        new_parent = request.json['parent']
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.move(new_parent)
    else:
        raise Exception('update_remote_folder parameter error!')

@mod.route('/remote-folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_remote_folder(folder_uuid):
    """
    リモートフォルダをほかす
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    # リモートフォルダレコードをDBから削除する
    folder.throw_away()


@mod.route('/documents/<document_uuid>', methods=['GET'])
@login_required_api
def fetch_document(document_uuid):
    """
    ドキュメントを返却する
    """
    document = g.factory.data.find_by_uuid(document_uuid)
    return send_from_directory(document.path.parent, document.path.name, mimetype=document.content_type)

@mod.route('/documents', methods=['POST'])
@login_required_api
@api_base
def make_new_document():
    """
    ファイルストリームからファイルタイプを判定して
    FrameまたはDocumentを作成する
    """
    if request.files.get('file') is None:
        raise Exception('No file found.')
    if 'parent' not in request.form:
        raise Exception('No parent is designated.')
    if 'label' not in request.form:
        raise Exception('No label is designated.')

    # NOTE: HTTPのContent-TypeはWebブラウザの判定で殆どの場合はファイル名の拡張子から判定される
    content_type = request.files['file'].content_type
    maybe_csv = content_type == 'text/csv'
    
    # 格納先フォルダを取得する
    parent = g.factory.data.find_by_uuid(request.form.get('parent'))
    # ファイルを作成する
    new_file = parent.create_file(request.form.get('label'),
                                  request.files.get('file').stream,
                                  maybe_csv=maybe_csv)
    # ファイルをDBに格納する
    new_file.save()

@mod.route('/documents/<document_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_document(document_uuid):
    """
    指定したdocumentのラベル名を変更する、または移動する
    """
    req = RequestJson(request.json)

    if req.has_no_all('parent', 'label'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('parent', 'label') and req.has('label'):
        raise Exception('labelとparent属性は同時に指定できません')

    document = g.factory.data.find_by_uuid(document_uuid)

    if req.has('parent'):
        # ドキュメントを移動する
        new_parent = req['parent']
        return document.move(new_parent)
    elif req.has('label'):
        # ドキュメントのラベルを修正する
        label = req['label']
        return document.update_label(label)
    else:
        raise Exception('update_document parameter error!')

@mod.route('/documents/<document_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_document(document_uuid):
    """
    指定したdocumentをほかす
    """
    document = g.factory.data.find_by_uuid(document_uuid)
    document.throw_away()
