import os
import unittest
import json

from ..engine.core3 import parse

class EngineTestCase(unittest.TestCase):
    def execute(self, flow_uuid):
        job = parse(flow_uuid)
        job.execute()

        # print(list(job.lasts.values())[0].contents)
        job.dtor()

    def test(self):
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'
        flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        self.execute(flow_uuid)
