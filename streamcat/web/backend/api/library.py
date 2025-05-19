from fastapi import APIRouter, Request, Depends
from fastapi.responses import FileResponse
from streamcat.store import (
    ProjectFolder,
    DatabaseConn,
    RemoteFolderConn
)
from streamcat.store.finder import Finder
from ..views.auth import MY_PROJECT
from .utils import (
    RequestJson,
    login_required_api,
    get_factory,
    jsonify,
    update_project_info,
    update_projects_info,
    update_projects_info2,
    duplicate_datum
)

router = APIRouter()

def _add_children_info(folder, offset=None, limit=None, prev_folder_path=False):
    # フォルダ直下のフォルダとデータベースとドキュメントを取得する
    children = folder.find_children(offset=offset,
                                    limit=limit,
                                    prev_folder_path=prev_folder_path)

    # folderPath属性を作成する
    folder_list = folder.get_folder_path()

    # Folderのto_json()を退避する
    folder_to_json = folder.to_json

    # Folderのto_json()が'children'と'folderPath'も返すように変更する
    def to_json():
        folder_json = folder_to_json()
        folder_json['children'] = children
        folder_json['folderPath'] = folder_list
        return folder_json

    # Folderのto_json()を変更後のto_json()に置き換える
    folder.to_json = to_json

    return folder

@router.get('/library')
@login_required_api
@jsonify
@update_projects_info
async def fecth_library(members:bool=False, offset:int=None, limit:int=None, factory:Finder=Depends(get_factory)):
    """
    ルートフォルダを取得する
    """
    root = factory.data.load_root()
    return _add_children_info(root, offset=offset, limit=limit)

@router.get('/data')
@login_required_api
@jsonify
@update_projects_info2
def fecth_data(q:str=None, type:str=None, members:bool=False, offset:int=None, limit:int=None, factory:Finder=Depends(get_factory)):
    """
    全てのDatum、または指定したキーワードを含むDatumを取得する
    """
    search_keyword = q
    return factory.data.find_by_keyword(search_keyword,
                                        type=type,
                                        except_trash=True,
                                        offset=offset,
                                        limit=limit)

@router.get('/projects')
@login_required_api
@jsonify
@update_projects_info2
async def get_projects(members:bool=False, on_root:bool=False, except_myproject:bool=False, factory:Finder=Depends(get_factory)):
    """
    全てのプロジェクトを取得する
    """
    if except_myproject:
        except_label = MY_PROJECT
    else:
        except_label = None
    return factory.data.find_all_projects(on_root=on_root, except_label=except_label)

@router.get('/projects/{project_uuid}')
@login_required_api
@jsonify
@update_project_info
async def fetch_project(project_uuid, members=False, offset:int=None, limit:int=None, factory:Finder=Depends(get_factory)):
    """
    指定したプロジェクトを取得する
    """
    project = factory.data.find_by_uuid(project_uuid)
    return _add_children_info(project, offset=offset, limit=limit)

@router.post('/projects')
@login_required_api
@jsonify
async def new_project(request:Request, factory:Finder=Depends(get_factory)):
    """
    新しいプロジェクトを作成する
    """
    req = RequestJson(await request.json())

    if req.has('source'):
        # プロジェクトを複製する
        return duplicate_datum(factory, req['source'])
    elif req.has('parent'):
        parent = factory.data.find_by_uuid(req['parent'])
        new_project = parent.create_project_folder(req['label'])
        new_project.save()
        return new_project
    else:
        raise Exception('parent属性を指定してください')

