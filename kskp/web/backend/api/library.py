from flask import (
    Blueprint,
    send_from_directory,
    request,
    g
)
from kskp.core import Datum
from kskp.store import (
    ProjectFolder,
    DatabaseConn,
    RemoteFolderConn
)
from ..views.auth import MY_PROJECT
from .utils import (
    RequestJson,
    api_base,
    login_required_api,
    update_project_info,
    update_projects_info,
    update_projects_info2
)

mod = Blueprint('library', __name__)

def _jsonify_folder(folder, prev_folder_path=False):
    """
    NOTE: この関数を呼び出す前にfolderがNoneで無いかチェックすること
    """
    if folder is None:
        raise Exception('The folder argument must not be None.')

    # フォルダ直下のフォルダとデータベースとドキュメントを取得する
    children = folder.find_children(prev_folder_path=prev_folder_path)

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
    ルートフォルダを取得する
    """
    root = g.factory.data.load_root()
    return _jsonify_folder(root)


@mod.route('/projects')
@login_required_api
@update_projects_info2
@api_base
def get_projects():
    """
    全てのプロジェクトを取得する
    """
    if request.args.get('except_myproject') == 'on':
        except_label = MY_PROJECT
    else:
        except_label = None

    return g.factory.data.find_all(type=Datum.PROJECT_TYPE, except_label=except_label)

@mod.route('/projects/<project_uuid>', methods=['GET'])
@login_required_api
@update_project_info
@api_base
def fetch_project(project_uuid):
    """
    指定したプロジェクトを取得する
    """
    from .library import _jsonify_folder
    project = g.factory.data.find_by_uuid(project_uuid)
    return _jsonify_folder(project)

@mod.route('/projects', methods=['POST'])
@login_required_api
@api_base
def new_project():
    """
    新しいプロジェクトを作成する
    """
    if 'parent' not in request.json:
        raise Exception('parent属性を指定してください')

    parent = g.factory.data.find_by_uuid(request.json['parent'])
    new_project = parent.create_project_folder(request.json['label'])
    new_project.save()
    return new_project

@mod.route('/projects/<project_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_project(project_uuid):
    """
    指定したプロジェクトのラベル名を変更する
    指定したプロジェクトを移動する
    指定したプロジェクトにプロジェクトメンバを設定する
    """
    req = RequestJson(request.json)

    if req.has_no_all('parent', 'label', 'members'):
        raise Exception('label,parentまたはmembers属性を指定してください')
    elif req.has_all('parent', 'label', 'members'):
        raise Exception('label,parentとmembers属性は同時に指定できません')

    project = g.factory.data.find_by_uuid(project_uuid)

    if req.has('label'):
        # プロジェクトのラベルを変更する
        return project.update_label(req['label'])
    elif req.has('parent'):
        # プロジェクトを移動する
        return project.move(req['parent'])

    elif req.has('members'):
        # プロジェクトにユーザを追加・削除する
        if not req.has('lastModifiedAt'):
            raise Exception('lastModifiedAtにプロジェクトの最終更新時刻を指定してください')
        if not isinstance(req['members'], list):
            raise Exception('members属性にはユーザuuidの配列を指定してください')
        # member属性からMembersオブジェクトを作成する
        members = []
        for member_dict in req['members']:
            user = g.factory.user.find_by_uuid(member_dict['uuid'])
            type = member_dict['type']
            members.append(ProjectFolder.Member(user, type))
        # プロジェクト管理者が設定されない場合はエラーとする
        if not project.owner_exists(members):
            raise Exception('プロジェクト管理者が設定されていません')
        # member属性で指定されたユーザを追加する
        from datetime import datetime
        last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
        project.init_members(members, last_modified_at)
        return project
    else:
        raise Exception('誤った引数が指定されました')

@mod.route('/projects/<project_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_project(project_uuid):
    """
    指定したプロジェクトをほかす
    """
    project = g.factory.data.find_by_uuid(project_uuid)
    project.throw_away()


@mod.route('/folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fetch_folder(folder_uuid):
    """
    指定したフォルダを取得する
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    return _jsonify_folder(folder)

