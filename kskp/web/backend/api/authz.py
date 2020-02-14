from flask import Blueprint, request, session
from kskp.store.auth.group import Group
from .utils.api_base import api_base

mod = Blueprint('authz', __name__)

@mod.route('/groups')
@api_base
def get_groups():
    return Group.all()

@mod.route('/groups', methods=['POST'])
@api_base
def make_new_group():
    """
    グループを作成する
    """
    new_group = Group(request.json['name'], is_admin=1, creator=session['user_id'])
    new_group.save()

@mod.route('/groups/<int:group_id>', methods=['DELETE'])
@api_base
def delete_group(group_id):
    """
    グループを削除する
    """
    Group.find_by_id(group_id).delete()
