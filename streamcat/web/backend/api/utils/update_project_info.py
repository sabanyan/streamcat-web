import functools

def update_project_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = kwargs.get('members')

        # デコレート対象関数の呼び出し
        project = func(**kwargs)

        # Project JSONに所属Member情報を追加する
        return _inject_members(project, inject_to_children=True) if update_members else project
    return deco

def update_projects_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = kwargs.get('members')

        # デコレート対象関数の呼び出し
        folder = func(**kwargs)

        # Project JSONに所属Member情報を追加する
        return _inject_members(folder, inject_to_children=True) if update_members else folder
    return deco

def update_projects_info2(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 参加ユーザの情報を含めるか否か
        update_members = kwargs.get('members')

        # デコレート対象関数の呼び出し
        projects = func(**kwargs)

        # Project JSONに所属Member情報を追加する
        if update_members:
            return [
                _inject_members(project, inject_to_children=False) for project in projects
            ]
        else:
            return projects
    return deco

def _inject_members(folder, inject_to_children=False):
    from streamcat.core import SavableDatum
    from streamcat.store.auth import Role

    # Folderのto_json()を退避する
    folder_to_json = folder.to_json

    # Folderのto_json()が'members'も返すように変更する
    def to_json():
        ret = folder_to_json()
        # Projectの場合は、所属Memberの情報を含める
        if folder.type==SavableDatum.PROJECT_TYPE:
            ret['members'] = folder.get_joined_members(except_role_uuid=Role.USR_ADMIN_ROLE_UUID)

        # JSONに子Datumが含まれていれば、それら子Datumのto_json()も同様に変更する
        if inject_to_children and 'children' in ret:
            for child in ret['children']:
                _inject_members(child, inject_to_children=False)

        return ret

    # Folderのto_json()を変更後のto_json()に置き換える
    folder.to_json = to_json
    return folder
