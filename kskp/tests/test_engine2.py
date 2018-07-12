import unittest

import os
import csv
import tempfile

from ..engine.data import *
from ..engine.core2 import Command, Flow, Step, Job
from ..engine.core2 import Mcut

class EngineTestCase(unittest.TestCase):
    def setUp(self):
        self.fd, self.tempfile_path = tempfile.mkstemp()
        original_data = [['a', 'b', 'c'], ['1', '2', '3'], ['4', '5', '6']]
        self.write_to_csv(self.tempfile_path, original_data)
        self.mcut = Mcut()

    def write_to_csv(self, path, object):
        """ 指定されたデータをファイルに書き出します """
        with open(path, 'w') as f:
            writer = csv.writer(f, lineterminator='\n')
            writer.writerows(object)

    def sample_input(self):
        frame_uuid = str(uuid.uuid4())
        path = Path(self.tempfile_path)
        source = PathFileSource('csv', path.parent.as_posix(), path.name)
        input = Frame(frame_uuid, source)
        return input

    def make_simple_flow(self):
        flow = Flow('uuid')
        flow.jobs['s0'] = Job(Step('command', self.mcut, {'f': 'a,b'}))

        flow.data['d0'] = self.sample_input()
        flow.data['out'] = None

        flow.edges['s0'] = ({'in': 'd0'}, {'out': 'out'})

        flow.i_ports = {}
        flow.o_ports = {'out': {'type': 'frame'}}

        return flow

    # @unittest.skip
    def test_sample_flow(self):
        """ 単純なフロー実行のテスト """
        job = Job(Step('flow', self.make_simple_flow(), {}))
        result = job.execute()
        result_dict = result['out'].contents

        self.assertEqual(result_dict['a'], ['1', '4'])
        self.assertEqual(result_dict['b'], ['2', '5'])

        job.dtor()

    def tearDown(self):
        os.close(self.fd)
        os.unlink(self.tempfile_path)