@router.put('/projects/{project_uuid}')
@login_required_api
@jsonify
async def update_project(request:Request, project_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したプロジェクトのラベル名を変更する
    指定したプロジェクトを移動する
    指定したプロジェクトにプロジェクトメンバを設定する
    """
    req = RequestJson(await request.json())

    if req.has_no_all('parent', 'label', 'members'):
        raise Exception('label,parentまたはmembers属性を指定してください')
    elif req.has('parent') and req.has_at_least('label', 'members'):
        raise Exception('label,membersとはparent属性は同時に指定できません')

    project = factory.data.find_by_uuid(project_uuid, for_update=True)

    if req.has('parent'):
        # プロジェクトを移動する
        return project.move(req['parent'])

    else:
        if req.has('members'):
            # プロジェクトにユーザを追加・削除する
            if not req.has('lastModifiedAt'):
                raise Exception('lastModifiedAtにプロジェクトの最終更新時刻を指定してください')
            if not isinstance(req['members'], list):
                raise Exception('members属性にはユーザuuidの配列を指定してください')
            # member属性からMembersオブジェクトを作成する
            members = []
            for member_dict in req['members']:
                user = factory.user.find_by_uuid(member_dict['uuid'])
                type = member_dict['type']
                members.append(ProjectFolder.Member(user, type))
            # プロジェクト管理者が設定されない場合はエラーとする
            if not project.owner_exists(members):
                raise Exception('プロジェクト管理者が設定されていません')
            # member属性で指定されたユーザを追加する
            from datetime import datetime
            last_modified_at = datetime.strptime(req['lastModifiedAt'], '%Y-%m-%d %H:%M:%S.%f')
            project.init_members(members, last_modified_at)
            ret = project

        # ラベルの変更で最終更新時刻が更新されると、members属性の更新ができない
        if req.has('label'):
            # プロジェクトのラベルを変更する
            ret = project.update_label(req['label'])

        if ret is None:
            raise Exception('誤った引数が指定されました')

        return ret

@router.delete('/projects/{project_uuid}')
@login_required_api
@jsonify
async def throw_away_project(project_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したプロジェクトをほかす
    """
    project = factory.data.find_by_uuid(project_uuid)
    return project.throw_away()


@router.get('/folders/{folder_uuid}')
@login_required_api
@jsonify
@update_projects_info
async def fetch_folder(folder_uuid, members:bool=False, offset:int=None, limit:int=None, factory:Finder=Depends(get_factory)):
    """
    指定したフォルダを取得する
    """
    folder = factory.data.find_by_uuid(folder_uuid)
    return _add_children_info(folder, offset=offset, limit=limit)

@router.post('/folders')
@login_required_api
@jsonify
async def make_new_folder(request:Request, factory:Finder=Depends(get_factory)):
    """
    新しいフォルダを作成する
    """
    req = RequestJson(await request.json())

    if req.has('source'):
        # フォルダを複製する
        return duplicate_datum(factory, req['source'])
    else:
        parent = factory.data.find_by_uuid(req['parent'])
        new_folder = parent.create_folder(req['label'])
        new_folder.save()
        return new_folder

@router.put('/folders/{folder_uuid}')
@login_required_api
@jsonify
async def update_folder(request:Request, folder_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したフォルダのラベルを変更する、またはフォルダを移動する
    """
    req = RequestJson(await request.json())

    if req.has_no_all('parent', 'label'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('parent', 'label'):
        raise Exception('labelとparent属性は同時に指定できません')

    if req.has('label'):
        # フォルダのラベルを変更する
        folder = factory.data.find_by_uuid(folder_uuid, for_update=True)
        return folder.update_label(req['label'])
    elif req.has('parent'):
        # フォルダを移動する
        folder = factory.data.find_by_uuid(folder_uuid, for_update=True)
        return folder.move(req['parent'])
    else:
        raise Exception('update_folder parameter error!')

@router.delete('/folders/{folder_uuid}')
@login_required_api
@jsonify
async def throw_away_folder(folder_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したフォルダをほかす
    """
    folder = factory.data.find_by_uuid(folder_uuid)
    return folder.throw_away()


@router.get('/trashes')
@login_required_api
@jsonify
async def fetch_trashes(offset:int=None, limit:int=None, factory:Finder=Depends(get_factory)):
    """
    ゴミ箱を取得する
    """
    trash_folder = factory.data.find_trashcan()
    return _add_children_info(trash_folder,
                              offset=offset,
                              limit=limit,
                              prev_folder_path=True)

@router.put('/trashes/{datum_uuid}')
@login_required_api
@jsonify
async def return_trashes(datum_uuid, factory:Finder=Depends(get_factory)):
    """
    ゴミを元のフォルダに戻す
    """
    datum = factory.data.find_by_uuid(datum_uuid)
    return datum.put_back()

@router.delete('/trashes')
@login_required_api
@jsonify
async def empty_all(factory:Finder=Depends(get_factory)):
    """
    ゴミ箱を空にする
    """
    trash_folder = factory.data.find_trashcan()
    trash_folder.trash_all()


@router.get('/remote-folders/{folder_uuid}')
@login_required_api
@jsonify
@update_projects_info
async def fetch_remote_folder(folder_uuid, members:bool=False, factory:Finder=Depends(get_factory)):
    """
    指定したリモートフォルダを取得する
    """
    folder = factory.data.find_by_uuid(folder_uuid)
    return folder

@router.post('/remote-folders')
@login_required_api
@jsonify
async def make_new_remote_folder(request:Request, factory:Finder=Depends(get_factory)):
    """
    新しいリモートフォルダを作成する
    """
    req = RequestJson(await request.json())

    if req.has('source'):
        # リモートフォルダを複製する
        return duplicate_datum(factory, req['source'])
    else:
        remote_folder_conn = RemoteFolderConn(req.json)
        # 接続情報に漏れがあれば例外を送出する
        remote_folder_conn.valid_or_raise()

        parent = factory.data.find_by_uuid(req['parent'])
        new_folder = parent.create_remote_folder(req['label'],
                                                remote_folder_conn)
        ret = new_folder.to_json()
        new_folder.save()
        return ret

@router.put('/remote-folders/{folder_uuid}')
@login_required_api
@jsonify
async def update_remote_folder(request:Request, folder_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したリモートフォルダを変更する、またはリモートフォルダを移動する
    """
    req = RequestJson(await request.json())

    if req.has_no_all('label', 'parent'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('label', 'parent'):
        raise Exception('labelとはparent属性は同時に指定できません')

    if req.has('label'):
        label = req['label']
        folder = factory.data.find_by_uuid(folder_uuid)
        if len(req) == 1:
            # ラベル名を変更する
            return folder.update_label(label)
        else:
            # リモートフォルダを変更する
            remote_folder_conn = RemoteFolderConn(req.json)
            # 接続情報に漏れがあれば例外を送出する
            remote_folder_conn.valid_or_raise()
            return folder.update_data(label, remote_folder_conn)
    elif req.has('parent'):
        # リモートフォルダを移動する
        new_parent = req['parent']
        folder = factory.data.find_by_uuid(folder_uuid)
        return folder.move(new_parent)
    else:
        raise Exception('update_remote_folder parameter error!')

@router.delete('/remote-folders/{folder_uuid}')
@login_required_api
@jsonify
async def throw_away_remote_folder(folder_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したリモートフォルダをほかす
    """
    folder = factory.data.find_by_uuid(folder_uuid)
    # リモートフォルダレコードをDBから削除する
    return folder.throw_away()


@router.get('/databases/{database_uuid}')
@login_required_api
@jsonify
async def fetch_database(database_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したデータベースを取得する
    """
    database = factory.data.find_by_uuid(database_uuid)
    return database

@router.post('/databases')
@login_required_api
@jsonify
async def make_new_database(request:Request, factory:Finder=Depends(get_factory)):
    """
    新しいデータベースを作成する
    """
    req = RequestJson(await request.json())

    if req.has('source'):
        # データベースを複製する
        return duplicate_datum(factory, req['source'])
    else:
        database_conn = DatabaseConn(req.json)
        # 接続情報に漏れがあれば例外を送出する
        database_conn.valid_or_raise()

        parent = factory.data.find_by_uuid(req['parent'])
        new_database= parent.create_database(req['label'],
                                            database_conn)
        ret = new_database.to_json()
        new_database.save()
        return ret

@router.put('/databases/{database_uuid}')
@login_required_api
@jsonify
async def update_database(request:Request, database_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したデータベースを変更する、またはデータベースを移動する
    """
    req = RequestJson(await request.json())

    if req.has_no_all('label', 'parent'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('label', 'parent'):
        raise Exception('labelとはparent属性は同時に指定できません')

    if req.has('label'):
        label = req['label']
        database = factory.data.find_by_uuid(database_uuid)
        if len(req) == 1:
            # ラベル名を変更する
            return database.update_label(label)
        else:
            # データベースを変更する
            database_conn = DatabaseConn(req.json)
            # 接続情報に漏れがあれば例外を送出する
            database_conn.valid_or_raise()
            return database.update_data(label, database_conn)
    elif req.has('parent'):
        # データベースを移動する
        new_parent = req['parent']
        database = factory.data.find_by_uuid(database_uuid)
        return database.move(new_parent)
    else:
        raise Exception('update_database parameter error!')

@router.delete('/databases/{database_uuid}')
@login_required_api
@jsonify
async def throw_away_database(database_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したデータベースをほかす
    """
    database = factory.data.find_by_uuid(database_uuid)
    # DatabaseレコードをDBから削除する
    return database.throw_away()


@router.post('/frames')
@login_required_api
@jsonify
async def create_frame(request:Request, factory:Finder=Depends(get_factory)):
    """
    新しいフレームを作成する
    """
    if request.headers.get('Content-Type') == 'application/json':
        req = RequestJson(await request.json())
        if not req.has('source'):
            raise Exception('No source is designated.')
        # フレームを複製する
        return duplicate_datum(factory, req['source'])
    else:
        req = RequestJson(await request.form())
        if not req.has('file'):
            raise Exception('No frame file found.')
        if not req.has_all('parent', 'label'):
            raise Exception('No parent or label are designated.')

        parent = factory.data.find_by_uuid(req['parent'])
        with req['file'].file as f:
            new_frame = parent.create_frame(req['label'], f)
            # FrameをDBに格納する
            new_frame.save()
        return new_frame

@router.put('/frames/{frame_uuid}')
@login_required_api
@jsonify
async def update_frame(request:Request, frame_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したフレームのラベルを変更する、またはフレームを移動する
    """
    req = RequestJson(await request.json())

    if req.has_no_all('parent', 'label', 'encoding', 'newline'):
        raise Exception('label,encoding,newlineまたはparent属性を指定してください')
    elif req.has('parent') and req.has_at_least('label', 'encoding', 'newline'):
        raise Exception('label,encoding,newlineとはparent属性は同時に指定できません')

    frame = factory.data.find_by_uuid(frame_uuid, for_update=True)

    if req.has('parent'):
        # frameを移動する
        return frame.move(req['parent'])

    else:
        if req.has('label'):
            # frameのラベルを変更する
            ret = frame.update_label(req['label'])

        if req.has_all('encoding', 'newline'):
            encoding_str = req['encoding']
            newline_str = req['newline']
            ret = frame.update_encoding_newline(encoding_str, newline_str)

        if ret is None:
            raise Exception('update_frame parameter error!')

        return ret

@router.delete('/frames/{frame_uuid}')
@login_required_api
@jsonify
async def throw_away_frame(frame_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したフレームをほかす
    """
    frame = factory.data.find_by_uuid(frame_uuid)
    if frame is None:
        raise Exception('no frame exists.')
    return frame.throw_away()


@router.get('/documents/{document_uuid}')
@login_required_api
@jsonify
async def fetch_document(document_uuid, contents:bool=False, factory:Finder=Depends(get_factory)):
    """
    指定したドキュメントを取得する
    """
    # ドキュメントを取得する
    document = factory.data.find_by_uuid(document_uuid)

    if contents:
        # ドキュメントの内容を返す
        return FileResponse(path=document.path,
                            media_type=document.content_type)
    else:
        return document

@router.post('/documents')
@login_required_api
@jsonify
async def make_new_document(request:Request, factory:Finder=Depends(get_factory)):
    """
    ファイルストリームからファイルタイプを判定して
    新しいフレームまたはドキュメントを作成する
    """
    # 
    # NOTE: ContentーTypeに従ってエンドポイントの処理を振り分ける機能がFastAPIには存在しない
    # A way to handle multiple request content types
    # https://github.com/fastapi/fastapi/discussions/7786
    # 
    if request.headers.get('Content-Type') == 'application/json':
        req = RequestJson(await request.json())
        if not req.has('source'):
            raise Exception('No source is designated.')
        # ファイルを複製する
        return duplicate_datum(factory, req['source'])
    else:
        req = RequestJson(await request.form())
        if not req.has('file'):
            raise Exception('No frame file found.')
        if not req.has_all('parent', 'label'):
            raise Exception('No parent or label are designated.')

        # NOTE: HTTPのContent-TypeはWebブラウザの判定で殆どの場合はファイル名の拡張子から判定される
        content_type = req['file'].content_type
        maybe_csv = content_type == 'text/csv'

        # 格納先フォルダを取得する
        parent = factory.data.find_by_uuid(req['parent'])
        with req['file'].file as f:
            # ファイルを作成する
            new_file = parent.create_file(req['label'], f, maybe_csv=maybe_csv)
            # ファイルをDBに格納する
            new_file.save()
        return new_file

@router.put('/documents/{document_uuid}')
@login_required_api
@jsonify
async def update_document(request:Request, document_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したドキュメントのラベル名を変更する、または移動する
    """
    req = RequestJson(await request.json())

    if req.has_no_all('parent', 'label'):
        raise Exception('labelまたはparent属性を指定してください')
    elif req.has_all('parent', 'label') and req.has('label'):
        raise Exception('labelとparent属性は同時に指定できません')

    document = factory.data.find_by_uuid(document_uuid)

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

@router.delete('/documents/{document_uuid}')
@login_required_api
@jsonify
async def throw_away_document(document_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したドキュメントをほかす
    """
    document = factory.data.find_by_uuid(document_uuid)
    return document.throw_away()


@router.get('/awss3s/{awss3_uuid}')
@login_required_api
@jsonify
@update_projects_info
async def fetch_awss3_folder(awss3_uuid, members:bool=False, offset:int=None, limit:int=None, factory:Finder=Depends(get_factory)):
    """
    指定したAWS S3フォルダを取得する
    """
    folder = factory.data.find_by_uuid(awss3_uuid)
    return _add_children_info(folder, offset=offset, limit=limit)

@router.post('/awss3s')
@login_required_api
@jsonify
async def make_new_awss3_folder(request:Request, factory:Finder=Depends(get_factory)):
    """
    新しいAWS S3フォルダを作成する
    """
    request_json = await request.json()
    parent = factory.data.find_by_uuid(request_json['parent'])
    new_folder = parent.create_awss3(request_json['label'],
                                     request_json['bucket'])
    # AwsS3レコードをDBに格納する
    new_folder.save()
    return new_folder.to_json()

@router.put('/awss3s/{awss3_uuid}')
@login_required_api
@jsonify
async def update_awss3_folder(request:Request, awss3_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したAWS S3フォルダを変更する
    """
    request_json = await request.json()
    label = request_json['label']
    bucket_name = request_json['bucket']
    awss3 = factory.data.find_by_uuid(awss3_uuid)
    return awss3.update_data(label, bucket_name)

@router.delete('/awss3s/{awss3_uuid}')
@login_required_api
@jsonify
async def throw_away_awss3(awss3_uuid, factory:Finder=Depends(get_factory)):
    """
    指定したAWS S3フォルダをほかす
    """
    # AWS S3ディレクトリ直下のファイルをDBから登録解除する
    pass

    folder = factory.data.find_by_uuid(awss3_uuid)
    # AWS S3 folderレコードをDBから削除する
    return folder.throw_away()
