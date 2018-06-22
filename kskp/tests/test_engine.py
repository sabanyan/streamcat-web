import unittest

class EngineTestCase(unittest.TestCase):
    def test_first(self):
        from .. import engine as e
        flow_uuid = '833fdb62-2bb6-4a77-a0e1-77941ad951a3'
        f = open(f'kskp/data/flows/{flow_uuid}.json', 'r')
        e.execute(flow_uuid, f.read())
        f.close()

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
