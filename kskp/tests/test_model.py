import os
import io
import json
import unittest
import tempfile
import uuid
from pathlib import Path

from kskp import app
import kskp.model as model

import pprint

from kskp.models import db
from kskp.models.library import Library
from kskp.models.folder import Folder
from kskp.models.remote_folder import RemoteFolder
from kskp.models.database import Database
from kskp.models.frame import Frame

class ModelTestCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

    def test_schema(self):
        with app.app_context():
            conn = model.get_connection()
            sql = "SELECT name FROM sqlite_master WHERE type = 'table'"
            current_tables = {t[0] for t in model.query_db(sql)}
            conn.commit()

            # これもできれば仕様書を作ってそこから引っぱってくるようにしたい
            correct_tables = [
                'users',
                'projects',
                'users_x_projects'
            ]
            for table in correct_tables:
                self.assertIn(table, current_tables)

    def test_create_user(self):
        with app.app_context():
            email = 'dev@kskp.io'
            password = 'devpass'
            name = '開発者'
            creator = 'admin@kskp.io'
            model.create_user(email, password, name, creator)

            sql = "SELECT password, name, creator FROM users WHERE email = ?"
            result = model.query_db(sql, (email,), one=True)

            self.assertNotEqual(result[0], password) # 平文ではないことのテスト
            self.assertEqual(result[1], name)
            self.assertEqual(result[2], creator)

    def test_delete_user(self):
        with app.app_context():
            email = 'test@kskp.io'

            model.create_user(email, '', 'test', '')
            result = model.get_user_id_by_email(email)['name']
            self.assertEqual(result, 'test')

            model.delete_user(email)

            result = model.get_user_id_by_email(email)
            self.assertIsNone(result)

    def test_get_current_user(self):
        with app.test_client() as client:
            with app.app_context():
                email = 'dev@kskp.io'
                name = '開発者'
                model.create_user(email, '', name, '')

                with client.session_transaction() as session:
                    session['user_id'] = model.get_user_id_by_email(email)['id']
                    user = model.get_current_user(session)

                self.assertEqual(user.email, email)
                self.assertEqual(user.id, session['user_id'])

    def test_create_project(self):
        with app.app_context():
            email = 'dev@kskp.io'
            name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            results = model.get_all_projects()
            self.assertEqual(len(results), 1)
            res = results[0]
            self.assertEqual(res['name'], project_name)
            self.assertEqual(res['creator_id'], session['user_id'])

    def test_add_info_for_users_x_projects(self):
        """
        add_info_for_users_x_projects関数のテスト
        本当はinsertできているかだけじゃなくて、
        ちゃんとusersとprojectsを繋げられているかのテストも必要だが、
        それは果たしてこのメソッド内で行うべきなのか？

        ひとまずは単純なテストだけを実装しておく
        """

        with app.app_context():
            user_id = 1
            project_id = 2
            model.add_info_for_users_x_projects(user_id, project_id)

            sql = '''
            SELECT user_id, project_id FROM users_x_projects
             WHERE user_id = ? AND project_id = ?
            '''

            result = model.query_db(sql, (user_id, project_id), one=True)

            self.assertEqual(result[0], user_id)
            self.assertEqual(result[1], project_id)


    def test_get_projects_by_user_id(self):
        """
        どちらかというと、
        こちらは「ちゃんとusers_x_projects」がjoinできているかどうかのテスト、
        そしてAPIの方はいわゆる
        「意味的に目的にかなうデータが出てきているかどうか」のテストにしましょう
        """
        with app.app_context():

            # テストデータの準備
            self.make_data_for_getting_projects()
            user_id = model.get_user_id_by_email('user2')['id']
            # テストの実行
            projects_of_current_user = model.get_projects_by_user_id(user_id)

            self.assertEqual(len(projects_of_current_user), 2)
            self.assertEqual(projects_of_current_user[0]['name'], 'proj2')
            self.assertEqual(projects_of_current_user[1]['name'], 'proj3')


    def make_data_for_getting_projects(self):
        """
        test_get_projects_by_user_idから使うためのテストデータ作成用。
        """

        user1 = 'user1'
        user2 = 'user2'
        model.create_user(user1, '', '', '')
        model.create_user(user2, '', '', '')

        with self.client.session_transaction() as session:
            session['user_id'] = model.get_user_id_by_email(user1)['id']

        proj1 = 'proj1'
        proj2 = 'proj2'
        proj3 = 'proj3'

        model.create_project(proj1, session)
        model.create_project(proj2, session)
        model.create_project(proj3, session)

        model.add_info_for_users_x_projects(1, 1) # user1 proj1
        model.add_info_for_users_x_projects(1, 2) # user1 proj2
        model.add_info_for_users_x_projects(2, 2) # user2 proj2
        model.add_info_for_users_x_projects(2, 3) # user2 proj3

        # ちょっと確認用
        # fetch_users_sql = '''
        # SELECT * FROM users
        # '''
        # users = model.query_db(fetch_users_sql)
        # self.assertEqual(len(users), 2)
        # self.assertEqual(users[0]['id'], 1)
        # self.assertEqual(users[1]['id'], 2)
        #
        # fetch_projects_sql = '''
        # SELECT COUNT(*) FROM projects
        # '''
        # projects_count = model.query_db(fetch_projects_sql, (), one=True)
        # self.assertEqual(projects_count[0], 3)
        #
        # fetch_x_sql = '''
        # SELECT COUNT(*) FROM users_x_projects
        # '''
        # x_count = model.query_db(fetch_x_sql, (), one=True)
        # self.assertEqual(x_count[0], 4)

    def test_start_project(self):
        """
        model.start_projectをテストする
        """
        with app.app_context():
            email = 'dev@kskp.io'
            creator_name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', creator_name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.start_project(project_name, session)

            fetch_sql = '''
            SELECT x.user_id, p.name, p.creator_id FROM projects p
             INNER JOIN users_x_projects x
                ON x.project_id = p.id
               AND x.user_id = ?
            '''
            res = model.query_db(fetch_sql, (session['user_id'],), one=True)

            self.assertEqual(res['user_id'], session['user_id'])
            self.assertEqual(res['name'], project_name)
            self.assertEqual(res['creator_id'], session['user_id'])


    def test_delete_project_by_uuid(self):
        with app.app_context():
            email = 'dev@kskp.io'
            name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 削除前のプロジェクトの数を調べる
            projects_before = model.get_all_projects()
            self.assertEqual(len(projects_before), 1)
            uuid = projects_before[0]['uuid']

            model.delete_project_by_uuid(uuid)

            # 削除後のプロジェクトの数を調べる
            projects_after = model.get_all_projects()
            self.assertEqual(len(projects_after), 0)

    def test_rename_project(self):
        with app.app_context():
            email = 'dev@kskp.io'
            name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # いま作成したプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # 名前を変更する
            new_project_name = '新しい名前'
            model.rename_project_by_uuid(project_uuid, new_project_name)

            self.assertEqual(model.get_all_projects()[0]['name'], new_project_name)


    def test_create_flow(self):
        with app.app_context():
            # まず親プロジェクトを作る
            email = 'dev@kskp.io'
            name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # そこからプロジェクトのIDを取得する
            project_id = model.get_project_id_by_uuid(project_uuid)

            # フロー作成
            new_flow_name = 'ふろー'
            data_source_name = str(uuid.uuid4())
            data_source = {
                "id": "i",
                "type": "frame",
                "dataSource": "csv",
                "uuid": "2C72275F-2019-49AE-B36D-A29D1507F8DD",
                "label": "test"
            }
            data = {'project_uuid': project_uuid, 'name': new_flow_name, 'datasource': data_source}
            new_flow = model.create_flow(data, session['user_id'], data_source_name)

            # フローを取得
            path = model.make_flow_path(data_source_name)

            created_flow = json.loads(path.read_text(encoding='utf-8'))

            self.assertEqual(path.stem, data_source_name)
            self.assertEqual(created_flow['description'], "")
            self.assertEqual(created_flow['projectId'], project_id)
            self.assertEqual(created_flow['label'], new_flow_name)
            self.assertEqual(created_flow['creator'], name)
            self.assertEqual(created_flow['nodes'][0]['uuid'], "2C72275F-2019-49AE-B36D-A29D1507F8DD")
            self.assertEqual(created_flow['nodes'][0]['label'], "test")

            # 後片付け
            path.unlink()

    def test_fetch_flow(self):
        with app.app_context():
            # まず親プロジェクトを作る
            email = 'dev@kskp.io'
            name = '開発者'

            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # そこからプロジェクトのIDを取得する
            project_id = model.get_project_id_by_uuid(project_uuid)

            # フローを作成する
            new_flow_name = 'ふろー取得てすと'
            data_source_name = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': new_flow_name, 'datasource': None}
            created_flow = model.create_flow(data, session['user_id'], data_source_name)

            fetched_flow = model.fetch_flow_by_uuid(data_source_name)

        # ファイル名も確認しておく
        path = model.get_flow_path_by_uuid(data_source_name)
        self.assertEqual(path.name, '%s.json' % data_source_name)

        # JSONの中身も確認する
        self.assertEqual(fetched_flow['projectId'], project_id)
        self.assertEqual(fetched_flow['label'], new_flow_name)

        # 後片付け
        path.unlink()

    def test_fetch_flows(self):
        """
        fetch_flowsのテスト
        複数取得できているかのテスト
        """

        unlink_path = []
        with app.app_context():
            # まず親プロジェクトを作る
            email = 'dev@kskp.io'
            name = '開発者'
            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # そこからプロジェクトのIDを取得する
            project_id = model.get_project_id_by_uuid(project_uuid)

            # テスト用フローを作成する
            new_flow_name1 = 'ふろー取得てすと1'
            data_source_name1 = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': new_flow_name1, 'datasource': None}
            created_flow1 = model.create_flow(data, session['user_id'], data_source_name1)

            new_flow_name2 = 'ふろー取得てすと2'
            data_source_name2 = str(uuid.uuid4())
            data2 = {'project_uuid': project_uuid, 'name': new_flow_name2, 'datasource': None}
            created_flow2 = model.create_flow(data2, session['user_id'], data_source_name2)

            flow1 = model.fetch_flow_by_uuid(data_source_name1)
            unlink_path.append(model.get_flow_path_by_uuid(data_source_name1))
            flow2 = model.fetch_flow_by_uuid(data_source_name2)
            unlink_path.append(model.get_flow_path_by_uuid(data_source_name2))

            flows_list = model.fetch_flows_by_project_uuid(project_uuid)

        # 中身の確認
        self.assertEqual({flow1['projectId'], flow2['projectId']}, {project_id, project_id})
        self.assertEqual({flow1['label'], flow2['label']}, {new_flow_name1, new_flow_name2})

        # 後片付け
        for path in unlink_path:
            path.unlink()


    def test_delete_flow(self):
        with app.app_context():
            # まず親プロジェクトを作る
            email = 'dev@kskp.io'
            name = '開発者'
            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            data_source_name = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': 'フローテスト用', 'datasource': None}
            flow = model.create_flow(data, session['user_id'], data_source_name)
            model.delete_flow_by_uuid(data_source_name)

    def test_update_flow(self):
        with app.app_context():
            # まず親プロジェクトを作る
            email = 'dev@kskp.io'
            name = '開発者'
            project_name = 'テストプロジェクト'

            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            data_source_name = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': 'フローテスト用', 'datasource': None}
            flow = model.create_flow(data, session['user_id'], data_source_name)

            model.update_flow_by_uuid(data_source_name, {'a': 1})
            path = model.make_flow_path(data_source_name)

            # 改めてファイルから読み直す
            result = json.loads(path.read_text(encoding='utf-8'))

            # 後片付け
            path.unlink()

            self.assertEqual(path.stem, data_source_name)
            self.assertEqual(result['a'], 1)

    def test_get_root(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # 作成したルートフォルダを取得する
            root = model.get_root()
            # 作成したフォルダと取得したフォルダが同じことを検証する
            self.assertEqual(root.to_json(), new_folder.to_json())
            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_folder.uuid)

    def test_get_children(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # ルートフォルダの子フォルダを作成する
            new_child_folder = Folder(str(uuid.uuid4())
                                    , new_folder.uuid
                                    , '子フォルダ🌱'
                                    , creator=2)  
            model.set_folder2(new_child_folder)
            # get_children()で作成した子フォルダを取得する
            child = new_folder.get_children()[0]
            # 作成した子フォルダと取得した子フォルダが同じことを検証する
            self.assertEqual(child.to_json(), new_child_folder.to_json())
            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_child_folder.uuid)
            model.del_folder2(new_folder.uuid)

    def test_get_folder_path(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # ルートフォルダの子フォルダを作成する
            new_child_folder = Folder(str(uuid.uuid4())
                                    , new_folder.uuid
                                    , '子フォルダ🌱'
                                    , creator=2)  
            model.set_folder2(new_child_folder)
            # ルートフォルダのフォルダパスリストを取得する
            folder_list = new_folder.get_folder_path()
            # 取得したフォルダパスリストが正しいことを検証する
            self.assertEqual(len(folder_list), 1)
            self.assertEqual(folder_list[0]['label'], 'ルートフォルダ🌲')
            # 子フォルダのフォルダパスリストを取得する
            child_folder_list = new_child_folder.get_folder_path()
            self.assertEqual(len(child_folder_list), 2)
            self.assertEqual(child_folder_list[0]['label'], 'ルートフォルダ🌲')
            self.assertEqual(child_folder_list[1]['label'], '子フォルダ🌱')
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_child_folder.uuid)
            model.del_folder2(new_folder.uuid)

    def test_get_folder2(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # 作成したルートフォルダを取得する
            root = model.get_folder2(new_folder.uuid)
            # 作成したフォルダと取得したフォルダが同じことを検証する
            self.assertEqual(root.to_json(), new_folder.to_json())
            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_folder.uuid)

    def test_upd_folder2(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # 作成したルートフォルダを修正する
            new_folder.label = 'ルートフォルダー🌳'
            model.upd_folder2(new_folder)
            # 作成したフォルダと取得したフォルダが同じことを検証する
            self.assertEqual(new_folder.label, 'ルートフォルダー🌳')
            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_folder.uuid)

    def test_del_folder2(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # 作成したルートフォルダを削除する
            model.del_folder2(new_folder.uuid)
            # 削除したルートフォルダの取得を試みる
            root = model.get_folder2(new_folder.uuid)
            # 作成したフォルダが削除されたことを検証する
            self.assertEqual(root, None)
            # 作成したディレクトリが削除されていることを検証する
            self.assertTrue(os.path.isdir('kskp/data'))
            self.assertFalse(os.path.isdir('kskp/data/library'))
        finally:
            pass

    def test_get_frame2(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # フレームを格納する
            new_frame = Frame(str(uuid.uuid4())
                            , new_folder.uuid
                            , 'フレームファイルです'
                            , io.BytesIO(b"xxxxxxxxx")
                            , creator=1)
            model.set_file2(new_frame)
            # 作成したフレームを取得する
            frame = model.get_file2(new_frame.uuid)
            # 作成したフレームと取得したフレームが同じことを検証する
            self.assertEqual(frame.to_json(), new_frame.to_json())
            # 作成したフレームに対応するファイルが存在することを検証する
            self.assertTrue(os.path.isfile('kskp/data/library/フレームファイルです'))
        finally:
            # 作成したフォルダを全て削除する
            frame.close()
            new_frame.close()
            model.del_file2(new_frame.uuid)
            model.del_folder2(new_folder.uuid)

    def test_upd_frame2(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # フレームを格納する
            new_frame = Frame(str(uuid.uuid4())
                            , new_folder.uuid
                            , '步レー敄ファ禕ル.csv'
                            , io.BytesIO(b"abcdefghijklmnopqrstu")
                            , creator=1)
            model.set_file2(new_frame)
            # 作成したフレームを修正する
            new_frame.label = 'FRAME・FILE'
            model.upd_file2(new_frame)
            # 作成したフレームと取得したフレームが同じことを検証する
            self.assertEqual(new_frame.label, 'FRAME・FILE')
        finally:
            # 作成したフォルダを全て削除する
            model.del_file2(new_frame.uuid)
            model.del_folder2(new_folder.uuid)

    def test_del_frame2(self):
        try:
            # ルートフォルダを作成する
            new_folder = Folder(str(uuid.uuid4())
                                , None
                                , 'ルートフォルダ🌲'
                                , creator=1)
            model.set_folder2(new_folder)
            # フレームを格納する
            new_frame = Frame(str(uuid.uuid4())
                            , new_folder.uuid
                            , 'フレームファイルです🧓🏿'
                            , io.BytesIO(b"1234567890")
                            , creator=1)
            model.set_file2(new_frame)
            # 作成したフレームを削除する
            model.del_file2(new_frame.uuid)
            # 削除したフレームの取得を試みる
            frame = model.get_file2(new_folder.uuid)
            # 作成したフレームが削除されたことを検証する
            self.assertEqual(frame, None)
            # 作成したファイルがが物理削除されていることを検証する
            self.assertFalse(os.path.exists('kskp/data/library/フレームファイルです🧓🏿'))
        finally:
            # 作成したフォルダを全て削除する
            new_frame.close()
            model.del_folder2(new_folder.uuid)

    def test_get_remote_folder(self):
        try:
            # ルートフォルダを作成する
            new_remote_folder = RemoteFolder(str(uuid.uuid4())
                                            , None
                                            , 'ルートフォルダ🌲'
                                            , 'ksk-ds'
                                            , 'kskanalytics'
                                            , 'kskds-HP-Workstation-z620.local'
                                            , 139
                                            , 'WORKGROUP'
                                            , 'share'
                                            , creator=1)
            model.set_folder2(new_remote_folder)
            # 作成したルートフォルダを取得する
            root = model.get_folder2(new_remote_folder.uuid)
            # 作成したフォルダと取得したフォルダが同じことを検証する
            self.assertEqual(root.to_json(), new_remote_folder.to_json())
            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_remote_folder.uuid)

    def test_upd_remote_folder(self):
        try:
            # ルートフォルダを作成する
            new_remote_folder = RemoteFolder(str(uuid.uuid4())
                                            , None
                                            , 'ルートフォルダ🌲'
                                            , 'ksk-ds'
                                            , 'kskanalytics'
                                            , 'kskds-HP-Workstation-z620.local'
                                            , 139
                                            , 'WORKGROUP'
                                            , 'share'
                                            , creator=1)
            model.set_folder2(new_remote_folder)
            # 作成したルートフォルダを修正する
            new_remote_folder.label = 'ルートフォルダー🌳'
            model.upd_folder2(new_remote_folder)
            # 作成したフォルダと取得したフォルダが同じことを検証する
            self.assertEqual(new_remote_folder.label, 'ルートフォルダー🌳')
            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_remote_folder.uuid)

    def test_remote_get_children(self):
        try:
            # ルートフォルダを作成する
            new_remote_folder = RemoteFolder(str(uuid.uuid4())
                                            , None
                                            , 'ルートフォルダ🌲'
                                            , 'ksk-ds'
                                            , 'kskanalytics'
                                            , 'kskds-HP-Workstation-z620.local'
                                            , 139
                                            , 'WORKGROUP'
                                            , 'share'
                                            , creator=1)
            model.set_folder2(new_remote_folder)
            # ルートフォルダの子フォルダを作成する
            new_child_folder = Folder(str(uuid.uuid4())
                                    , new_remote_folder.uuid
                                    , '子フォルダ🌱'
                                    , creator=2)  
            model.set_folder2(new_child_folder)
            # get_children()で作成した子フォルダを取得する
            child = new_remote_folder.get_children()[0]
            # 作成した子フォルダと取得した子フォルダが同じことを検証する
            # self.assertIn(child.to_json(), new_child_folder.to_json())
            assertTrue = False
            for child in new_remote_folder.get_children():
                if child.to_json() == new_child_folder.to_json():
                    assertTrue = True
            self.assertTrue(assertTrue)

            # 作成したフォルダに対応するディレクトリが存在することを検証する
            self.assertTrue(os.path.isdir('kskp/data/library'))
        finally:
            # 作成したフォルダを全て削除する
            model.del_folder2(new_child_folder.uuid)
            model.del_folder2(new_remote_folder.uuid)

    # crate_flow内に定義されているデコレータのテスト
    # とりあえず作ったが、関数内関数は外部から呼び出せないのでテストできなく、置き場所に困ったので
    # ここにひとまず置いておく。ヘルパーメソッド作ればできそうだけど、また時間がある時でいいかな？
    # def test_add_activity_to_flow(self):
    #     '''
    #     フロー作成時の履歴付与のテスト
    #     '''
    #     mock_func = mock.MagicMock()
    #     mock_func.__name__ = 'activity'
    #     mock_func.return_value = {
    #         'projectId': 1,
    #         'label': 'test',
    #         'ports': [[],[]],
    #         'params': []
    #     }
    #
    #     now = datetime.now()
    #     email = 'dev@kskp.io'
    #     name = '開発者'
    #
    #     with app.app_context():
    #         with self.client.session_transaction() as session:
    #             model.create_user(email, '', name, '')
    #             session['user_id'] = model.get_user_id_by_email(email)['id']
    #
    #         # mockでデコレータをテストする(フローに作成履歴が付与される)
    #         unfinished_deco = add_activity_to_flow(session['user_id'])
    #         wrapper = unfinished_deco(mock_func)
    #         result = wrapper()
    #         JST = timezone(timedelta(hours=+9), 'JST')
    #         createdAt = datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S')
    #
    #         self.assertEqual(result['projectId'], 1)
    #         self.assertEqual(result['label'], 'test')
    #         self.assertEqual(result['creator'], '開発者')
    #         self.assertEqual(result['createdAt'], createdAt)
    #
    #
    # def test_data_source_to_flow(self):
    #     '''
    #     フロー作成時のデータソース付与のテスト
    #     '''
    #
    #     mock_func = mock.MagicMock()
    #     mock_func.__name__ = 'activity'
    #     mock_func.return_value = {
    #         'projectId': 1,
    #         'label': 'test',
    #         'ports': [[],[]],
    #         'params': []
    #     }
    #
    #     now = datetime.now()
    #     email = 'dev@kskp.io'
    #     name = '開発者'
    #
    #     with app.app_context():
    #         with self.client.session_transaction() as session:
    #             model.create_user(email, '', name, '')
    #             session['user_id'] = model.get_user_id_by_email(email)['id']
    #
    #         # mockでデコレータをテストする(フローにframeを追加する)
    #         frame_uuid = str(uuid.uuid4())
    #         data_source = {'uuid': frame_uuid, 'type': 'frame', 'label': 'test'}
    #         unfinished_deco = add_data_source_to_flow(data_source)
    #         wrapper = unfinished_deco(mock_func)
    #         result = wrapper()
    #
    #         self.assertEqual(result['projectId'], 1)
    #         self.assertEqual(result['label'], 'test')
    #         self.assertEqual(result['nodes'][0]['label'], 'test')
    #         self.assertEqual(result['nodes'][0]['type'], 'frame')
    #         self.assertEqual(result['nodes'][0]['uuid'], frame_uuid)

if __name__ == '__main__':
    unittest.main()
