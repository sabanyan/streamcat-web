import functools
from flask import request

def update_project_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        project = func(**kwargs)

        # Project JSONに所属Member情報を追加する
        return _jsonify_project(project,
                                jsonify_children=True,
                                update_members=update_members)
    return deco

def update_projects_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        folder = func(**kwargs)

        # Project JSONに所属Member情報を追加する
        return _jsonify_project(folder,
                                jsonify_children=True,
                                update_members=update_members)
    return deco

def update_projects_info2(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = request.args.get('members') == 'on'

        # デコレート対象関数の呼び出し
        projects = func(**kwargs)

        # Project JSONに所属Member情報を追加する
        return [
            _jsonify_project(project,
                            jsonify_children=False,
                            update_members=update_members)
            for project in projects
        ]
    return deco

def _jsonify_project(folder, jsonify_children:bool, update_members:bool):
    from streamcat.core import Datum
    from streamcat.store.auth import Role

    # Projectの場合は、所属Memberの情報をProjectのJSONに追加する
    folder_json = folder.to_json()
    if update_members and folder.type==Datum.PROJECT_TYPE:
        folder_json.update({'members': folder.get_joined_members(except_role_uuid=Role.USR_ADMIN_ROLE_UUID)})

    # 所属Memberの情報を子ProjectのJSONに追加する
    if jsonify_children and 'children' in folder_json:
        for child in folder_json['children']:
            _jsonify_project(child, False, update_members)

    return folder_json
