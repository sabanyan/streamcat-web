import sqlite3
from flask import Blueprint, g

model = Blueprint('model', __name__)

DATABASE = model.root_path + '/data/kskp.db'


def get_projects_by_user_id(user_id, search_string=None):
    """
    特定のユーザが閲覧可能なプロジェクト一覧を取得する
    """

    sql = '''
    SELECT p.uuid, p.name, p.author, p.created_at FROM projects p
     INNER JOIN users_x_projects x
        ON x.project_id = p.id
       AND x.user_id = ?
    '''

    args = (user_id,)
    if search_string is not None:
        sql += ' WHERE p.name LIKE ?'
        args = (user_id, '%' + search_string + '%')

    return query_db(sql, args)


def query_db(query, args=(), one=False):
    """
    指定されたSQLを実行して、その結果を返却する
    """
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def get_connection():
    """
    現在のappcontext内のコネクションを取得する
    存在しなければDBを開いてから取得する
    """
    conn = getattr(g, '_database', None)
    if conn is None:
        conn = g._database = sqlite3.connect(DATABASE)
    return conn


@app.teardown_appcontext
def close_connection(exception):
    """
    appcontext終了時にコネクションを閉じる
    """
    conn = getattr(g, '_database', None)
    if conn is not None:
        conn.close()
