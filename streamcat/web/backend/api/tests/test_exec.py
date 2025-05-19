import json
import unittest
import pprint
from pathlib import Path

from streamcat.web.backend import app
from .api_test_case_base import ApiTestCaseBase

@unittest.skip
class ExecuteTest(ApiTestCaseBase):
    def test_execute_flow(self):
        """
        フローの実行結果がライブラリに登録されることを検証する
        """
        input_frame_uuid = 'aca1c51f-ee97-43ca-bc6e-cd151220c518'
        input_frame_uuid2 = '1ac6c925-391c-40cf-97fb-54ce59a1a151'
        subflow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'


        from streamcat.web.backend.api.library import get_library

        # ルートストアフォルダを取得する(無ければ作成する)
        root = get_library(self.USER1)

        # 入力フレームをライブラリに登録する
        self.save_frame_to_library(input_frame_uuid, 'streamcat/tests/frames/test_frame1.csv')
        self.save_frame_to_library(input_frame_uuid2, 'streamcat/tests/frames/test_frame2.csv')

        # テスト用フローをライブラリに保存する
        from streamcat.store import Flow
        # フローJSONファイルからフローデータを取得する
        flow_path = Path(app.root_path) / 'api/tests/flows/168d23c2-f835-4392-ba0e-76e94a08b719.json'
        flow_data = json.loads(flow_path.read_text(encoding='utf-8'))
        # フローオブジェクトを作成する
        test_flow = root.create_flow('テストフロー', flow_data)
        # フローをライブラリに保存する
        test_flow.save()

        if not self.finder.data.exists(subflow_uuid):
            # テスト用フローから呼ばれるサブフローをライブラリに保存する
            subflow_path = Path(app.root_path) / 'api/tests/flows/833fdb62-2bb6-4a77-a0e1-77941ad951a3.json'
            subflow_data = json.loads(subflow_path.read_text(encoding='utf-8'))
            # サブフローオブジェクトを作成する
            test_subflow = root.create_flow('テストサブフロー', subflow_data)
            # サブフローをライブラリに保存する
            test_subflow.uuid = subflow_uuid
            test_subflow.save()

        # 実行
        result = self.get_uri('/api/v0/frames?from=%s' % test_flow.uuid, self.USER1)

        # 出力結果がライブラリに登録されることを検証する
        frame_uuid_d1 = result['name'][0]['uuid']
        frame_uuid_d3 = result['name'][1]['uuid']
        self.assertTrue(self.finder.data.exists(frame_uuid_d1))
        self.assertTrue(self.finder.data.exists(frame_uuid_d3))
        
        # 削除
        # このテストで作成したjobsだけ削除する
        from .test_api import ExecApiTestCase
        apiTestCase = ExecApiTestCase("test_execute_flow")
        apiTestCase.remove_job_file_and_frame(test_flow.uuid)
        # フレームを削除する -> sqlalchemy.orm.exc.DetachedInstanceErrorがでてしまう
        # input_frame.delete()
        # サブフローを削除する -> sqlalchemy.orm.exc.DetachedInstanceErrorがでてしまう
        # test_subflow.delete()
        # フローを削除する
        test_flow.delete()

    def test_execute_flow_using_frame_on_s3(self):
        pass
