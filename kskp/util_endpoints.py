import json
from pathlib import Path

from flask import Blueprint, render_template

from .model import get_all_projects

endpoints = Blueprint('util', __name__)

@endpoints.route('/csvs')
def csvs():
    base_path = '/home/kskp'
    unused_frame_uuids = []
    filenames = []
    for d in Path(base_path + '/kskp/data/frames').iterdir():        
        filenames.append(
            {
                'name': d.name
            }
        )
        unused_frame_uuids.append(d.stem)

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

    return render_template('csvs.html', projects=projects, flows=flows, files=filenames, unused=unused_frame_uuids)