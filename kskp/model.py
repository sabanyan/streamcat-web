import uuid
import sqlite3

from flask import g
from . import app
from .auth import get_password_hash

app.config['DATABASE'] = app.root_path + '/data/kskp.db'

def create_user(email, password, name, creator):
    """
    新しいユーザを登録する
    パスワードはハッシュ化する
    """
    sql = '''
    INSERT INTO users (email, password, name, creator) VALUES (?, ?, ?, ?)
    '''
    hashed_password = get_password_hash(email, password)
    query_db(sql, (email, hashed_password, name, creator))

def get_user(email):
    """
    指定したemailのユーザレコードを返す
    """
    sql = '''
    SELECT name FROM users WHERE email = ?
    '''
    return query_db(sql, (email,), one=True)


def get_all_users():
    """
    ユーザ一覧を取得する
    """
    pass

def delete_user(email):
    """
    ユーザを削除する
    """
    sql = 'DELETE FROM users WHERE email = ?'
    query_db(sql, (email,))


def get_current_user(session):
    """
    セッションからidを取得して、
    ログイン状態のユーザ情報を返す
    """
    user_id = session['user_id']
    user_record = get_user(user_id)
    return User(user_id, user_record[0]) # 0にはユーザ名が入っている


def create_project(name, session):
    """
    新しいプロジェクトを作成する
    """
    sql = '''
    INSERT INTO projects (uuid, name, creator_name, creator) VALUES (?, ?, ?, ?)
    '''
    generated_uuid = str(uuid.uuid4())
    user = get_current_user(session)
    query_db(sql, (generated_uuid, name, user.name, user.email))


def add_info_for_users_x_projects(user_id, project_id):
    """
    ユーザと閲覧可能なプロジェクトの関係を表すレコードを追加する
    """
    sql = '''
    INSERT INTO users_x_projects (user_id, project_id) VALUES (?, ?)
    '''
    query_db(sql, (user_id, project_id))


def get_all_projects():
    """
    すべてのプロジェクトを取得する
    """
    sql = '''
    SELECT id, uuid, name, creator_name FROM projects
    '''
    return query_db(sql)

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
    cur = get_connection().execute(query, args)
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
        conn = g._database = sqlite3.connect(app.config['DATABASE'])
    return conn


def init_db():
    conn = get_connection()
    with app.open_resource('sql/schema.sql', mode='r') as f:
        conn.cursor().executescript(f.read())
    conn.commit()


@app.teardown_appcontext
def close_connection(exception):
    """
    appcontext終了時にコネクションを閉じる
    """
    conn = getattr(g, '_database', None)
    if conn is not None:
        conn.close()

class User:
    def __init__(self, email, name):
        self.email = email
        self.name = name
