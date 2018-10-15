import os
import unittest
import json
import uuid
import tempfile
import kskp.model as model
from pathlib import Path
from ..activity import (
    make_unfinished_history,
    make_finished_history,
    add_activity_to_flow,
    add_data_source_to_flow
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
                session['user_id'] = model.get_user_id_by_email(email)
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
            execute_flow = unfinished_deco(mock_func)
            execute_flow(data_source_name)

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
                session['user_id'] = model.get_user_id_by_email(email)
                model.create_project(project_name, session)

            # 今作ったプロジェクトのUUIDを取得する
            project_uuid = model.get_all_projects()[0]['uuid']

            # 実行履歴を作成するためのフローを作成
            new_flow_name = 'ふろー取得てすと'
            data_source_name = str(uuid.uuid4())
            data = {'project_uuid': project_uuid, 'name': new_flow_name, 'datasource': None}
            # data.update(node_sample)
            created_flow = model.create_flow(data, session['user_id'], data_source_name)
            # 実行履歴を作成する
            unfinished_deco = make_unfinished_history(now, session)
            execute_flow = unfinished_deco(mock_func)
            execute_flow(data_source_name)
            # 実行履歴を更新
            # dataは更新していなくて、data作成中にFrameオブジェクトが使われているのでどうしようか考え中
            finished_deco = make_finished_history(now)
            execute_flow2 = finished_deco(mock_func_finished)
            execute_flow2(data_source_name)

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

    def test_add_activity_to_flow(self):
        '''
        フロー作成時の履歴付与のテスト
        '''

        mock_func = mock.MagicMock()
        mock_func.__name__ = 'activity'
        mock_func.return_value = {
            'projectId': 1,
            'label': 'test',
            'ports': [[],[]],
            'params': []
        }

        now = datetime.now()
        email = 'dev@kskp.io'
        name = '開発者'

        with app.app_context():
            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)

            # mockでデコレータをテストする(フローに作成履歴が付与される)
            unfinished_deco = add_activity_to_flow(session['user_id'])
            wrapper = unfinished_deco(mock_func)
            result = wrapper()

            createdAt = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second,
                                        tzinfo=timezone(timedelta(hours=+9))).isoformat()

            self.assertEqual(result['projectId'], 1)
            self.assertEqual(result['label'], 'test')
            self.assertEqual(result['creator'], '開発者')
            self.assertEqual(result['createdAt'], createdAt)


    def test_data_source_to_flow(self):
        '''
        フロー作成時のデータソース付与のテスト
        '''

        mock_func = mock.MagicMock()
        mock_func.__name__ = 'activity'
        mock_func.return_value = {
            'projectId': 1,
            'label': 'test',
            'ports': [[],[]],
            'params': []
        }

        now = datetime.now()
        email = 'dev@kskp.io'
        name = '開発者'

        with app.app_context():
            with self.client.session_transaction() as session:
                model.create_user(email, '', name, '')
                session['user_id'] = model.get_user_id_by_email(email)

            # mockでデコレータをテストする(フローにframeを追加する)
            frame_uuid = str(uuid.uuid4())
            data_source = {'uuid': frame_uuid, 'type': 'frame', 'label': 'test'}
            unfinished_deco = add_data_source_to_flow(data_source)
            wrapper = unfinished_deco(mock_func)
            result = wrapper()

            self.assertEqual(result['projectId'], 1)
            self.assertEqual(result['label'], 'test')
            self.assertEqual(result['nodes'][0]['label'], 'test')
            self.assertEqual(result['nodes'][0]['type'], 'frame')
            self.assertEqual(result['nodes'][0]['uuid'], frame_uuid)

#------------------------------------ written by ryo tsutsui
    # import copy
    # def test_file_maker(self):
    #     '''
    #     テスト用ファイルの作成
    #     '''
    #     jobs_root = app.root_path + '/data/jobs/'
    #     jobs_path = Path(jobs_root)

    #     json_template = {
    #         "executedAt": "",
    #         "executor": {
    #             "name": ""
    #         },
    #         "inputs": {},
    #         "params": {},
    #         "flow": {
    #             "uuid": ""
    #         },
    #         "projectId": None,
    #         "data": {
    #             "d1": {
    #                 "type": "frame",
    #                 "uuid": "",
    #                 "label": ""
    #             }
    #         },
    #         "errors": {}
    #     }

    #     self.jobs_path.mkdir(parents=True, exist_ok=True)
    #     with app.app_context():
    #         (user1, project_id, project_uuid) = setUpProject(self)

    #     for x in range(0, 3):
    #         with open (str(self.jobs_path) + '/test' + str(x + 1) + '.json', 'w') as f:
    #             sample = copy.deepcopy(self.json_template)
    #             sample['executedAt'] = '1970-01-01T00:00:0' + str(x) + '09:00'
    #             sample['executor']['name'] = 'ユーザー 太郎'
    #             sample['flow']['uuid'] = '2d0b1baf-3df4-41fe-b1e0-c2d51f3b2383'
    #             sample['data']['d1']['uuid'] = '99999999999' + str(x)
    #             sample['data']['d1']['label'] = str(x)
    #             sample['projectId'] = project_id
    #             json.dump(sample, f, ensure_ascii=False, indent=4)
