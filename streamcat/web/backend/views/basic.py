from fastapi import APIRouter, Request, Depends, status
from fastapi.responses import RedirectResponse, FileResponse
from streamcat.store.finder import Finder
from .. import app
from ..api.utils import login_required_api, get_finder
from .utils import make_response, login_required

router = APIRouter()

@router.get('/')
@router.post('/')
async def top(session:bool=False):
    q_params = '?session=on' if session else ''
    return RedirectResponse(app.url_path_for('library') + q_params, status_code=status.HTTP_303_SEE_OTHER)

@router.get('/favicon.ico')
async def favicon():
    from pathlib import Path
    file_path = Path(__file__).parents[2] / 'frontend/static/images/streamcat.ico'
    return FileResponse(path=file_path, media_type='image/x-icon')

@router.get('/settings/profile')
@router.post('/settings/profile')
@login_required
async def profile(request:Request):
    return make_response(request, 'profile.html')

@router.get('/admin/sys')
@router.post('/admin/sys')
@login_required
async def admin_sys(request:Request):
    return make_response(request, 'admin/sys.html')

@router.get('/admin/users')
@router.post('/admin/users')
@login_required
async def admin_users(request:Request):
    return make_response(request, 'admin/users.html')

@router.get('/library')
@router.post('/library')
@login_required
async def library(request:Request):
    return make_response(request, 'library.html', is_project='false', is_trash='false')

@router.get('/projects/{project_uuid}')
@router.post('/projects/{project_uuid}')
@login_required
async def projects(request:Request, project_uuid):
    uuid = project_uuid.rstrip('?')
    return make_response(request, 'library.html', folder_uuid=uuid, is_project='true', is_trash='false')

@router.get('/folders/{folder_uuid}')
@router.post('/folders/{folder_uuid}')
@login_required
async def folders(request:Request, folder_uuid):
    uuid = folder_uuid.rstrip('?')
    return make_response(request, 'library.html', folder_uuid=uuid, is_project='false', is_trash='false')

@router.get('/trashes')
@router.post('/trashes')
@login_required
async def trashes(request:Request):
    return make_response(request, 'library.html', is_project='false', is_trash='true')

@router.get('/flows/{flow_uuid}')
@router.post('/flows/{flow_uuid}')
@login_required
async def flow_designer(request:Request, flow_uuid):
    return make_response(request, 'flow_designer.html', flow_uuid=flow_uuid)

@router.get('/preview')
@router.post('/preview')
@login_required
async def preview(request:Request):
    return make_response(request, 'preview.html', is_preview=True)

@router.get('/documents/{document_uuid}')
@login_required
@login_required_api
async def document(request:Request, document_uuid, finder:Finder=Depends(get_finder)):
    document = finder.data.find_by_uuid(document_uuid)
    return make_response(request, 'document.html', document_uuid=document_uuid, label='👁' + document.label)

# 開発用画面
# TODO: 将来、見れる権限の検討が必要かも
# @mod.route('/dev', methods=['GET', 'PUT'])
# @login_required
# def dev():
#     return make_response('dev/dev.html')
