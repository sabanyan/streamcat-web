import os
from fastapi import APIRouter, Depends, Request, Form, File, UploadFile
from fastapi.responses import FileResponse
from streamcat.store.factory import Factory
from .utils import (
    RequestJson,
    get_factory,
    jsonify,
    login_required_api,
    make_refresh_token,
    make_access_token
)

router = APIRouter()

@router.get('/navigation')
@login_required_api
@jsonify
async def get_navigation(factory:Factory=Depends(get_factory)):
    """
    ナビゲーションバーに表示する情報などを取得する
    """
    import shutil
    from streamcat.core import SavableDatum, STREAMCAT_VER

    # 指定したディレクトリパスにおけるストレージの使用量と空容量を取得する
    total, used, free = shutil.disk_usage(SavableDatum.STORE_DIR)

    navigation = {
        'version': STREAMCAT_VER,
        'depoName': os.environ.get('STREAMCAT_DEPO') or 'Unit Test',
        'storageUsage': {
            'total': used + free,
            'used' : used,
            'free' : free
        },
        'user': {},
        'allowlist': {}
    }

    if factory.myself is not None:
        navigation['user'] = factory.myself.to_json()
        navigation['allowlist'] = factory.myself.get_allowlist()

    return navigation


@router.get('/stores')
@login_required_api
@jsonify
async def fecth_stores(factory:Factory=Depends(get_factory)):
    """
    データストアの定義(雛形)の一覧を返却する
    """
    return factory.store.find_all()

@router.get('/stores/{store_id}')
@login_required_api
@jsonify
async def fecth_store(store_id:str, factory:Factory=Depends(get_factory)):
    """
    データストアの定義(雛形)を返却する
    """
    return factory.store.find_by_id(store_id)

@router.post('/stores')
@login_required_api
@jsonify
async def make_new_store(body:dict, factory:Factory=Depends(get_factory)):
    """
    データストアの定義(雛形)を作成する
    """
    new_store = factory.store.create(body['id'],
                                    body['version'],
                                    body['label'],
                                    body['description'],
                                    body['url'],
                                    body['params'])
    new_store.save()
    return new_store

@router.delete('/stores/{store_id}')
@login_required_api
@jsonify
async def delete_store(store_id:str, factory:Factory=Depends(get_factory)):
    """
    データストアの定義(雛形)を削除する
    """
    store = factory.store.find_by_id(store_id)
    store.delete()


@router.get('/connections/remote-folders')
@login_required_api
@jsonify
async def is_remote_folder_connectable(request:Request, factory:Factory=Depends(get_factory)):
    """
    リモートフォルダの接続を確認する
    """
    from streamcat.store import RemoteFolderConn

    # クエリパラメータをDictで取得する
    request_args = dict(request.query_params)

    # 接続に用いるリモートフォルダを作成する(保存しないこと)
    root = factory.data.load_root()
    remote_folder_conn = RemoteFolderConn(request_args)
    tmp_folder = root.create_remote_folder('CONNECTION-TEST', remote_folder_conn)

    # 接続情報に漏れがあれば例外を送出する
    tmp_folder.valid_or_raise()

    # 接続の確認結果を返す
    return {'conn': tmp_folder.is_mountable()}

@router.get('/connections/databases')
@login_required_api
@jsonify
async def is_database_connectable(request:Request, factory:Factory=Depends(get_factory)):
    """
    データベースの接続を確認する
    """
    from streamcat.store import DatabaseConn
    from streamcat.engine import execute
    from streamcat.depo.std.commands.scmd.script import DbIsConnectableCommand

    # クエリパラメータをDictで取得する
    request_args = dict(request.query_params)

    # 接続に用いるデータベースを作成する(保存しないこと)
    root = factory.data.load_root()
    db_conn = DatabaseConn(request_args)
    tmp_db = root.create_database('CONNECTION-TEST', db_conn)

    # Restoreコマンドを実行する
    outs = execute(DbIsConnectableCommand(), inputs={'i':tmp_db}).join()
    if 'o' not in outs or isinstance(outs['o'], Exception):
        raise Exception(f'DbIsConnectableCommandの実行に失敗しました {outs.get("o","")}')

    # 接続の確認結果を返す
    return {'conn': outs['o']}

