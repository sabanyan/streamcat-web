import unittest
import json
from ..activity import (
    make_unfinished_histroy,
    make_finished_histroy
)
from datetime import datetime, timedelta, timezone
from unittest import mock

class ActivityTest(unittest.TestCase):
    def setup(self):
        pass

    def tearDown(self):
        pass

    def test_make_unfinished_history(self):

        flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'
        user_name = 'ユーザ太郎'

        file_path = make_unfinished_histroy(flow_uuid, user_name)
        data = json.loads(file_path.read_text(encoding='utf-8'))

        self.assertEqual(data['flow']['uuid'], flow_uuid)
        self.assertEqual(data['executor']['name'], user_name)
        self.assertEqual(data['state'], '実行中')

        # 後片付け
        file_path.unlink()

    def test_make_finished_history(self):

        # 実行完了前ファイルの作成
        flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'
        user_name = 'ユーザ太郎'
        file_path = make_unfinished_histroy(flow_uuid, user_name)

        # jobの実行結果モックの作成
        frame_o_section = mock.MagicMock(uuid = 'section')
        frame_o_all = mock.MagicMock(uuid = 'all')
        job_lasts = {'o_section':frame_o_section, 'o_all':frame_o_all}

        # 更新前の中身をテスト
        before_execute_data = json.loads(file_path.read_text(encoding='utf-8'))
        self.assertEqual([data for data in before_execute_data['data'].keys()], [])

        # 実行履歴ファイルの更新
        make_finished_histroy(flow_uuid, file_path, job_lasts)

        # 更新後の中身をテスト
        executed_data = json.loads(file_path.read_text(encoding='utf-8'))
        self.assertEqual([data for data in executed_data['data'].keys()], [key for key in job_lasts.keys()])
        self.assertEqual(executed_data['data']['o_section']['uuid'], frame_o_section.uuid)
        self.assertEqual(executed_data['data']['o_all']['uuid'], frame_o_all.uuid)
        self.assertEqual(executed_data['state'], '実行完了')

        # 後片付け
        file_path.unlink()
