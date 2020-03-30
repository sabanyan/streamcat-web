from flask import Blueprint, request, jsonify, send_from_directory, g
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils.api_base import api_base
from pathlib import Path
from kskp.web.backend import app
from kskp.store import (
    DatabaseConn,
    RemoteFolderConn
)

from kskp.store.session import Session

mod = Blueprint('lib', __name__)

@mod.route('/flow_files/<uuid>', methods=['GET'])
@login_required_api
def download_flow(uuid):
    from kskp.store import FlowDumper
    flow_dumper = FlowDumper()
    (archive_path, archive_name) = flow_dumper.dump_archive(uuid)

    # アーカイブファイルを返す
    ret = send_from_directory(archive_path.parent, archive_path.name, as_attachment = True,
                              attachment_filename = archive_name + '.tgz', mimetype = 'application/x-tar')
    archive_path.unlink()
    return ret

@mod.route('/flow_files', methods=['POST'])
@login_required_api
@api_base  
def upload_flow():
    import json
    if 'file' not in request.files or request.files.get('file') is None:
        raise Exception('No archive file found.')

    creator = g.user
    root = get_library(g.session, creator)
    stream = request.files.get('file').stream
    
    from kskp.store import FlowDumper
    flow_dumper = FlowDumper()
    flow_dumper.restore_archive(root.uuid, stream, creator)

@mod.route('/stores', methods=['GET'])
@login_required_api
@api_base
def fecth_stores():
    """
    データストアの定義(雛形)の一覧を返却する
    """
    return g.session.store.find_all()

@mod.route('/stores/<store_id>', methods=['GET'])
@login_required_api
@api_base
def fecth_store(store_id):
    """
    データストアの定義(雛形)を返却する
    """
    return g.session.store.find_by_id(store_id)

@mod.route('/stores', methods=['POST'])
@login_required_api
@api_base
def make_new_store():
    """
    データストアの定義(雛形)を作成する
    """
    new_store = g.session.store.create(request.json['id'],
                                       request.json['version'],
                                       request.json['label'],
                                       request.json['description'],
                                       request.json['url'],
                                       request.json['params'],
                                       g.user)
    new_store.save()
    return new_store

@mod.route('/stores/<store_id>', methods=['DELETE'])
@login_required_api
@api_base
def delete_store(store_id):
    """
    データストアの定義(雛形)を削除する
    """
    store = g.session.store.find_by_id(store_id)
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

def get_library(session, user):
    """
    ルートデータストアを取得する、存在しない場合は作成する
    """
    root = session.data.find_root()
    # ルートフォルダが存在しない場合はルートフォルダを作成する
    # (最初にライブラリ画面にアクセスする時はルートフォルダ自身も存在しません)
    if root is None:
        new_root = session.data.create_folder(parent_uuid=None,
                                              label='ROOT_FOLDER',
                                              creator=user)
        # folderレコードをDBに格納する
        new_root.save()
        root = new_root
    return root

