import os
import unittest
import json
from pathlib import Path

from kskp.engine.core3 import parse

class EngineTestCase(unittest.TestCase):
    def execute(self, flow_uuid, step_paths=None):
        job = parse(flow_uuid)
        job.execute(step_paths=step_paths)

        # print(list(job.lasts.values())[0].contents)
        job.dtor()

    # @unittest.skip
    def test_simple(self):
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'
        flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        self.execute(flow_uuid)

    def test_step_paths(self):
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'
        flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        self.execute(flow_uuid, 'Bi')

    @unittest.skip
    def test_ni(self):
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'
        flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'
        self.execute(flow_uuid)


if __name__ == '__main__':
    # パフォーマンステスト時に使ったコード
    runner = unittest.TextTestRunner()
    suite = unittest.TestSuite()
    suite.addTest(NIJapanSampleTestCase('test'))
    runner.run(suite)
