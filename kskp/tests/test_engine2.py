import unittest

import os
import csv
import tempfile

# from ..engine.data import *
# from ..engine.core2 import Command, Flow, Step, Job
# from ..engine.core2 import Mcut
from kskp.engine.data import *
from kskp.engine.core2 import Command, Flow, Step, Job, Port
from kskp.engine.core2 import Mcut, Msetstr, Msum, Mavg, Mstats, Mbucket, Mtee, Mjoin, Mcat, Mselstr

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
        flow.jobs['s1'] = Job(Step('command', self.mcut, {'f': 'a'}))

        flow.data['d0'] = self.sample_input()
        flow.data['d1'] = None
        flow.data['out'] = None

        flow.edges['s0'] = ({'in': 'd0'}, {'out': 'd1'})
        flow.edges['s1'] = ({'in': 'd1'}, {'out': 'out'})

        flow.i_ports = {}
        flow.o_ports = {'out': {'type': 'frame'}}

        return flow

    # @unittest.skip
    def test_sample_flow(self):
        """ 単純なフロー実行のテスト """
        job = Job(Step('flow', self.make_simple_flow(), {}))
        result = job.execute()
        print(result['out'].contents)
        job.dtor()

    def tearDown(self):
        os.close(self.fd)
        os.unlink(self.tempfile_path)

