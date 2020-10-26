import json
import functools
from flask import request, jsonify, g

def update_user_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = request.args.get('roles') == 'on'

        # 所属プロジェクトの情報を含めるか否か
        update_projects = request.args.get('projects') == 'on'

        # 所属ロールも所属プロジェクトの情報も含めない場合は処理を終える
        if not update_roles and not update_projects:
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        result = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not result['success']:
            return func(**kwargs)

        # 所属ロールの情報をUser JSONに追加する
        if update_roles:
            _update_user_roles_info(result['data'])

        # 所属プロジェクトの情報をUser JSONに追加する
        if update_projects:
            _update_user_projects_info(result['data'])

        return jsonify(result)
    return deco

def update_users_info(func):
    @functools.wraps(func)
    def deco(**kwargs):
        # 所属ロールの情報を含めるか否か
        update_roles = request.args.get('roles') == 'on'

        # 所属プロジェクトの情報を含めるか否か
        update_projects = request.args.get('projects') == 'on'

        # 所属ロールも所属プロジェクトの情報も含めない場合は処理を終える
        if not update_roles and not update_projects:
            return func(**kwargs)

        # デコレート対象関数の呼び出し
        results = json.loads(func(**kwargs).data.decode())

        # APIの異常終了時は情報を追加しない
        if not results['success']:
            return func(**kwargs)

        for user_data in results['data']:
            # 所属ロールの情報をUser JSONに追加する
            if update_roles:
                _update_user_roles_info(user_data)

            # 所属プロジェクトの情報をUser JSONに追加する
            if update_projects:
                _update_user_projects_info(user_data)   

        return jsonify(results)
    return deco

def _update_user_roles_info(user_data):
    user = g.factory.user.find_by_uuid(user_data['uuid'])
    user_data.update({'roles' : user.get_joined_roles()})
    return user_data

def _update_user_projects_info(user_data):
    # 少なくとも1つの権限を有するプロジェクトを所属プロジェクトとする
    user = g.factory.user.find_by_uuid(user_data['uuid'])
    user_data.update({'projects' : user.get_joined_projects()})
    return user_data
