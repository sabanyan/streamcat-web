from flask import Blueprint, session
from kskp.store.auth.group import Group
from .utils.api_base import api_base

mod = Blueprint('authz', __name__)

@mod.route('/groups')
def get_groups():    
    return 'get_groups'

@mod.route('/add-group')
@api_base
def make_new_group():
    """
    グループを作成する
    """
    new_group = Group('admin', is_admin=1, creator=session['user_id'])
    new_group.save()
    
    return new_group
    