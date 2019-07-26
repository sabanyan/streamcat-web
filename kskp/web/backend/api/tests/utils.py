# APIテストで使うヘルパー関数群
import uuid
import json
from pathlib import Path
from kskp.web.backend import app
from kskp.store import model, FLOW_PATH

def setUpClient(self):
    """
    エンドポイント テスト用の作成
    """
    self.client = app.test_client()


def setUpUser(self):
    user1 = 1
    model.create_user(user1, '', 'user1', '')
    return user1


def setUpProject(self):
    user1 = setUpUser(self)

    with self.client.session_transaction() as session:
        session['user_id'] = model.get_user_id_by_email(user1)['id']

    model.create_project('proj1', session)
    project_uuid = model.get_all_projects()[0]['uuid']
    project_id = model.get_project_by_uuid(project_uuid)['id']

    return (user1, project_id, project_uuid)


def setUpFlow(self):
    (user1, project_id, project_uuid) = setUpProject(self)

    # フロー作成
    new_flow_name = 'フローテスト用'
    data_source_name = str(uuid.uuid4())

    data = {
        'project_uuid': project_uuid,
        'name': new_flow_name,
        'datasouce': None
    }

    created_flow = model.create_flow(data, user1, data_source_name)

    return (user1, project_id, project_uuid, new_flow_name, data_source_name, created_flow)


def remove_copy_flow_files(data_source_name, copy_flow_label, project_id):
    """
    テストで作成したフローのコピーファイルを削除する
    """
    for path in Path(FLOW_PATH).iterdir():
        if not path.suffix == '.json':
            continue
        with open(path) as f:
            flow_json = json.load(f)
            if flow_json['label'] == copy_flow_label and flow_json['projectId'] == project_id:
                path.unlink()
                break

def create_data(file_path_obj, data=None):
    """
    テストデータ作成用
    frameのuuidが返る
    """
    import nysol.mcmd as nm
    from kskp.store import Library

    if data is not None:
        nm.mread(i=data, o=file_path_obj.as_posix()).run()
    root = Library.load_root()
    frame = Library.save_frame(root.uuid, str(uuid.uuid4()), file_path_obj)
    return frame.uuid