@mod.route('/library', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fecth_library():
    """
    ルートデータストアを返却する
    """
    root = get_library(g.session, g.user)
    return _jsonify_folder(root)

@mod.route('/locks', methods=['POST'])
@login_required_api
@api_base
def make_new_lock():
    """
    ロックを獲得する
    """
    if request.json is None or 'target' not in request.json:
        raise Exception('ロック対象データのuuidを指定してください')
    lock_manager = app.config['LOCK_MANAGER'] 
    lock = lock_manager.lock(request.json['target'], creator=g.user)
    return lock.to_json()

@mod.route('/delete-locks', methods=['POST'])
@login_required_api
@api_base
def delete_all_locks():
    """
    指定したuuidのロックを解除する
    全てのロックを解除する
    """
    lock_manager = app.config['LOCK_MANAGER'] 

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
    lock_manager = app.config['LOCK_MANAGER'] 
    return lock_manager.unlock(lock_uuid)

@mod.route('/folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_folder(folder_uuid):
    """
    フォルダを返却する
    """
    folder = g.session.data.find_by_uuid(folder_uuid)
    return _jsonify_folder(folder)

@mod.route('/folders', methods=['POST'])
@login_required_api
@api_base
def make_new_folder():
    """
    フォルダを作成する
    """
    new_folder = g.session.data.create_folder(request.json['parent'],
                                              request.json['label'],
                                              creator=g.user)
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
        modifier = g.user
        folder = g.session.data.find_by_uuid(folder_uuid)
        return folder.update_data(label, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # フォルダを移動する
        new_parent = request.json['parent']
        modifier = g.user
        folder = g.session.data.find_by_uuid(folder_uuid)
        return folder.move(new_parent, modifier)
    else:
        raise Exception('update_folder parameter error!')

@mod.route('/folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_folder(folder_uuid):
    """
    フォルダを削除する
    """
    folder = g.session.data.find_by_uuid(folder_uuid)
    folder.delete()

@mod.route('/awss3s/<awss3_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_awss3_folder(awss3_uuid):
    """
    AWS S3フォルダを返却する
    """
    folder = g.session.data.find_by_uuid(awss3_uuid)
    return _jsonify_folder(folder)

@mod.route('/awss3s', methods=['POST'])
@login_required_api
@api_base
def make_new_awss3_folder():
    """
    AWS S3フォルダを作成する
    """
    parent = g.session.data.find_by_uuid(request.json['parent'])
    new_folder = parent.create_awss3(request.json['label'],
                                     request.json['bucket'],
                                     creator=g.user)
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
    modifier = g.user
    awss3 = g.session.data.find_by_uuid(awss3_uuid)
    return awss3.update_data(label, bucket_name, modifier)


@mod.route('/awss3s/<awss3_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_awss3_folder(awss3_uuid):
    """
    AWS S3フォルダを削除する
    """
    # AWS S3ディレクトリ直下のファイルをDBから登録解除する
    pass
    folder = g.session.data.find_by_uuid(awss3_uuid)
    # AWS S3 folderレコードをDBから削除する
    folder.delete()

@mod.route('/databases/<database_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_database(database_uuid):
    """
    データベースを返却する
    """
    database = g.session.data.find_by_uuid(database_uuid)
    return database

@mod.route('/databases', methods=['POST'])
@login_required_api
@api_base
def make_new_database():
    """
    データベースを作成する
    """
    database_conn = DatabaseConn(
        request.json['dbms'],
        request.json['hostname'],
        request.json['port'],
        request.json['database'],
        request.json['user_id'],
        request.json['password'])

    # 接続情報に漏れがあれば例外を送出する
    database_conn.valid_or_raise()

    parent = g.session.data.find_by_uuid(request.json['parent'])
    new_database= parent.create_database(request.json['label'],
                                         database_conn,
                                         creator=g.user)
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
        database_conn = DatabaseConn(
            request.json['dbms'],
            request.json['hostname'],
            request.json['port'],
            request.json['database'],
            request.json['user_id'],
            request.json['password'])

        # 接続情報に漏れがあれば例外を送出する
        database_conn.valid_or_raise()

        label = request.json['label']
        modifier = g.user
        database = g.session.data.find_by_uuid(database_uuid)
        return database.update_data(label, database_conn, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # データベースを移動する
        new_parent = request.json['parent']
        modifier = g.user
        database = g.session.data.find_by_uuid(database_uuid)
        return database.move(new_parent, modifier)
    else:
        raise Exception('update_database parameter error!')

@mod.route('/databases/<database_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_database(database_uuid):
    """
    データベースを削除する
    """
    database = g.session.data.find_by_uuid(database_uuid)
    # DatabaseレコードをDBから削除する
    database.delete()


@mod.route('/remote-folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_remote_folder(folder_uuid):
    """
    リモートフォルダを返却する
    """
    folder = g.session.data.find_by_uuid(folder_uuid)
    return _jsonify_folder(folder)


@mod.route('/remote-folders', methods=['POST'])
@login_required_api
@api_base
def make_new_remote_folder():
    """
    リモートフォルダを作成する
    """
    remote_folder_conn = RemoteFolderConn(
        request.json['protocol'],
        request.json['hostname'],
        request.json['domain'],
        request.json['directory'],
        request.json['user_id'],
        request.json['password'])

    # 接続情報に漏れがあれば例外を送出する
    remote_folder_conn.valid_or_raise()

    parent = g.session.data.find_by_uuid(request.json['parent'])
    new_folder = parent.create_remote_folder(request.json['label'],
                                             remote_folder_conn,
                                             creator=g.user)
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
        remote_folder_conn = RemoteFolderConn(
            request.json['protocol'],
            request.json['hostname'],
            request.json['domain'],
            request.json['directory'],
            request.json['user_id'],
            request.json['password'])

        # 接続情報に漏れがあれば例外を送出する
        remote_folder_conn.valid_or_raise()

        label = request.json['label']
        modifier = g.user
        folder = g.session.data.find_by_uuid(folder_uuid)
        return folder.update_data(label, remote_folder_conn, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # リモートフォルダを移動する
        new_parent = request.json['parent']
        modifier = g.user
        folder = g.session.data.find_by_uuid(folder_uuid)
        return folder.move(new_parent, modifier)
    else:
        raise Exception('update_remote_folder parameter error!')

@mod.route('/remote-folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_remote_folder(folder_uuid):
    """
    リモートフォルダを削除する
    """
    folder = g.session.data.find_by_uuid(folder_uuid)
    # リモートフォルダレコードをDBから削除する
    folder.delete()


# @mod.route('/documents/<doc_uuid>', methods=['GET'])
# @login_required_api
# def fetch_document(doc_uuid):
#     """
#     ドキュメントを返却する
#     """
#     try:
#         doc = DocumentStore.find_by_uuid(doc_uuid)

#         data = {}
#         data['fileSize'] = doc.get_file_size()
#         data['lastModifiedAt'] = doc.modified_at
#         no_contents = request.args.get('no_contents') is not None
#         if not no_contents:
#             import base64
#             data['contents'] = base64.b64encode(doc.get_file()).decode("utf-8")

#         return jsonify({'success': True, 'data': data})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })

# @mod.route('/documents', methods=['POST'])
# @login_required_api
# def make_new_document():
#     """
#     ドキュメントを作成する
#     """
#     try:
#         # new_doc = Document(str(uuid.uuid4())
#         #                  , request.form.get('parent')
#         #                  , request.form.get('label')
#         #                  , request.files.get('file').stream
#         #                  , creator=g.user)
#         # set_file2(new_doc)
#         # return jsonify({'success': True, 'data': new_doc.to_json()})

#         new_doc = DocumentStore(request.form.get('parent')
#                               , request.form.get('label')
#                               , request.files.get('file').stream
#                               , g.user)
#         # documentレコードをDBに格納する
#         new_doc.save()
#         # ドキュメントに紐付くファイル(path列で指定されるファイル)がなければ作成する
#         new_doc.make_file()
#         return jsonify({'success': True, 'data': new_doc.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code': -1,
#                         'message': str(e)
#                         })

# @mod.route('/documents/<doc_uuid>', methods=['PUT'])
# @login_required_api
# def update_document(doc_uuid):
#     """
#     指定したdocumentのラベル名を変更する
#     """
#     try:
#         # doc = Document(doc_uuid
#         #              , None
#         #              , request.json['label']
#         #              , None
#         #              , g.user)
#         # upd_file2(doc)
#         # return jsonify({'success': True, 'data': doc.to_json()})

#         doc = DocumentStore.find_by_uuid(doc_uuid)
#         if doc is None:
#             raise Exception('no document exists.')
#         doc.data = json.dumps({'label' : request.json['label']})
#         doc.modifier = g.user
#         doc.update_data()
#         return jsonify({'success': True, 'data': doc.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })

# @mod.route('/documents/<doc_uuid>', methods=['DELETE'])
# @login_required_api
# def delete_document(doc_uuid):
#     """
#     指定したdocumentを物理削除する
#     """
#     try:
#         # del_file2(doc_uuid)
#         # return jsonify({'success': True})

#         doc = DocumentStore.find_by_uuid(doc_uuid)
#         if doc is None:
#             raise Exception('no document exists.')
#         doc.delete()
#         doc.remove_file()
#         return jsonify({'success': True})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })
