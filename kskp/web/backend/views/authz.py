from flask import Blueprint, render_template

from kskp.web.backend.api.auth import login_required


mod = Blueprint('authorization', __name__)

@mod.route('/groups')
@login_required
def get_groups():
    return render_template('groups.html')
