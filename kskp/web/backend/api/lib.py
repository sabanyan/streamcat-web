from flask import Blueprint, request, session, jsonify
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils.api_base import api_base
from kskp.store import (
    StoreModel as Store,
    Datum as Datum,
    FolderModel as Folder,
    Frame as Frame
)

mod = Blueprint('lib', __name__)

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
    else:
        raise Exception('Undefined type of datum is found!')

def _jsonify_folder(folder):
    """
    NOTE: この関数を呼び出す前にfolderがNoneで無いかチェックすること
    """
    if folder is None:
        raise Exception('The folder argument must not be None.')

    # フォルダ直下のフォルダとデータベースとドキュメントを取得する
    children = Datum.find_by_parent_uuid(folder.uuid)

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
                          creator=user_id,
                          modifier=user_id)
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
                        creator=session['user_id'],
                        modifier=session['user_id'])
    new_folder.save()
    return new_folder

@mod.route('/folders/<folder_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_folder(folder_uuid):
    """
    フォルダを修正する
    """
    label = request.json['label']
    modifier = session['user_id']
    return Folder.update_data(folder_uuid, label, modifier)

@mod.route('/folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def delete_folder(folder_uuid):
    """
    フォルダを削除する
    """
    folder = Folder.find_by_uuid(folder_uuid)
    folder.delete()

# @mod.route('/remote-folders/<folder_uuid>', methods=['GET'])
# @login_required_api
# @update_navigation
# def fetch_remote_folder(folder_uuid):
#     """
#     リモートフォルダを返却する
#     """
#     try:
#         # remote_folder = get_folder2(folder_uuid)
#         # data = _make_fetch_data(remote_folder)
#         # return jsonify({'success': True, 'data': data})

#         folder = RemoteFolderStore.find_by_uuid(folder_uuid)

#         # フォルダ直下のフォルダとデータベースとドキュメントを取得する
#         childrenGetter = FolderChildrenGetter()
#         children = childrenGetter.execute(None, folder)

#         # children属性を作成する
#         data = folder.to_json()
#         for child in children:
#             data['children'].append(child.to_json())

#         # folderPath属性を作成する
#         folder_list = folder.get_folder_path()
#         data['folderPath'] = []
#         for f in folder_list:
#             data['folderPath'].append(f)

#         return jsonify({'success': True, 'data': data})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })

# @mod.route('/remote-folders', methods=['POST'])
# @login_required_api
# def make_new_remote_folder():
#     """
#     リモートフォルダを作成する
#     """
#     try:
#         # new_folder = RemoteFolder(str(uuid.uuid4())
#         #                         , request.json['parent']
#         #                         , request.json['label']
#         #                         , request.json['user']
#         #                         , request.json['password']
#         #                         , request.json['server']
#         #                         , request.json['port']
#         #                         , request.json['domain']
#         #                         , request.json['directory']
#         #                         , creator=session['user_id'])
#         # set_folder2(new_folder)
#         # return jsonify({'success': True, 'data': new_folder.to_json()})

#         new_folder = RemoteFolderStore(request.json['parent']
#                                      , request.json['label']
#                                      , request.json['user']
#                                      , request.json['password']
#                                      , request.json['server']
#                                      , request.json['port']
#                                      , request.json['domain']
#                                      , request.json['directory']
#                                      , creator=session['user_id']
#                                      , modifier=session['user_id'])

#         # フォルダに紐付くディレクトリ(path列で指定されるディレクトリ)がなければ作成する
#         new_folder.make_dir()
#         # ここでリモートディレクトリをマウントする
#         new_folder.mount()
#         # remote-folderレコードをDBに格納する
#         new_folder.save()
#         # リモートディレクトリ直下のファイルをDBに登録する
#         pass

#         return jsonify({'success': True, 'data': new_folder.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                       })

# @mod.route('/remote-folders/<folder_uuid>', methods=['PUT'])
# @login_required_api
# def update_remote_folder(folder_uuid):
#     """
#     リモートフォルダを修正する
#     """
#     try:
#         # new_label = request.json['label']
#         # new_user = request.json['user']
#         # new_password = request.json['password']
#         # new_server = request.json['server']
#         # new_port = request.json['port']
#         # new_domain = request.json['domain']
#         # new_directory = request.json['directory']

#         # folder = RemoteFolder(folder_uuid
#         #                     , None
#         #                     , new_label
#         #                     , new_user
#         #                     , new_password
#         #                     , new_server
#         #                     , new_port
#         #                     , new_domain
#         #                     , new_directory
#         #                     , modifier=session['user_id'])
#         # upd_folder2(folder)
#         # return jsonify({'success': True, 'data': folder.to_json()})

#         folder = RemoteFolderStore(request.json['parent']
#                                  , request.json['label']
#                                  , request.json['user']
#                                  , request.json['password']
#                                  , request.json['server']
#                                  , request.json['port']
#                                  , request.json['domain']
#                                  , request.json['directory']
#                                  , modifier=session['user_id'])
#         folder.update_data()
#         return jsonify({'success': True, 'data': folder.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })

# @mod.route('/remote-folders/<folder_uuid>', methods=['DELETE'])
# @login_required_api
# def delete_remote_folder(folder_uuid):
#     """
#     リモートフォルダを削除する
#     """
#     try:
#         # del_folder2(folder_uuid)
#         # return jsonify({'success': True})

#         # リモートディレクトリ直下のファイルをDBから登録解除する
#         pass
#         folder = RemoteFolderStore.find_by_uuid(folder_uuid)
#         # remote-folderレコードをDBから削除する
#         folder.delete()
#         # ここでリモートディレクトリをマウント解除する
#         folder.umount()
#         # フォルダに紐づくディレクトリを削除する
#         folder.remove_dir()

#         return jsonify({'success': True})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })


# @mod.route('/databases/<database_uuid>', methods=['GET'])
# @login_required_api
# @update_navigation
# def fetch_database(database_uuid):
#     """
#     データベースを返却する
#     """
#     try:
#         # database = get_database(database_uuid)
#         # return jsonify({'success': True, 'data': database})

#         database = DatabaseStore.find_by_uuid(database_uuid)
#         return jsonify({'success': True, 'data': database.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })

# @mod.route('/databases', methods=['POST'])
# @login_required_api
# def make_new_database():
#     """
#     データベースを作成する
#     """
#     try:
#         # new_database= create_database(request.json, 1)
#         # return jsonify({'success': True, 'data': new_database})

#         new_database = DatabaseStore()
#         # ここでDBに接続する
#         new_database.connect()
#         # databaseレコードをDBに格納する
#         new_database.save()

#         return jsonify({'success': True, 'data': new_database.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                       })

# @mod.route('/databases/<database_uuid>', methods=['PUT'])
# @login_required_api
# def update_database(database_uuid):
#     """
#     データベースを修正する
#     """
#     try:
#         # new_label = request.json['label']
#         # database= rename_database_by_id(database_uuid, new_label)
#         # return jsonify({'success': True, 'data': database})

#         database = DatabaseStore()

#         # 接続文字列を変更する場合は、DBに再接続する
#         reconnecting = database.connectionString != request.json['connectionString']

#         if reconnecting:
#             database.disconnect()
#         database.update_data()
#         if reconnecting:
#             database.connect()

#         return jsonify({'success': True, 'data': database.to_json()})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })

# @mod.route('/databases/<database_uuid>', methods=['DELETE'])
# @login_required_api
# def delete_database(database_uuid):
#     """
#     データベースを削除する
#     """
#     try:
#         # delete_database_by_id(database_uuid)
#         # return jsonify({'success': True})

#         database = DatabaseStore.find_by_uuid(database_uuid)
#         database.delete()
#         database.disconnect()

#         return jsonify({'success': True})
#     except Exception as e:
#         return jsonify({
#                         'success': False,
#                         'code'   : -1,
#                         'message': str(e)
#                         })


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
