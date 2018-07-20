import os
import unittest
import json
from pathlib import Path

from kskp.engine.core3 import parse

class NIJapanSampleTestCase(unittest.TestCase):
    """ 日本NI様サンプルテスト """

    def setUp(self):
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'

    def execute(self, flow_uuid):
        job = parse(flow_uuid)
        try:
            job.execute()
        except Exception as e:
            job.dtor()
            raise

        # print(list(job.lasts.values())[0].contents)
        job.dtor()

    # @unittest.skip
    def test(self):
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'
        flow_uuid = '2C096E39-28BD-491B-B0E2-7ECFFD113304'
        self.execute(flow_uuid)

    # @profile
    def set_data(self, flow, key, data, srcs, dsts):
        """ syntax sugar用 """
        flow['nodes'][key] = {
            'type': 'frame',
            'dataSource': 'csv',
            'uuid': data
        }
        # flow.data[key] = data

        for src in srcs:
            job_id, port = tuple(src.split('.'))
            if job_id in flow['nodes']:
                if 'dsts' in flow['nodes'][job_id]:
                    flow['nodes'][job_id]['dsts'].update({port: key})
                else:
                    flow['nodes'][job_id]['dsts'] = {port: key}
            # srcはjobから見るとdst
            # job_id, port = tuple(src.split('.'))
            # flow.dst_edges[src] = key

        for dst in dsts:
            # dstはjobから見るとsrc
            # job_id, port = tuple(dst.split('.'))
            job_id, port = tuple(dst.split('.'))
            if job_id in flow['nodes']:
                if 'srcs' in flow['nodes'][job_id]:
                    flow['nodes'][job_id]['srcs'].update({port: key})
                else:
                    flow['nodes'][job_id]['srcs'] = {port: key}
                            # flow.src_edges[dst] = key

        # flow.edges[key] = { 'srcs': srcs, 'dsts': dsts }

    def set_empty_data(self, flow, key, srcs, dsts):
        """ syntax sugar、中間ファイル用 """
        # self.set_data(flow, key, Frame(), srcs, dsts)
        self.set_data(flow, key, None, srcs, dsts)

    # def set_temp_data(self, flow, key, srcs, dsts):
    #     """ syntax sugar、中間ファイルを消す用 """
    #     self.set_data(flow, key, Frame(None, TempPathFileSource('csv')), srcs, dsts)

    def set_signature(self, flow, input_data_keys, output_data_keys):
        for key in input_data_keys:
            flow['ports'][0][key] = {'type': 'frame'}

        for key in output_data_keys:
            flow['ports'][1][key] = {'type': 'frame'}

    def set_command_step(self, flow, key, command, args):
        flow['nodes'][key] = {
            'type': 'command',
            'name': command,
            'args': args
        }

    # # @profile
    def set_flow_step(self, flow, key, subflow, args):
        flow['nodes'][key] = {
            'type': 'flow',
            'uuid': subflow,
            'args': args
        }

    def make_obj(self, name):
        return {
            'name': name,
            'params': [],
            'ports': [{}, {}],
            'nodes': {}
        }

    def support_datetime_default(self, o):
        raise TypeError(repr(o) + " is not JSON serializable")

    def make_json(self, flow_uuid):
        import json
        import uuid
        # flow_uuid = uuid.uuid4()
        obj = self.make_splitting_flow()
        import pprint
        pp = pprint.PrettyPrinter(indent=4)
        pp.pprint(obj)
        with open(f'kskp/data/flows/{flow_uuid}.json', 'w', encoding='utf-8') as fd:
            json.dump(obj, fd, indent=4, default=self.support_datetime_default)

    # @profile
    def make_stats_all_flow(self):
        'f0717ac2-e98a-4864-98ee-34903d49e6fe'
        """ 各列全体についての統計量を求める """
        flow = self.make_obj('stats_all')
        self.set_command_step(flow, 's0', 'mavg', {'f': '@[sensor_name]:@[sensor_name]_avg'})
        self.set_command_step(flow, 's1', 'mcut', {'f': 'Time,@[sensor_name]_avg'})

        self.set_command_step(flow, 's2', 'mstats', {'c': 'sd', 'f': '@[sensor_name]:@[sensor_name]_sd'})
        self.set_command_step(flow, 's3', 'mcut', {'f': 'Time,@[sensor_name]_sd'})

        self.set_command_step(flow, 's4', 'mstats', {'c': 'max', 'f': '@[sensor_name]:@[sensor_name]_max'})
        self.set_command_step(flow, 's5', 'mcut', {'f': 'Time,@[sensor_name]_max'})

        self.set_command_step(flow, 's6', 'mstats', {'c': 'min', 'f': '@[sensor_name]:@[sensor_name]_min'})
        self.set_command_step(flow, 's7', 'mcut', {'f': 'Time,@[sensor_name]_min'})

        self.set_command_step(flow, 'sjoin0', 'mjoin', {'k': 'Time'})
        self.set_command_step(flow, 'sjoin1', 'mjoin', {'k': 'Time'})
        self.set_command_step(flow, 'sjoin2', 'mjoin', {'k': 'Time'})

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

    # @profile
    def stats_by_4_sensors(self):
        """
        入力されたファイルの3H 3V 4H 4Vそれぞれについて、統計量を求めて返すサブフロー
        """
        'd3b0f49f-f01b-4a73-981b-7b2c06667966'
        flow = self.make_obj('stats_by_4_sensors')
        stats_all_flow = 'f0717ac2-e98a-4864-98ee-34903d49e6fe'
        self.set_flow_step(flow, 's3H', stats_all_flow, {'sensor_name': '3H'})
        self.set_flow_step(flow, 's3V', stats_all_flow, {'sensor_name': '3V'})
        self.set_flow_step(flow, 's4H', stats_all_flow, {'sensor_name': '4H'})
        self.set_flow_step(flow, 's4V', stats_all_flow, {'sensor_name': '4V'})

        self.set_command_step(flow, 'sjoin0', 'mjoin', {'k': 'Time'})
        self.set_command_step(flow, 'sjoin1', 'mjoin', {'k': 'Time'})
        self.set_command_step(flow, 'sjoin2', 'mjoin', {'k': 'Time'})

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

    # @profile
    def make_section_flow(self):
        'a611f26b-d71c-4638-9516-05db2b622849'
        flow = self.make_obj('section')
        self.set_command_step(flow, 's0', 'mselstr', {'f': 'Section', 'v': '@[v]'})
        self.set_flow_step(flow, 'sstatsall', 'd3b0f49f-f01b-4a73-981b-7b2c06667966', {})
        self.set_command_step(flow, 's_msetstr1',  'msetstr', {'v': '@[v]', 'a': 'section'})
        self.set_command_step(flow, 's_msetstr2',  'msetstr', {'v': '@[pattern]', 'a': 'pattern'})

        self.set_empty_data(flow, 'in', [], ['s0.in'])
        self.set_empty_data(flow, 'd0', ['s0.out'], ['sstatsall.in'])
        self.set_empty_data(flow, 'd1', ['sstatsall.out'], ['s_msetstr1.in'])
        self.set_empty_data(flow, 'd2', ['s_msetstr1.out'], ['s_msetstr2.in'])
        self.set_empty_data(flow, 'out', ['s_msetstr2.out'], [])

        self.set_signature(flow, ['in'], ['out'])

        return flow

    # @profile
    def make_splitting_flow(self):
        'cb5585dc-230a-4e5a-a1ed-717bea416fa1'
        # execute_flow_by_uuid('A71D793C-AEFD-42DE-9BA4-56532EA47975')
        flow = self.make_obj('ex')
        self.set_command_step(flow, 's0', 'mcut', { 'x': True, 'f': '@[f]' })
        self.set_command_step(flow, 's1', 'mbucket', {'rng': True, 'n': 10, 'f': 'Time:Section'})
        section_flow = 'a611f26b-d71c-4638-9516-05db2b622849'
        self.set_flow_step(flow, 's2', section_flow, {'v': '1', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's3', section_flow, {'v': '2', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's4', section_flow, {'v': '3', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's5', section_flow, {'v': '4', 'pattern': '@[pattern]'})
        self.set_flow_step(flow, 's6', section_flow, {'v': '5', 'pattern': '@[pattern]'})
        # self.set_flow_step(flow, 's7', section_flow, {'v': '6', 'pattern': '@[pattern]'})
        # self.set_flow_step(flow, 's8', section_flow, {'v': '7', 'pattern': '@[pattern]'})
        # self.set_flow_step(flow, 's9', section_flow, {'v': '8', 'pattern': '@[pattern]'})
        # self.set_flow_step(flow, 's10', section_flow, {'v': '9', 'pattern': '@[pattern]'})
        # self.set_flow_step(flow, 's11', section_flow, {'v': '10', 'pattern': '@[pattern]'})

        self.set_flow_step(flow, 'sstatsall', 'd3b0f49f-f01b-4a73-981b-7b2c06667966', {})

        self.set_command_step(flow, 's_mcat', 'mcat', {})

        self.set_empty_data(flow, 'in', [], ['s0.in']) # 置き換えられる
        self.set_empty_data(flow, 'd0', ['s0.out'], ['s1.in', 'sstatsall.in'])
        # self.set_empty_data(flow, 'd8', ['s1.out'], ['s2.in', 's3.in', 's4.in', 's5.in', 's6.in', 's7.in', 's8.in', 's9.in', 's10.in', 's11.in'])
        self.set_empty_data(flow, 'd8', ['s1.out'], ['s2.in', 's3.in', 's4.in', 's5.in', 's6.in'])

        self.set_empty_data(flow, 'd_mcat1', ['s2.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat2', ['s3.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat3', ['s4.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat4', ['s5.out'], ['s_mcat.*'])
        self.set_empty_data(flow, 'd_mcat5', ['s6.out'], ['s_mcat.*'])
        # self.set_empty_data(flow, 'd_mcat6', ['s7.out'], ['s_mcat.*'])
        # self.set_empty_data(flow, 'd_mcat7', ['s8.out'], ['s_mcat.*'])
        # self.set_empty_data(flow, 'd_mcat8', ['s9.out'], ['s_mcat.*'])
        # self.set_empty_data(flow, 'd_mcat9', ['s10.out'], ['s_mcat.in'])
        # self.set_empty_data(flow, 'd_mcat10', ['s11.out',], ['s_mcat.in'])

        self.set_empty_data(flow, 'out1', ['sstatsall.out'], [])
        self.set_empty_data(flow, 'out2', ['s_mcat.out'], [])

        self.set_signature(flow, ['in'], ['out1', 'out2'])

        return flow


    # @profile
    # @unittest.skip
    def aaatest(self):
        '76220b9b-2b12-41a5-8d9a-a4ae16f40054'
        flow = self.make_obj('parent')
        splitting_flow = 'cb5585dc-230a-4e5a-a1ed-717bea416fa1'
        self.set_flow_step(flow, 's0', splitting_flow, {'f': '0,1,2,3,4', 'pattern': '1'})
        self.set_flow_step(flow, 's1', splitting_flow, {'f': '0,5,6,7,8', 'pattern': '2'})
        self.set_flow_step(flow, 's2', splitting_flow, {'f': '0,9,10,11,12', 'pattern': '3'})
        self.set_flow_step(flow, 's3', splitting_flow, {'f': '0,13,14,15,16', 'pattern': '4'})
        self.set_flow_step(flow, 's4', splitting_flow, {'f': '0,17,18,19,20', 'pattern': '5'})

        self.set_command_step(flow, 's_mcat_all', 'mcat', {})
        self.set_command_step(flow, 's_mcat_section', 'mcat', {})
        self.set_command_step(flow, 'mtee_all', 'mtee', {'o': 'kskp/data/stats_all.csv'})
        self.set_command_step(flow, 'mtee_section', 'mtee', {'o': 'kskp/data/stats_section.csv'})

        frame_uuid = '2C72275F-2019-49AE-B36D-A29D1507F8DD'
        # source1 = PathFileSource('csv', 'kskp/data/frames', frame_uuid + '.csv')
        self.set_data(flow, 'd0', frame_uuid, [], ['s0.in', 's1.in', 's2.in', 's3.in', 's4.in'])


        self.set_empty_data(flow, 'd1-1', ['s0.out1'], ['s_mcat_all.*'])
        self.set_empty_data(flow, 'd2-1', ['s1.out1'], ['s_mcat_all.*'])
        self.set_empty_data(flow, 'd3-1', ['s2.out1'], ['s_mcat_all.*'])
        self.set_empty_data(flow, 'd4-1', ['s3.out1'], ['s_mcat_all.*'])
        self.set_empty_data(flow, 'd5-1', ['s4.out1'], ['s_mcat_all.*'])

        self.set_empty_data(flow, 'd1-2', ['s0.out2'], ['s_mcat_section.*'])
        self.set_empty_data(flow, 'd2-2', ['s1.out2'], ['s_mcat_section.*'])
        self.set_empty_data(flow, 'd3-2', ['s2.out2'], ['s_mcat_section.*'])
        self.set_empty_data(flow, 'd4-2', ['s3.out2'], ['s_mcat_section.*'])
        self.set_empty_data(flow, 'd5-2', ['s4.out2'], ['s_mcat_section.*'])

        self.set_empty_data(flow, 'all', ['s_mcat_all.out'], ['mtee_all.in'])
        self.set_empty_data(flow, 'section', ['s_mcat_section.out'], ['mtee_section.in'])

        # mtee = Mtee()
        self.set_empty_data(flow, 'out_all', ['mtee_all.out'], [])
        self.set_empty_data(flow, 'out_section', ['mtee_section.out'], [])

        self.set_signature(flow, [], ['out_all', 'out_section'])

        # job = Job(Step('flow', flow, {}))
        # results = job.execute()
        #
        # for res in results.values():
        #     if res is not None:
        #         for k, v in res.contents.items():
        #             print(f'{k}:', v[0])
        #
        # job.dtor()
        return flow
