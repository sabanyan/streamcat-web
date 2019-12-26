from flask import Blueprint, request, session, jsonify, send_from_directory
from .auth import login_required_api
from .utils.navigation import update_navigation
from .utils.api_base import api_base
from pathlib import Path
from kskp.store import (
    StoreModel as Store,
    Datum,
    Folder,
    Frame,
    Flow,
    AwsS3,
    ChildrenGetter
)


mod = Blueprint('lib', __name__)

@mod.route('/flow_files/<flow_uuid>', methods=['GET'])
@login_required_api
def download_flow(flow_uuid):
    """
    フローとフローに紐づくサブフローとフレームを取得する
    """
    import os
    import json

    (frame_uuids, flow_uuids) = _get_flow(flow_uuid)

    tmp_dir = Path('/tmp')
    archive_name = Flow.find_by_uuid(flow_uuid).label + '.tgz'
    uuid_label_pairs = {}
    frame_paths = []
    flow_paths  = []

    from kskp.store import STORE_DIR
    for frame_uuid in frame_uuids:
        frame = Frame.find_by_uuid(frame_uuid)
        tmp_frame_link = tmp_dir / (frame.uuid + '.csv')
        if not tmp_frame_link.exists():
            os.symlink(STORE_DIR.parent / frame.path, tmp_frame_link)
        frame_paths.append(tmp_frame_link)
        uuid_label_pairs[frame.uuid] = frame.label

    for flow_uuid in flow_uuids:
        flow = Flow.find_by_uuid(flow_uuid)
        flow_path = tmp_dir / (flow.uuid + '.json')
        with flow_path.open('w') as f:
            f.write(json.dumps(flow.flow_data, indent=2, ensure_ascii=False))
        flow_paths.append(flow_path)
        uuid_label_pairs[flow.uuid] = flow.label

    # uuidとlabelの対応表をファイルに出力する
    labels_path = tmp_dir / 'labels.txt'
    with labels_path.open('w') as f:
        for uuid, label in uuid_label_pairs.items():
            f.write(uuid)
            f.write(',')
            f.write(label)
            f.write('\n')

    # アーカイブファイルを作成する
    frame_paths.extend(flow_paths)
    frame_paths.append(labels_path)
    archive_path = _make_archive(frame_paths)

    # アーカイブしたファイルを削除する
    for frame_path in frame_paths:
        if frame_path.exists():
            frame_path.unlink()

    # アーカイブファイルを返す
    ret = send_from_directory(archive_path.parent, archive_path.name, as_attachment = True,
                              attachment_filename = archive_name, mimetype = 'application/x-tar')
    archive_path.unlink()
    return ret

def _get_flow(flow_uuid, frames=[], flows=[]):
    flow = Flow.find_by_uuid(flow_uuid)
    flows.append(flow_uuid)

    src_frame_uuids = flow.get_src_frame_uuids()
    cache_frame_uuids = flow.get_cache_frame_uuids()
    sub_flow_uuids = flow.get_sub_flow_uuids()

    for src_frame_uuid in src_frame_uuids:
        if src_frame_uuid not in frames:
            frames.append(src_frame_uuid)

    for cache_frame_uuid in cache_frame_uuids:
        if cache_frame_uuid not in frames:
            frames.append(cache_frame_uuid)

    for sub_flow_uuid in sub_flow_uuids:
        if sub_flow_uuid not in flows:
            _get_flow(sub_flow_uuid, frames, flows)

    return (frames, flows)

def _make_archive(file_paths):
    # 圧縮ファイル名
    import uuid
    tar_file_path = Path('/tmp') / (str(uuid.uuid4()) + '.tgz')

    # 圧縮処理
    import tarfile
    # シンボリックリンクはリンク先ファイルを圧縮する
    archive = tarfile.open(tar_file_path, mode='w:gz', dereference=True)
    for file_path in file_paths:
        archive.add(file_path, arcname=file_path.name, recursive=False)
    archive.close()

    return tar_file_path


@mod.route('/flow_files', methods=['POST'])
@login_required_api
@api_base
def upload_flow():
    import json

    if 'file' not in request.files or request.files.get('file') is None:
        raise Exception('No archive file found.')

    creator = session['user_id']

    extracted_files = _extract_archive(request.files.get('file').stream)

    # フレームの移行先フォルダを作成する
    root = get_library(creator)
    frame_folder = Folder(root.uuid, 'FromOtherServer', creator)
    frame_folder_uuid = frame_folder.uuid
    frame_folder.save()

    # フローの移行先フォルダを作成する
    from kskp.store import Library
    folder = Library.load_flow_folder(creator)
    flow_folder = Folder(folder.uuid, 'FromOtherServer', creator)
    flow_folder_uuid = flow_folder.uuid
    flow_folder.save()

    flow_uuids  = {}
    uuids = {}
    labels = {}

    # label.txtからuuidとlabelの対応を取得する
    for file in extracted_files:
        if file.name == 'labels.txt':
            with file.open('r') as f:
                while True:
                    # uuidを読み込む
                    uuid = f.read(36).rstrip('\n')
                    if not uuid:
                        break
                    # カンマを読み込む
                    f.read(1)
                    # ラベル名を読み込む
                    label = f.readline().rstrip('\n')
                    labels[uuid] = label
            break

    # ライブラリに登録する
    for file in extracted_files:
        if file.suffix == '.csv':
            with file.open('rb') as f:
                frame = Frame(frame_folder_uuid, labels[file.stem], f, creator)
                uuids[file.stem] = frame.uuid
                frame.save()
        elif file.suffix == '.json':
            with file.open('r') as f:
                d = f.read()
                flow_data = json.loads(d)
            flow = Flow(flow_folder_uuid, labels[file.stem], flow_data, creator)
            flow_uuids[file.stem] = flow.uuid
            uuids[file.stem] = flow.uuid
            flow.save()

    # Flowの参照uuidを変更する
    for new_flow_uuid in flow_uuids.values():
        flow = Flow.find_by_uuid(new_flow_uuid)
        for old_uuid, new_uuid in uuids.items():
            flow.replace_uuid(old_uuid, new_uuid, creator)

def _extract_archive(stream):
    import tarfile

    # 展開処理
    import uuid
    tar_dir_path = Path('/tmp') / str(uuid.uuid4())

    with tarfile.open(fileobj=stream, mode='r|gz') as tar:
        tar.extractall(tar_dir_path)
        return [tar_dir_path / member.name for member in tar.getmembers()]

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
def delete_folder(folder_uuid):
    """
    フォルダを削除する
    """
    folder = Folder.find_by_uuid(folder_uuid)
    folder.delete()

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
def delete_awss3_folder(awss3_uuid):
    """
    AWS S3フォルダを削除する
    """
    # AWS S3ディレクトリ直下のファイルをDBから登録解除する
    pass
    folder = AwsS3.find_by_uuid(awss3_uuid)
    # AWS S3 folderレコードをDBから削除する
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

