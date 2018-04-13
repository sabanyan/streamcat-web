from flask import Blueprint
from .auth import login_required
import uuid

api = Blueprint('api', __name__)

@api.route('/')
def api_root():
    return "I'm api root %s" % api.root_path

@api.route('/projects/new', methods=['POST'])
@login_required
def new_project():
    """
    新しいプロジェクトを作成するAPI
    """

    project_name = request.json['name']
    # 本来、authorはIDではなく、名前を入れるべきだがα版ではサボります
    # author = request.json['author']
    creator_name = current_user_id
    sql = 'INSERT INTO projects (uuid, name, creator_name, creator) VALUES (?, ?, ?, ?)'
    values = (str(uuid.uuid4()), project_name, author, creator)
    fetch_all(sql, values) # 更新専用の関数を作るべきでしょうけどα版ではサボります

    # TODO: 本当はここはトランザクション切らないとヤヴァイけどα版なのであとで！
    sql2 = 'SELECT MAX(id) FROM projects'
    max_project_id = fetch_all(sql2)[0][0]

    # ひとまず、自分が作ったプロジェクトは自分だけが見られるような仕様にしておく
    sql3 = 'INSERT INTO users_x_projects VALUES (?, ?)'
    values3 = (current_user_id, max_project_id)
    fetch_all(sql3, values3) # 更新専用の関数を作るべきでしょうけどα版ではサボります

    # ひとまず現在は成功ステータスだけを返す
    return jsonify({'success': True})