@mod.route('/folders', methods=['POST'])
@login_required_api
@api_base
def make_new_folder():
    """
    新しいフォルダを作成する
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
    指定したフォルダのラベルを変更する、またはフォルダを移動する
    """
    req = RequestJson(request.json)

    if req.has_no_all('parent', 'label'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('parent', 'label'):
        raise Exception('labelとparent属性は同時に指定できません')
        
    if req.has('label'):
        # フォルダのラベルを変更する
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.update_label(req['label'])
    elif req.has('parent'):
        # フォルダを移動する
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.move(req['parent'])
    else:
        raise Exception('update_folder parameter error!')

@mod.route('/folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_folder(folder_uuid):
    """
    指定したフォルダをほかす
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    folder.throw_away()


@mod.route('/trashes', methods=['GET'])
@login_required_api
@api_base
def fetch_trashes():
    """
    ゴミ箱を取得する
    """
    trash_folder = g.factory.data.find_trashcan()
    return _jsonify_folder(trash_folder, prev_folder_path=True)

@mod.route('/trashes/<datum_uuid>', methods=['PUT'])
@login_required_api
@api_base
def return_trashes(datum_uuid):
    """
    ゴミを元のフォルダに戻す
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


@mod.route('/remote-folders/<folder_uuid>', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fetch_remote_folder(folder_uuid):
    """
    指定したリモートフォルダを取得する
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    return folder

@mod.route('/remote-folders', methods=['POST'])
@login_required_api
@api_base
def make_new_remote_folder():
    """
    新しいリモートフォルダを作成する
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
    指定したリモートフォルダを変更する、またはリモートフォルダを移動する
    """
    req = RequestJson(request.json)

    if req.has_no_all('label', 'parent'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('label', 'parent'):
        raise Exception('labelとはparent属性は同時に指定できません')

    if req.has('label'):
        label = req['label']
        folder = g.factory.data.find_by_uuid(folder_uuid)
        if len(req) == 1:
            # ラベル名を変更する
            return folder.update_label(label)
        else:
            # リモートフォルダを変更する
            remote_folder_conn = RemoteFolderConn(request.json)
            # 接続情報に漏れがあれば例外を送出する
            remote_folder_conn.valid_or_raise()
            return folder.update_data(label, remote_folder_conn)
    elif req.has('parent'):
        # リモートフォルダを移動する
        new_parent = req['parent']
        folder = g.factory.data.find_by_uuid(folder_uuid)
        return folder.move(new_parent)
    else:
        raise Exception('update_remote_folder parameter error!')

@mod.route('/remote-folders/<folder_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_remote_folder(folder_uuid):
    """
    指定したリモートフォルダをほかす
    """
    folder = g.factory.data.find_by_uuid(folder_uuid)
    # リモートフォルダレコードをDBから削除する
    folder.throw_away()


@mod.route('/databases/<database_uuid>', methods=['GET'])
@login_required_api
@api_base
def fetch_database(database_uuid):
    """
    指定したデータベースを取得する
    """
    database = g.factory.data.find_by_uuid(database_uuid)
    return database

@mod.route('/databases', methods=['POST'])
@login_required_api
@api_base
def make_new_database():
    """
    新しいデータベースを作成する
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
    指定したデータベースを変更する、またはデータベースを移動する
    """
    req = RequestJson(request.json)

    if req.has_no_all('label', 'parent'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('label', 'parent'):
        raise Exception('labelとはparent属性は同時に指定できません')

    if req.has('label'):
        label = req['label']
        database = g.factory.data.find_by_uuid(database_uuid)
        if len(req) == 1:
            # ラベル名を変更する
            return database.update_label(label)
        else:
            # データベースを変更する
            database_conn = DatabaseConn(request.json)
            # 接続情報に漏れがあれば例外を送出する
            database_conn.valid_or_raise()
            return database.update_data(label, database_conn)
    elif req.has('parent'):
        # データベースを移動する
        new_parent = req['parent']
        database = g.factory.data.find_by_uuid(database_uuid)
        return database.move(new_parent)
    else:
        raise Exception('update_database parameter error!')

@mod.route('/databases/<database_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_database(database_uuid):
    """
    指定したデータベースをほかす
    """
    database = g.factory.data.find_by_uuid(database_uuid)
    # DatabaseレコードをDBから削除する
    database.throw_away()


@mod.route('/frames', methods=['POST'])
@login_required_api
@api_base
def create_frame():
    """
    新しいフレームを作成する
    """
    if request.files.get('file') is None:
        raise Exception('No frame file found.')
    if 'parent' not in request.form:
        raise Exception('No parent is designated.')
    if 'label' not in request.form:
        raise Exception('No label is designated.')

    parent = g.factory.data.find_by_uuid(request.form.get('parent'))
    new_frame = parent.create_frame(request.form.get('label'),
                                    request.files.get('file').stream)
    # FrameをDBに格納する
    new_frame.save()
    return new_frame

@mod.route('/frames/<frame_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_frame(frame_uuid):
    """
    指定したフレームのラベルを変更する、またはフレームを移動する
    """
    req = RequestJson(request.json)

    if req.has_no_all('parent', 'label', 'encoding', 'newline'):
        raise Exception('label,encoding,newlineまたはparent属性を指定してください')
    elif req.has('parent') and req.has_at_least('label', 'encoding', 'newline'):
        raise Exception('label,encoding,newlineとはparent属性は同時に指定できません')

    frame = g.factory.data.find_by_uuid(frame_uuid)

    if req.has('parent'):
        # frameを移動する
        new_parent = req['parent']
        return frame.move(new_parent)

    else:
        if req.has('label'):
            # frameのラベルを変更する
            label = req['label']
            # ret = Frame.update_label(frame_uuid, label, modifier)
            ret = frame.update_label(label)

        if req.has_all('encoding', 'newline'):
            encoding_str = req['encoding']
            newline_str = req['newline']
            ret = frame.update_encoding_newline(encoding_str, newline_str)

        if ret is None:
            raise Exception('update_frame parameter error!')

        return ret

@mod.route('/frames/<frame_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_frame(frame_uuid):
    """
    指定したフレームをほかす
    """
    frame = g.factory.data.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')
    frame.throw_away()


@mod.route('/documents/<document_uuid>', methods=['GET'])
@login_required_api
def fetch_document(document_uuid):
    """
    指定したドキュメントを取得する
    """
    document = g.factory.data.find_by_uuid(document_uuid)
    return send_from_directory(document.path.parent,
                               document.path.name,
                               download_name=document.label,
                               mimetype=document.content_type)

@mod.route('/documents', methods=['POST'])
@login_required_api
@api_base
def make_new_document():
    """
    ファイルストリームからファイルタイプを判定して
    新しいフレームまたはドキュメントを作成する
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
    return new_file

@mod.route('/documents/<document_uuid>', methods=['PUT'])
@login_required_api
@api_base
def update_document(document_uuid):
    """
    指定したドキュメントのラベル名を変更する、または移動する
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
        # ドキュメントのラベルを変更する
        label = req['label']
        return document.update_label(label)
    else:
        raise Exception('update_document parameter error!')

@mod.route('/documents/<document_uuid>', methods=['DELETE'])
@login_required_api
@api_base
def throw_away_document(document_uuid):
    """
    指定したドキュメントをほかす
    """
    document = g.factory.data.find_by_uuid(document_uuid)
    document.throw_away()


@mod.route('/awss3s/<awss3_uuid>', methods=['GET'])
@login_required_api
@update_projects_info
@api_base
def fetch_awss3_folder(awss3_uuid):
    """
    指定したAWS S3フォルダを取得する
    """
    folder = g.factory.data.find_by_uuid(awss3_uuid)
    return _jsonify_folder(folder)

@mod.route('/awss3s', methods=['POST'])
@login_required_api
@api_base
def make_new_awss3_folder():
    """
    新しいAWS S3フォルダを作成する
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
    指定したAWS S3フォルダを変更する
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
    指定したAWS S3フォルダをほかす
    """
    # AWS S3ディレクトリ直下のファイルをDBから登録解除する
    pass

    folder = g.factory.data.find_by_uuid(awss3_uuid)
    # AWS S3 folderレコードをDBから削除する
    folder.throw_away()
