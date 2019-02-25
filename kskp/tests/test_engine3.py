import os
import unittest
import json
from pathlib import Path

from kskp.engine.core3 import parse

class EngineTestCase(unittest.TestCase):
    def execute(self, flow_uuid, step_paths=None):
        os.environ['KENG_FLOWS_PATH'] = 'kskp/data/flows'
        os.environ['KENG_FRAMES_PATH'] = 'kskp/data/frames'
        job = parse(flow_uuid)
        job.execute(step_paths=step_paths)
        job.dtor()

    @unittest.skip
    def test_simple(self):
        self.execute('27C35909-504E-43F2-A115-DADB6F57D38C')

    @unittest.skip
    def test_step_paths(self):
        self.execute('27C35909-504E-43F2-A115-DADB6F57D38C', 'Bt')

    @unittest.skip
    def test_ni(self):
        self.execute('2C096E39-28BD-491B-B0E2-7ECFFD113304')

    # @unittest.skip
    def test_ni(self):
        self.execute('japan_ni_improvement0')

    @unittest.skip
    def test_pandas(self):
        self.execute('BCA335C6-675C-49E2-A8B4-5E655CB46256')

    @unittest.skip
    def test_kcmd(self):
        self.execute('ACA335C6-675C-49E2-A8B4-5E655CB46254')

    @unittest.skip
    def test_nysol(self):
        self.execute('A70ECCC4-5304-4C20-A212-EC069A3289E1')

if __name__ == '__main__':
    # パフォーマンステスト時に使ったコード
    runner = unittest.TextTestRunner()
    suite = unittest.TestSuite()
    suite.addTest(NIJapanSampleTestCase('test'))
    runner.run(suite)