@router.get('/archives/flows/{uuid}')
@login_required_api
@jsonify
async def download_flow(uuid, factory:Factory=Depends(get_factory)):
    from starlette.background import BackgroundTask
    from streamcat.store import FlowDumper
    
    flow_dumper = FlowDumper(factory)
    (archive_path, archive_name) = flow_dumper.dump_archive(uuid)

    # アーカイブファイルを返す
    return FileResponse(path=archive_path,
                        filename=archive_name + '.tgz',
                        media_type='application/gzip',
                        # 返した後にファイルを削除する       
                        background=BackgroundTask(archive_path.unlink))

@router.post('/archives/flows')
@login_required_api
@jsonify
async def upload_flow(label:str=Form(None),
                parent:str=Form(),
                file:UploadFile=File(),
                factory:Factory=Depends(get_factory)):
    from pathlib import Path

    parent = factory.data.find_by_uuid(parent)
    file_name = Path(file.filename).stem

    from streamcat.store import FlowDumper
    flow_dumper = FlowDumper(factory)
    flow_dumper.restore_archive(parent, label, file_name, file.file)


@router.get('/dump')
@login_required_api
@jsonify
async def get_dump(factory:Factory=Depends(get_factory)):
    """
    StreamCatのDumpファイルを取得する
    """
    from datetime import datetime
    from streamcat.core import Tmp
    from streamcat.engine import execute
    from streamcat.depo.std.commands.scmd.script import DumpCommand

    try:
        # Dumpコマンドを実行する
        outs = execute(DumpCommand(), args={'datum_factory': factory.data}).join()
        if 'o' not in outs or isinstance(outs['o'], Exception):
            raise Exception(f'DumpCommandの実行に失敗しました {outs.get("o","")}')

        # Dumpファイルをクライアントに返す
        archive_path = outs['o']
        archive_name = 'backup_' + datetime.now().strftime('%Y%m%d') + '.tgz'

        # アーカイブファイルを返す
        return FileResponse(path=archive_path,
                            filename=archive_name,
                            media_type='application/gzip')
    finally:
        # Dumpコマンドで作成した一時ファイルを削除する
        Tmp.remove_files()
    
@router.post('/dump')
@login_required_api
@jsonify
async def upload_dump(file:UploadFile=File(),
                factory:Factory=Depends(get_factory)):
    """
    StreamCatのDumpファイルを復元する
    """
    from streamcat.engine import execute
    from streamcat.depo.std.commands.scmd.script import RestoreCommand

    # Restoreコマンドを実行する
    outs = execute(RestoreCommand(), args={'factory':factory}, inputs={'i':file.file}).join()
    if 'o' not in outs or isinstance(outs['o'], Exception):
        raise Exception(f'RestoreCommandの実行に失敗しました {outs.get("o","")}')


@router.post('/tokens/refresh')
@login_required_api
@jsonify
async def get_refresh_token(body:dict, factory:Factory=Depends(get_factory)):
    """
    リフレッシュトークンを発給する
    """
    req = RequestJson(body)

    if not req.has('currentPassword'):
        raise Exception('現在のパスワードを指定してください')
    if not factory.myself.authenticate(req['currentPassword']):
        raise Exception('現在のパスワードが誤っています')

    return make_refresh_token(factory.myself.uuid)

@router.post('/tokens/access')
@login_required_api
@jsonify
async def get_access_token(factory:Factory=Depends(get_factory)):
    """
    アクセストークンを発給する
    """
    # アクセストークンを用いて新たなアクセストークンを
    # 発給できるが脆弱性にはならないだろう
    return make_access_token(factory.myself.uuid)
