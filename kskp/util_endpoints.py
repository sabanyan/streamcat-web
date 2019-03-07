import json
from pathlib import Path

from flask import request, Blueprint, render_template, redirect

from .model import get_all_projects, update_flow_by_uuid

endpoints = Blueprint('util', __name__)

base_path = '/home/kskp'
# base_path = ''

@endpoints.route('/csvs')
def csvs():
    unused_frame_uuids = all_csvs(base_path)

    projects = [{'name': '全プロジェクト'}]
    projs_db = get_all_projects()
    for proj in projs_db:
        projects.append({'id': proj['id'], 'name': proj['name']})

    flows = [{'label': '全フロー', 'filename': '-', 'proj_id': -1, 'nodes': []}]
    for d in Path(base_path + '/kskp/data/flows').iterdir():
        if d.name.endswith('json'):
            j = None
            try:
                j = json.loads(d.read_text(), encoding='utf-8')
            except Exception as e:
                print(e)
            if j is not None and 'nodes' in j:
                nodes = []
                for node in j['nodes']:
                    if node['type'] == 'frame' and node['uuid'] is not None:
                        if 'label' in node:
                            label = node['label']
                        else:
                            label = node['id']
                        nodes.append({'id': node['id'], 'label': label, 'uuid': node['uuid']})
                        # どこからも使われていないリストから消す
                        if node['uuid'] in unused_frame_uuids:
                            unused_frame_uuids.remove(node['uuid'])

                flows.append({'label': j['label'], 'filename': d.name, 'proj_id': j['projectId'], 'nodes': nodes})
            else:
                flows.append({'label': 'JSON読めず', 'filename': d.name, 'proj_id': 0, 'nodes': []})

    return render_template('csvs.html', projects=projects, flows=flows, files=[], unused=unused_frame_uuids)

@endpoints.route('/delete_unused_csvs')
def delete_unused_csvs():
    deleting = all_csvs(base_path)

    for d in Path(base_path + '/kskp/data/flows').iterdir():
        if d.name.endswith('json'):
            j = None
            try:
                j = json.loads(d.read_text(), encoding='utf-8')
            except Exception as e:
                print(e)
            if j is not None and 'nodes' in j:
                nodes = []
                for node in j['nodes']:
                    if node['type'] == 'frame' and node['uuid'] is not None:
                        # どこからも使われていないリストから消す
                        if node['uuid'] in deleting:
                            deleting.remove(node['uuid'])

    for deleted in deleting:
        # 削除実行！
        Path(base_path + '/kskp/data/frames/' + deleted + '.csv').unlink()

    return render_template('deleting.html', deleting=deleting)

def all_csvs(base_path):
    unused_frame_uuids = []
    filenames = []
    for d in Path(base_path + '/kskp/data/frames').iterdir():
        filenames.append(
            {
                'name': d.name
            }
        )
        unused_frame_uuids.append(d.stem)
    return unused_frame_uuids

@endpoints.route('/remove_cache')
def remove_cache():
    p = Path(base_path + '/kskp/data/flows').joinpath(request.args['flow'])
    j = json.loads(p.read_text(), encoding='utf-8')

    for i, node in enumerate(j['nodes']):
        if node['id'] == request.args['frame']:
            j['nodes'][i]['uuid'] = None

    update_flow_by_uuid(p.stem, j)

    return redirect('/csvs')
