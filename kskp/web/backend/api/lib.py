from flask import Blueprint, request, session, jsonify, send_from_directory
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils.api_base import api_base
from pathlib import Path
from kskp.web.backend import app
from kskp.store import (
    StoreModel as Store,
    Datum,
    Folder,
    Frame,
    Flow,
    AwsS3,
    Database,
    DatabaseConn,
    RemoteFolder,
    RemoteFolderConn,
    TrashCan,
    ChildrenGetter
)

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

    creator = session['user_id']
    root = get_library(creator)
    stream = request.files.get('file').stream
    
    from kskp.store import FlowDumper
    flow_dumper = FlowDumper()
    flow_dumper.restore_archive(root.uuid, stream, creator)

@mod.route('/stores', methods=['GET'])
@api_base
def fecth_stores():
    """
    データストアの定義(雛形)の一覧を返却する
    """
    return Store.find_all()

@mod.route('/stores/<store_id>', methods=['GET'])
@api_base
def fecth_store(store_id):
    """
    データストアの定義(雛形)を返却する
    """
    return Store.find_by_id(store_id)

@mod.route('/stores', methods=['POST'])
@login_required_api
@api_base
def make_new_store():
    """
    データストアの定義(雛形)を作成する
    """
    new_store = Store.create(request.json['id'],
                             request.json['version'],
                             request.json['label'],
                             request.json['description'],
                             request.json['url'],
                             request.json['params'],
                             session['user_id'])
    new_store.save()
    return new_store

@mod.route('/stores/<store_id>', methods=['DELETE'])
@login_required_api
@api_base
def delete_store(store_id):
    """
    データストアの定義(雛形)を削除する
    """
    store = Store(store_id)
    store.delete()

def _convert_type(datum):
    if datum is None:
        return None
    elif datum.type == Datum.FOLDER_TYPE:
        return Folder.convert_to_folder(datum)
    elif datum.type == Datum.FRAME_TYPE:
        return Frame.convert_to_frame(datum)
    elif datum.type == Datum.FLOW_TYPE:
        return Flow.convert_to_flow(datum)
    elif datum.type == Datum.AWSS3_TYPE:
        return AwsS3.convert_to_awss3(datum)
    elif datum.type == Datum.DATABASE_TYPE:
        return Database.convert_to_database(datum)
    elif datum.type == Datum.RFOLDER_TYPE:
        return RemoteFolder.convert_to_remote_folder(datum)
    elif datum.type == Datum.TRASH_TYPE:
        return TrashCan.convert_to_trash_can(datum)
    else:
        raise Exception('Undefined type of datum(%s) is found!' % datum.type)

def _jsonify_folder(folder):
    """
    NOTE: この関数を呼び出す前にfolderがNoneで無いかチェックすること
    """
    if folder is None:
        raise Exception('The folder argument must not be None.')

    # フォルダ直下のフォルダとデータベースとドキュメントを取得する
    # children = Datum.find_by_parent_uuid(folder.uuid)
    childrenGetter = ChildrenGetter()
    children = childrenGetter.execute(session['user_id'], folder)

    # children属性を作成する
    data = folder.to_json()
    data['children'] = [_convert_type(child) for child in children]
    
    # folderPath属性を作成する
    folder_list = folder.get_folder_path()
    data['folderPath'] = [folder for folder in folder_list]
    return data

def get_library(user_id):
    """
    ルートデータストアを取得する、存在しない場合は作成する
    """
    root = _convert_type(Datum.find_root())
    # ルートフォルダが存在しない場合はルートフォルダを作成する
    # (最初にライブラリ画面にアクセスする時はルートフォルダ自身も存在しません)
    if root is None:
        new_root = Folder(parent_uuid=None,
                          label='ROOT_FOLDER',
                          creator=user_id)
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
    root = get_library(session['user_id'])
    return _jsonify_folder(root)

