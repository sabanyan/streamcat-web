import unittest

class EngineTestCase(unittest.TestCase):
    
    @unittest.skip
    def test_minimum_flow(self):
        """
        最小限のフローのテスト
        stepが1つ
        """
        from .. import engine as e
        flow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'
        with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
            e.execute(flow_uuid, f.read())

    def test_minimum_piping_flow(self):
        """
        パイプを使う最小限のフローのテスト
        stepが2つ
        """
        from .. import engine as e
        flow_uuid = '70218468-417E-458B-B820-A17C55D04AF9'
        with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
            e.execute(flow_uuid, f.read())

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
