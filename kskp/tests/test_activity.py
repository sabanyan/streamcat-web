import os
import unittest
import json
import uuid
import tempfile
import kskp.model as model
from pathlib import Path
from ..activity import (
    make_unfinished_history,
    make_finished_history
)
from datetime import datetime, timedelta, timezone
from unittest import mock
from kskp import app

class ActivityTest(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.testing = True
        self.client = app.test_client()
        with app.app_context():
            model.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

    def test_make_unfinished_history(self):
        '''
        実行履歴作成のテスト
        作成される履歴は実行中のもの
        '''
        mock_func = mock.MagicMock()
        mock_func.__name__ = 'unfinished'

        now = datetime.now()

        email = 'dev@kskp.io'
        name = '開発者'
        project_name = 'テストプロジェクト'

        with app.app_context():
            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # 実行履歴を作成するためのフローを作成
            new_flow_name = 'ふろー取得てすと'
            data_source_name = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': new_flow_name, 'datasource': None}
            created_flow = model.create_flow(data, session['user_id'], data_source_name)

            # mockでデコレータをテストする（実行履歴が作成される）
            unfinished_deco = make_unfinished_history(now, session)
            wrapper = unfinished_deco(mock_func)
            wrapper(data_source_name)

            # 作成されたファイルパス
            flow_path = model.make_flow_path(data_source_name)
            jobs_path =  Path(app.root_path + '/data/jobs').joinpath('{0:%Y%m%d%H%M%S%f}'.format(now) + '.json')

            result = json.loads(jobs_path.read_text(encoding='utf-8'))

            self.assertEqual(result['state'], '実行中')
            self.assertEqual(result['executor']['name'], '開発者')
            self.assertEqual(result['flow']['uuid'], data_source_name)
            self.assertEqual(result['projectId'], model.get_project_id_by_uuid(project_uuid))

            # 後片付け
            flow_path.unlink()
            jobs_path.unlink()

    def test_make_finished_history(self):
        '''
        実行履歴作成のテスト
        作成される履歴は実行完了のもの
        '''

        mock_func = mock.MagicMock()
        mock_func.__name__ = 'unfinished'

        mock_func_finished = mock.MagicMock()
        mock_func_finished.__name__ = 'finished'

        now = datetime.now()

        email = 'dev@kskp.io'
        name = '開発者'
        project_name = 'テストプロジェクト'

        with app.app_context():
            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)['id']
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # 実行履歴を作成するためのフローを作成
            new_flow_name = 'ふろー取得てすと'
            data_source_name = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': new_flow_name, 'datasource': None}
            created_flow = model.create_flow(data, session['user_id'], data_source_name)

            # 実行履歴を作成する
            unfinished_deco = make_unfinished_history(now, session)
            wrapper = unfinished_deco(mock_func)
            wrapper(data_source_name)

            # 実行履歴を更新
            # dataは更新していなくて、data作成中にFrameオブジェクトが使われているのでどうしようか考え中
            finished_deco = make_finished_history(now)
            wrapper2 = finished_deco(mock_func_finished)
            wrapper2(data_source_name)

            # 作成されたファイルパス
            flow_path = model.make_flow_path(data_source_name)
            jobs_path =  Path(app.root_path + '/data/jobs').joinpath('{0:%Y%m%d%H%M%S%f}'.format(now) + '.json')

            result = json.loads(jobs_path.read_text(encoding='utf-8'))

            self.assertEqual(result['state'], '実行完了')
            self.assertEqual(result['executor']['name'], '開発者')
            self.assertEqual(result['flow']['uuid'], data_source_name)
            self.assertEqual(result['projectId'], model.get_project_id_by_uuid(project_uuid))

            # 後片付け
            flow_path.unlink()
            jobs_path.unlink()
