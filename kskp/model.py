import json
import uuid
import sqlite3
from pathlib import Path

from flask import g
from . import app
from .auth import get_password_hash

app.config['DATABASE'] = app.root_path + '/data/kskp.db'
app.config['FLOW_PATH'] = app.root_path + '/data/flow'

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
    return query_db(sql, (generated_uuid, name, user.name, user.email))


def add_info_for_users_x_projects(user_id, project_id):
    """
    ユーザと閲覧可能なプロジェクトの関係を表すレコードを追加する
    """
    sql = '''
    INSERT INTO users_x_projects (user_id, project_id) VALUES (?, ?)
    '''
    query_db(sql, (user_id, project_id))


def start_project(name, session):
    """
    単にprojectsにINSERTするだけではなく、画面上の一つの操作に対応して複数のSQLを実行する
    この処理全体を一つのトランザクションとみなすため、
    既存のcreate_project/add_info_for_users_x_projectsは使えない。

    TODO:
    できればトランザクションを制御する仕組み(with系)を作って
    この部分をcreate_project/add_info_for_users_x_projectsを使う形にリファクタしたい
    """

    # 全体の準備
    conn = get_connection()
    cur = conn.cursor()

    # projectsに行を挿入する
    sql_projects = '''
    INSERT INTO projects (uuid, name, creator_name, creator) VALUES (?, ?, ?, ?)
    '''
    generated_uuid = str(uuid.uuid4())
    user = get_current_user(session)

    cur.execute(sql_projects, (generated_uuid, name, user.name, user.email))

    # 次にユーザ別の閲覧可能なプロジェクトを表すテーブルに行を挿入する
    # ひとまず、自分が作ったプロジェクトは自分だけが見られるような仕様にしておく
    sql_users_x_projects = '''
    INSERT INTO users_x_projects VALUES (?, ?)
    '''
    cur.execute(sql_users_x_projects, (user.email, cur.lastrowid))


    # 後片付け
    conn.commit()
    cur.close()


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
    この場合の'user_id'はemailのこと
    """

    sql = '''
    SELECT p.uuid, p.name, p.creator_name, p.created_at FROM projects p
     INNER JOIN users_x_projects x
        ON x.project_id = p.id
     INNER JOIN users u
        ON x.user_id = u.id
     WHERE u.email = ?
     ORDER BY p.id
    '''

    args = (user_id,)
    if search_string is not None:
        sql += ' WHERE p.name LIKE ?'
        args = (user_id, '%' + search_string + '%')

    return query_db(sql, args)


def delete_project_by_uuid(project_uuid):
    """
    プロジェクトを削除する(uuidが基準)
    """
    sql = 'DELETE FROM projects WHERE uuid = ?'
    query_db(sql, (project_uuid,))


def rename_project(project_uuid, new_name):
    """
    プロジェクトの名前を変更する
    """
    sql = 'UPDATE projects SET name = ? WHERE uuid = ?'
    query_db(sql, (new_name, project_uuid))


def create_flow(project_id, flow_name, data_source_name=None):
    """
    フローを作成する
    TODO: 詳細は変更予定
    """
    new_flow_uuid = str(uuid.uuid4())

    if data_source_name is None:
        data_source_name = new_flow_uuid

    data = {
        'uuid': new_flow_uuid,
        'project_id': project_id,
        'name': flow_name
    }

    write_data_to_json(make_flow_path(data_source_name), data)

    return data


def fetch_flow_by_uuid(flow_uuid):
    """
    指定したフローの内容を返す
    """
    path = get_flow_path_by_uuid(flow_uuid)
    return json.loads(path.read_text())


def delete_flow_by_uuid(flow_uuid):
    """
    フローを削除する
    """
    get_flow_path_by_uuid(flow_uuid).unlink()


def update_flow_by_uuid(flow_uuid, data):
    """
    指定したフローの内容を渡されたdataの内容と結合する
    同じキーが含まれる場合は新しいもので上書きされる
    """
    path = get_flow_path_by_uuid(flow_uuid)
    current = json.loads(path.read_text())
    current.update(data)

    write_data_to_json(path, current)

    return current


def get_flow_path_by_uuid(flow_uuid):
    """
    指定したUUIDをもつフローファイルのパスを返すヘルパー
    """
    for flow_path in Path(app.config['FLOW_PATH']).iterdir():
        data = json.loads(flow_path.read_text(encoding='utf-8'))
        if data['uuid'] == flow_uuid:
            return flow_path


def make_flow_path(file_name):
    """
    フローファイルのパス作成用ヘルパー
    """
    return Path(app.config['FLOW_PATH']) / Path('%s.json' % file_name)


def get_project_id_by_uuid(project_uuid):
    """
    指定したUUIDを持つプロジェクトを返す
    該当プロジェクトが存在しない場合はNoneを返す
    """
    sql = 'SELECT id FROM projects WHERE uuid = ?'

    result = query_db(sql, (project_uuid,), one=True)

    return result['id'] if result is not None else None


def write_data_to_json(path, data):
    """
    データをJSONとしてファイルに書き込むヘルパー
    """
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def query_db(query, args=(), one=False):
    """
    指定されたSQLを実行して、その結果を返却する
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.execute(query, args)
    conn.commit()
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