@mod.route('/trashes', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_trashes():
    """
    ゴミ箱を返却する
    """
    from kskp.store import Library
    trash_folder = Library.load_trash_folder(session['user_id'])
    return _jsonify_folder(trash_folder)

@mod.route('/trashes/<datum_uuid>', methods=['PUT'])
@login_required_api
@api_base
def return_trashes(datum_uuid):
    """
    ゴミを捨てる前の場所に戻す
    """
    datum = Datum.find_by_uuid(datum_uuid)
    return _put_back(_convert_type(datum), session['user_id'])

def _put_back(datum, modifier):
    # フォルダを元の位置に戻す
    moved_data, exps = _put_back_inner(datum, modifier)
    if len(moved_data) == 0:
        if len(exps) == 0:
            raise Exception('元に戻すファイルがありませんでした')
        elif len(exps) == 1:
            raise exps[0]
        else:
            raise Exception('全てのファイルを戻せませんでした')
    else:
        if len(exps) > 0:
            raise Exception('一部のファイルを戻せませんでした')
    return moved_data

def _put_back_inner(datum, modifier):
    if datum.type == Datum.FOLDER_TYPE and datum.prev_parent_id is None:
        # 移動対象がprev_parent_idを持たないフォルダの場合
        # その下のファイルを個別に移動する
        childrenGetter = ChildrenGetter()
        children = childrenGetter.execute(modifier, datum)
        moved_data = []
        exps = []
        for child in children:
            moved_datum, exp = _put_back_inner(child, modifier)
            moved_data.extend(moved_datum)
            exps.extend(exp)
        return moved_data, exps
    else:
        try:
            return [datum.put_back(modifier)], []
        except Exception as e:
            return [], [e]

@mod.route('/trashes', methods=['DELETE'])
@login_required_api
@api_base
def empty_all():
    """
    ゴミ箱を空にする
    """
    from kskp.store import Library
    trash_folder = Library.load_trash_folder(session['user_id'])

    # ゴミ箱直下のフォルダとファイルを取得する
    childrenGetter = ChildrenGetter()
    children = childrenGetter.execute(session['user_id'], trash_folder)

    # ゴミ箱直下のフォルダとファイルを削除する
    for child in children:
        _empty_all_inner(child)

def _empty_all_inner(datum):
    if datum.type == Datum.FOLDER_TYPE:
        # フォルダ直下のフォルダとデータベースとドキュメントを取得する
        childrenGetter = ChildrenGetter()
        children = childrenGetter.execute(session['user_id'], datum)
        
        # フォルダ直下のフォルダとファイルを削除する
        for child in children:
            _empty_all_inner(child)

        # フォルダを削除する
        datum.delete()
    
    else:
        # ファイルを削除する
        datum.delete()

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
    lock = lock_manager.lock(request.json['target'], creator=session['user_id'])
    return lock.to_json()

@mod.route('/delete-locks', methods=['POST'])
@login_required_api
@api_base
def delete_all_locks():
    """
    全てのロックを解除する
    """
    lock_manager = app.config['LOCK_MANAGER'] 
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
    folder = Folder.find_by_uuid(folder_uuid)
    return _jsonify_folder(folder)

@mod.route('/folders', methods=['POST'])
@login_required_api
@api_base
def make_new_folder():
    """
    フォルダを作成する
    """
    new_folder = Folder(request.json['parent'],
                        request.json['label'],
                        creator=session['user_id'])
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
        modifier = session['user_id']
        return Folder.update_data(folder_uuid, label, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # フォルダを移動する
        new_parent = request.json['parent']
        modifier = session['user_id']
        folder = Folder.find_by_uuid(folder_uuid)
        return folder.move(new_parent, modifier)
    else:
        raise Exception('update_folder parameter error!')

@mod.route('/folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away(folder_uuid):
    throw_away_folder(folder_uuid)

def throw_away_folder(folder_uuid):
    from kskp.store import Library
    trash_folder = Library.load_trash_folder(session['user_id'])

    folder = Folder.find_by_uuid(folder_uuid)

    if folder.parent_uuid is None:
        raise Exception('ルートフォルダは削除できません')

    thrown_count, obstacle_count = _throw_away_inner(trash_folder.uuid, folder, session['user_id'])

    if obstacle_count == 0 and not _is_system_folder(folder_uuid):
        # 中のファイル全て削除可能であればフォルダ(ファイル)ごとゴミ箱へ移動する
        folder.move(trash_folder.uuid, session['user_id'])
        thrown_count += 1

    if thrown_count == 0:
        raise Exception('削除できませんでした')

def _throw_away_inner(parent_uuid, datum, modifier):
    if datum.type == Datum.FOLDER_TYPE:
        # フォルダ直下のフォルダとデータベースとドキュメントを取得する
        childrenGetter = ChildrenGetter()
        children = childrenGetter.execute(modifier, datum)

        # ゴミ箱に捨てても削除前の階層構造を維持するため、削除対象フォルダの形代をゴミ箱に作成する
        trashed_folder = Folder(parent_uuid, datum.label, modifier)
        trashed_folder.save()

        throwables = []
        thrown_count = 0
        obstacle_count = 0

        for child in children:
            child_thrown_count, child_obstacle_count = _throw_away_inner(trashed_folder.uuid, child, modifier)
            # 削除可能リストの作成
            if child_obstacle_count == 0:
                throwables.append(child)
            # 削除ファイルと削除不可ファイルを集計する
            thrown_count += child_thrown_count
            obstacle_count += child_obstacle_count
        if obstacle_count == 0 and not _is_system_folder(datum.uuid):
            # 全部捨る場合はフォルダごとゴミ箱へ移動する
            trashed_folder.delete()
        else:
            # 一部捨てる場合はそれらを形代フォルダへ移動する
            for throwable in throwables:
                throwable.move(trashed_folder.uuid, modifier)
                thrown_count += 1

        # 捨るものがなかった場合は形代フォルダを作らない
        if thrown_count == 0:
            trashed_folder.delete()

        return thrown_count, obstacle_count

    elif datum.type == Datum.FRAME_TYPE or datum.type == Datum.FLOW_TYPE:
        # 削除しようとするフレーム/サブフローが、フローで使用されていない場合に削除する
        using_flow_uuids = Flow.get_flow_uuids_using_other_datum(datum.uuid)
        if len(using_flow_uuids) == 0:
            return 0, 0
        else:
            return 0, 1

    else:
        # データベース接続、リモートフォルダ接続
        return 0, 0

def _is_system_folder(datum_uuid):
    from kskp.store import FLOW_FOLDER_UUID, RESULT_FOLDER_UUID, CACHE_FOLDER_UUID
    return datum_uuid in (FLOW_FOLDER_UUID, RESULT_FOLDER_UUID, CACHE_FOLDER_UUID)

@mod.route('/awss3s/<awss3_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_awss3_folder(awss3_uuid):
    """
    AWS S3フォルダを返却する
    """
    folder = AwsS3.find_by_uuid(awss3_uuid)
    return _jsonify_folder(folder)

@mod.route('/awss3s', methods=['POST'])
@login_required_api
@api_base
def make_new_awss3_folder():
    """
    AWS S3フォルダを作成する
    """
    new_folder = AwsS3(request.json['parent'],
                       request.json['label'],
                       request.json['bucket'],
                       creator=session['user_id'])
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
    modifier = session['user_id']
    return AwsS3.update_data(awss3_uuid, label, bucket_name, modifier)

@mod.route('/awss3s/<awss3_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_awss3(awss3_uuid):
    from kskp.store import Library
    trash_folder = Library.load_trash_folder(session['user_id'])

    folder = AwsS3.find_by_uuid(awss3_uuid)
    thrown_away_count = _throw_away_inner(trash_folder.uuid, folder, session['user_id'])

    if thrown_away_count == 0:
        raise Exception('削除できませんでした')

@mod.route('/databases/<database_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_database(database_uuid):
    """
    データベースを返却する
    """
    database = Database.find_by_uuid(database_uuid)
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

    new_database = Database(request.json['parent'],
                            request.json['label'],
                            database_conn,
                            creator=session['user_id'])
    new_database.save()
    return new_database.to_json()

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
        modifier = session['user_id']
        return Database.update_data(database_uuid, label, database_conn, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # データベースを移動する
        new_parent = request.json['parent']
        modifier = session['user_id']
        database = Database.find_by_uuid(database_uuid)
        return database.move(new_parent, modifier)
    else:
        raise Exception('update_database parameter error!')

@mod.route('/databases/<database_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_database(database_uuid):
    from kskp.store import Library
    trash_folder = Library.load_trash_folder(session['user_id'])

    database = Database.find_by_uuid(database_uuid)
    database.move(trash_folder.uuid, session['user_id'])

@mod.route('/remote-folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_navigation
@api_base
def fetch_remote_folder(folder_uuid):
    """
    リモートフォルダを返却する
    """
    folder = RemoteFolder.find_by_uuid(folder_uuid)
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

    new_folder = RemoteFolder(request.json['parent'],
                              request.json['label'],
                              remote_folder_conn,
                              creator=session['user_id'])
    new_folder.save()
    return new_folder

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
        modifier = session['user_id']
        return RemoteFolder.update_data(folder_uuid, label, remote_folder_conn, modifier)
    elif 'parent' in request.json and request.json['parent'] != '':
        # リモートフォルダを移動する
        new_parent = request.json['parent']
        modifier = session['user_id']
        folder = RemoteFolder.find_by_uuid(folder_uuid)
        return folder.move(new_parent, modifier)
    else:
        raise Exception('update_remote_folder parameter error!')

@mod.route('/remote-folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_remote_folder(folder_uuid):
    """
    リモートフォルダを削除する
    """
    from kskp.store import Library
    trash_folder = Library.load_trash_folder(session['user_id'])

    folder = RemoteFolder.find_by_uuid(folder_uuid)
    folder.move(trash_folder.uuid, session['user_id'])

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
#         #                  , creator=session['user_id'])
#         # set_file2(new_doc)
#         # return jsonify({'success': True, 'data': new_doc.to_json()})

#         new_doc = DocumentStore(request.form.get('parent')
#                               , request.form.get('label')
#                               , request.files.get('file').stream
#                               , session['user_id'])
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
#         #              , session['user_id'])
#         # upd_file2(doc)
#         # return jsonify({'success': True, 'data': doc.to_json()})

#         doc = DocumentStore.find_by_uuid(doc_uuid)
#         if doc is None:
#             raise Exception('no document exists.')
#         doc.data = json.dumps({'label' : request.json['label']})
#         doc.modifier = session['user_id']
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
