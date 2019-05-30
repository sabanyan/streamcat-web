# framesAPI用のutils
# 他のAPIでも使うようなら外側にutils.py（betaのmodels.py）を作るか
import json

from pathlib import Path

def get_flow_nodes_by_uuid(flow_uuid):
    """
    flowのjsonを受け取り、idをkey、valueをnodeとした連想配列を返す
    """
    data = fetch_flow_by_uuid(flow_uuid)
    if data.get('nodes') is None:
        return {}
    return {node['id']:node for node in data['nodes']}

def fetch_flow_by_uuid(flow_uuid):
    """
    指定したフローの内容を返す
    """
    path = get_flow_path_by_uuid(flow_uuid)
    return json.loads(path.read_text())

def get_flow_path_by_uuid(flow_uuid):
    """
    指定したUUIDをファイル名にもつフローファイルのパスを返す
    """
    for flow_path in Path('kskp/data/flows').iterdir():
        if flow_path.stem == flow_uuid:
            return flow_path