class NIJapanSampleTestCase(unittest.TestCase):
    """ 日本NI様サンプルテスト """

    def setUp(self):
        os.environ['KENG_FRAMES_PATH'] = 'kskp/data/frames'

        self.mcut = Mcut()
        self.mjoin = Mjoin()
        self.mstats = Mstats()
        self.mavg = Mavg()
        self.mselstr = Mselstr()
        self.msetstr = Msetstr()
        self.mbucket = Mbucket()
        self.mcat = Mcat()

    @profile
    def set_data(self, flow, key, data, srcs, dsts):
        """ syntax sugar用 """
        # print(dsts)
        flow.data[key] = data
        for src in srcs:
            # srcはjobから見るとdst
            # job_id, port = tuple(src.split('.'))
            flow.dst_edges[src] = key

        for dst in dsts:
            # dstはjobから見るとsrc
            # job_id, port = tuple(dst.split('.'))
            flow.src_edges[dst] = key

        # flow.edges[key] = { 'srcs': srcs, 'dsts': dsts }

    def set_empty_data(self, flow, key, srcs, dsts):
        """ syntax sugar、中間ファイル用 """
        # self.set_data(flow, key, Frame(), srcs, dsts)
        self.set_data(flow, key, None, srcs, dsts)

    def set_temp_data(self, flow, key, srcs, dsts):
        """ syntax sugar、中間ファイルを消す用 """
        self.set_data(flow, key, Frame(None, TempPathFileSource('csv')), srcs, dsts)

    def set_signature(self, flow, input_data_keys, output_data_keys):
        for key in input_data_keys:
            flow.i_ports[key] = {'type': 'frame'}

        for key in output_data_keys:
            flow.o_ports[key] = {'type': 'frame'}

    def set_command_step(self, flow, key, command, args):
        flow.jobs[key] = Job(Step('command', command, args))

    @profile
    def set_flow_step(self, flow, key, subflow, args):
        flow.jobs[key] = Job(Step('flow', subflow, args))

    @profile
    def make_section_flow(self):
        flow = Flow('section')
        self.set_command_step(flow, 's0', self.mselstr, {'f': 'Section', 'v': '@[v]'})
        self.set_flow_step(flow, 'sstatsall', self.stats_by_4_sensors(), {})
        self.set_command_step(flow, 's_msetstr1',  self.msetstr, {'v': '@[v]', 'a': 'section'})
        self.set_command_step(flow, 's_msetstr2',  self.msetstr, {'v': '@[pattern]', 'a': 'pattern'})

        self.set_empty_data(flow, 'in', [], ['s0.in'])
        self.set_empty_data(flow, 'd0', ['s0.out'], ['sstatsall.in'])
        self.set_empty_data(flow, 'd1', ['sstatsall.out'], ['s_msetstr1.in'])
        self.set_empty_data(flow, 'd2', ['s_msetstr1.out'], ['s_msetstr2.in'])
        self.set_empty_data(flow, 'out', ['s_msetstr2.out'], [])

        self.set_signature(flow, ['in'], ['out'])

        return flow

    @profile
    def make_stats_all_flow(self):
        """ 各列全体についての統計量を求める """
        flow = Flow('stats_all')
        self.set_command_step(flow, 's0', self.mavg, {'f': '@[sensor_name]:@[sensor_name]_avg'})
        self.set_command_step(flow, 's1', self.mcut, {'f': 'Time,@[sensor_name]_avg'})

        self.set_command_step(flow, 's2', self.mstats, {'c': 'sd', 'f': '@[sensor_name]:@[sensor_name]_sd'})
        self.set_command_step(flow, 's3', self.mcut, {'f': 'Time,@[sensor_name]_sd'})

        self.set_command_step(flow, 's4', self.mstats, {'c': 'max', 'f': '@[sensor_name]:@[sensor_name]_max'})
        self.set_command_step(flow, 's5', self.mcut, {'f': 'Time,@[sensor_name]_max'})

        self.set_command_step(flow, 's6', self.mstats, {'c': 'min', 'f': '@[sensor_name]:@[sensor_name]_min'})
        self.set_command_step(flow, 's7', self.mcut, {'f': 'Time,@[sensor_name]_min'})

        self.set_command_step(flow, 'sjoin0', self.mjoin, {'k': 'Time'})
        self.set_command_step(flow, 'sjoin1', self.mjoin, {'k': 'Time'})
        self.set_command_step(flow, 'sjoin2', self.mjoin, {'k': 'Time'})

        self.set_empty_data(flow, 'in', [], ['s0.in', 's2.in', 's4.in', 's6.in'])
        self.set_empty_data(flow, 'd0', ['s0.out'], ['s1.in'])
        self.set_empty_data(flow, 'd1', ['s1.out'], ['sjoin0.i'])

        self.set_empty_data(flow, 'd2', ['s2.out'], ['s3.in'])
        self.set_empty_data(flow, 'd3', ['s3.out'], ['sjoin0.m'])

        self.set_empty_data(flow, 'd4', ['sjoin0.out'], ['sjoin1.i'])

        self.set_empty_data(flow, 'd5', ['s4.out'], ['s5.in'])
        self.set_empty_data(flow, 'd6', ['s5.out'], ['sjoin1.m'])

        self.set_empty_data(flow, 'd7', ['sjoin1.out'], ['sjoin2.i'])

        self.set_empty_data(flow, 'd8', ['s6.out'], ['s7.in'])
        self.set_empty_data(flow, 'd9', ['s7.out'], ['sjoin2.m'])

        self.set_empty_data(flow, 'out', ['sjoin2.out'], [])

        self.set_signature(flow, ['in'], ['out'])

        return flow

    @unittest.skip
    def test_stats_flow(self):
        flow = Flow('stats_flow')
        self.set_flow_step(flow, 'sstatsall', self.make_stats_all_flow(), {'sensor_name': '3H'})

        source1 = PathFileSource('csv', 'kskp/data/frames', 'wowow.csv')
        self.set_data(flow, 'd0', Frame('wowow', source1), [], ['sstatsall.in'])
        self.set_empty_data(flow, 'out', ['sstatsall.out'], [])
        self.set_signature(flow, [], ['out'])

        results = flow.execute()

        for res in results.values():
            for k, v in res.contents.items():
                print(f'{k}:', v[0])

        # flow.dtor()

    @profile
    def stats_by_4_sensors(self):
        """
        入力されたファイルの3H 3V 4H 4Vそれぞれについて、統計量を求めて返すサブフロー
        """
        flow = Flow('stats_by_4_sensors')
        stats_all_flow = self.make_stats_all_flow()
        self.set_flow_step(flow, 's3H', self.make_stats_all_flow(), {'sensor_name': '3H'})
        self.set_flow_step(flow, 's3V', self.make_stats_all_flow(), {'sensor_name': '3V'})
        self.set_flow_step(flow, 's4H', self.make_stats_all_flow(), {'sensor_name': '4H'})
        self.set_flow_step(flow, 's4V', self.make_stats_all_flow(), {'sensor_name': '4V'})

        self.set_command_step(flow, 'sjoin0', self.mjoin, {'k': 'Time'})
        self.set_command_step(flow, 'sjoin1', self.mjoin, {'k': 'Time'})
        self.set_command_step(flow, 'sjoin2', self.mjoin, {'k': 'Time'})

        self.set_empty_data(flow, 'in', [], ['s3H.in', 's3V.in', 's4H.in', 's4V.in'])

        self.set_empty_data(flow, 'd1', ['s3H.out'], ['sjoin0.i'])
        self.set_empty_data(flow, 'd2', ['s3V.out'], ['sjoin0.m'])
        self.set_empty_data(flow, 'd3', ['sjoin0.out'], ['sjoin1.i'])
        self.set_empty_data(flow, 'd4', ['s4H.out'], ['sjoin1.m'])
        self.set_empty_data(flow, 'd5', ['sjoin1.out'], ['sjoin2.i'])
        self.set_empty_data(flow, 'd6', ['s4V.out'], ['sjoin2.m'])

        self.set_empty_data(flow, 'out', ['sjoin2.out'], [])

        self.set_signature(flow, ['in'], ['out'])

        return flow

    @profile
    def make_splitting_flow(self):
        # execute_flow_by_uuid('A71D793C-AEFD-42DE-9BA4-56532EA47975')
        flow = Flow('ex')
        self.set_command_step(flow, 's0', self.mcut, { 'x': True, 'f': '@[f]' })
        self.set_command_step(flow, 's1', self.mbucket, {'rng': True, 'n': 10, 'f': 'Time:Section'})
        section_flow = self.make_section_flow()
        self.set_flow_step(flow, 's2', self.make_section_flow(), {'v': '1', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's3', self.make_section_flow(), {'v': '2', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's4', self.make_section_flow(), {'v': '3', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's5', self.make_section_flow(), {'v': '4', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's6', self.make_section_flow(), {'v': '5', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's7', self.make_section_flow(), {'v': '6', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's8', self.make_section_flow(), {'v': '7', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's9', self.make_section_flow(), {'v': '8', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's10', self.make_section_flow(), {'v': '9', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's11', self.make_section_flow(), {'v': '10', 'pattern': '@[pattern]'})

        self.set_flow_step(flow, 'sstatsall', self.stats_by_4_sensors(), {})

        self.set_command_step(flow, 's_mcat', self.mcat, {})

        self.set_empty_data(flow, 'in', [], ['s0.in']) # 置き換えられる
        self.set_empty_data(flow, 'd0', ['s0.out'], ['s1.in', 'sstatsall.in'])
        self.set_empty_data(flow, 'd8', ['s1.out'], ['s2.in', 's3.in', 's4.in', 's5.in', 's6.in', 's7.in', 's8.in', 's9.in', 's10.in', 's11.in'])

        self.set_empty_data(flow, 'd_mcat1', ['s2.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat2', ['s3.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat3', ['s4.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat4', ['s5.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat5', ['s6.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat6', ['s7.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat7', ['s8.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat8', ['s9.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat9', ['s10.out'], ['s_mcat.in'])
        self.set_empty_data(flow, 'd_mcat10', ['s11.out',], ['s_mcat.in'])

        self.set_empty_data(flow, 'out1', ['sstatsall.out'], [])
        self.set_empty_data(flow, 'out2', ['s_mcat.out'], [])

        self.set_signature(flow, ['in'], ['out1', 'out2'])

        return flow

    # @unittest.skip
    @profile
    def test(self):
        flow = Flow('parent')
        splitting_flow = self.make_splitting_flow()
        self.set_flow_step(flow, 's0', self.make_splitting_flow(), {'f': '0,1,2,3,4', 'pattern': '1'})
        self.set_flow_step(flow, 's1', self.make_splitting_flow(), {'f': '0,5,6,7,8', 'pattern': '2'})
        self.set_flow_step(flow, 's2', self.make_splitting_flow(), {'f': '0,9,10,11,12', 'pattern': '3'})
        self.set_flow_step(flow, 's3', self.make_splitting_flow(), {'f': '0,13,14,15,16', 'pattern': '4'})
        self.set_flow_step(flow, 's4', self.make_splitting_flow(), {'f': '0,17,18,19,20', 'pattern': '5'})

        frame_uuid = '2C72275F-2019-49AE-B36D-A29D1507F8DD'
        source1 = PathFileSource('csv', 'kskp/data/frames', frame_uuid + '.csv')
        self.set_data(flow, 'd0', Frame(frame_uuid, source1), [], ['s0.in', 's1.in', 's2.in', 's3.in', 's4.in'])

        self.set_command_step(flow, 's_mcat_all', self.mcat, {})
        self.set_command_step(flow, 's_mcat_section', self.mcat, {})

        self.set_empty_data(flow, 'd1-1', ['s0.out1'], ['s_mcat_all.*'])
        self.set_empty_data(flow, 'd2-1', ['s1.out1'], ['s_mcat_all.*'])
        self.set_empty_data(flow, 'd3-1', ['s2.out1'], ['s_mcat_all.*'])
        # self.set_empty_data(flow, 'd4-1', ['s3.out1'], ['s_mcat_all.*'])
        # self.set_empty_data(flow, 'd5-1', ['s4.out1'], ['s_mcat_all.*'])

        self.set_empty_data(flow, 'd1-2', ['s0.out2'], ['s_mcat_section.*'])
        self.set_empty_data(flow, 'd2-2', ['s1.out2'], ['s_mcat_section.*'])
        self.set_empty_data(flow, 'd3-2', ['s2.out2'], ['s_mcat_section.*'])
        # self.set_empty_data(flow, 'd4-2', ['s3.out2'], ['s_mcat_section.*'])
        # self.set_empty_data(flow, 'd5-2', ['s4.out2'], ['s_mcat_section.*'])

        self.set_empty_data(flow, 'all', ['s_mcat_all.out'], ['mtee_all.in'])
        self.set_empty_data(flow, 'section', ['s_mcat_section.out'], ['mtee_section.in'])

        mtee = Mtee()
        self.set_command_step(flow, 'mtee_all', mtee, {'o': 'kskp/data/stats_all.csv'})
        self.set_command_step(flow, 'mtee_section', mtee, {'o': 'kskp/data/stats_section.csv'})
        self.set_empty_data(flow, 'out_all', ['mtee_all.out'], [])
        self.set_empty_data(flow, 'out_section', ['mtee_section.out'], [])

        self.set_signature(flow, [], ['out_all', 'out_section'])

        job = Job(Step('flow', flow, {}))
        results = job.execute()

        for res in results.values():
            if res is not None:
                for k, v in res.contents.items():
                    print(f'{k}:', v[0])

        job.dtor()


if __name__ == '__main__':
    # パフォーマンステスト時に使ったコード
    runner = unittest.TextTestRunner()
    suite = unittest.TestSuite()
    suite.addTest(NIJapanSampleTestCase('test'))
    runner.run(suite)
