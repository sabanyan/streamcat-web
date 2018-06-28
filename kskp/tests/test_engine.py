import unittest

from .. import engine as e
from ..engine.core import Parameter

class EngineTestCase(unittest.TestCase):

    def test_parameter_required(self):
        """
        Parameterクラスの必須項目のテスト
        """
        with self.assertRaises(Exception):
            Parameter(None)

        with self.assertRaises(Exception):
            Parameter('')

    def test_parameter_basic(self):
        """
        基本的な使い方ができるかどうか
        """

        # captionなしだとnameと同じになる
        param_name = 'f'
        p1 = Parameter(param_name)
        self.assertEqual(p1.name, param_name)
        self.assertEqual(p1.caption, param_name)

        # captionあり
        param_caption = '項目名'
        p2 = Parameter(param_name, param_caption)
        self.assertEqual(p2.name, param_name)
        self.assertEqual(p2.caption, param_caption)

    @unittest.skip
    def test_minimum_flow(self):
        """
        最小限のフローのテスト
        stepが1つ
        """
        flow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'
        with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
            e.execute(flow_uuid, f.read(), frame_path='kskp/data/frames')

    @unittest.skip
    def test_minimum_piping_flow(self):
        """
        パイプを使う最小限のフローのテスト
        stepが2つ
        """

        flow_uuid = '70218468-417E-458B-B820-A17C55D04AF9'
        with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
            e.execute(flow_uuid, f.read(), frame_path='kskp/data/frames')

    @unittest.skip
    def test_minimum_nested_flow(self):
        """
        nested flowのテスト
        """

        flow_uuid = '3E4899CC-3296-4490-8C3F-3D9C6E857E14'
        with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
            e.execute(flow_uuid, f.read(), frame_path='kskp/data/frames')

    @unittest.skip
    def test_single_frame_flow_executing(self):
        frame = {
            'a': [1, 2, 3],
            'b': [10, 20, 30],
            'c': [100, 200, 300]
        }
        flow = make_single_frame_flow()
        result = flow.execute()
        f = result.stdout.write()

        for k in frame.keys():
            self.assertListEqual(f[k], frame[k])

    def make_single_frame_flow(self):
        pass
