import unittest

from .. import engine as e
from ..engine.data import *
from ..engine.util import Parameter
from ..engine.core import Command, Step, Flow

class ParameterTestCase(unittest.TestCase):
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


class SourceTestCase(unittest.TestCase):
    def test(self):
        TempPathFileSource('csv')

import uuid
from pathlib import Path


class FrameTestCase(unittest.TestCase):
    @unittest.skip
    def test_basic_usage(self):
        """CSVファイル用のframeを作ってみる"""

        frame_uuid = str(uuid.uuid4())
        frames_dir = 'kskp/data/frames/'
        source = PathFileSource('csv', frames_dir, frame_uuid)
        frame = Frame(frame_uuid, source)

        fd = frame.source.fd
        print(fd)
        fd.close()

        p = Path(frames_dir) / Path(f'{frame_uuid}.csv')
        p.unlink()


import os
import csv
import tempfile
from subprocess import Popen

from ..engine.commands.mcmd.coledit import Mcut, Msetstr
from ..engine.commands.mcmd.tablegrouping import Msum, Mavg, Mstats
from ..engine.commands.mcmd.tablejoin import Mjoin, Mcat
from ..engine.commands.mcmd.tablesplit import Mbucket
from ..engine.commands.mcmd.datasource import Mtee

from ..engine.commands.mcmd.rowedit import Mselstr

class EngineTestCase(unittest.TestCase):
    def setUp(self):
        self.fd, self.tempfile_path = tempfile.mkstemp()
        self.fd2, self.tempfile_path2 = tempfile.mkstemp()
        self.fd3, self.tempfile_path3 = tempfile.mkstemp()
        self.fd4, self.tempfile_path4 = tempfile.mkstemp()

        with open(self.tempfile_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            original_data = [['a', 'b', 'c'], ['1', '2', '3'], ['4', '5', '6']]
            writer.writerows(original_data)

        self.command = Mcut()
        self.command2 = Msum()

        self.mjoin_command = Mjoin()
        self.mcut_command = Mcut()
        self.mcut_command2 = Mcut()

        self.make_sample_mjoin()

    def sample_input(self):
        frame_uuid = str(uuid.uuid4())
        path = Path(self.tempfile_path)
        source = PathFileSource('csv', path.parent.as_posix(), path.name)
        input = Frame(frame_uuid, source)
        return input

    def make_sample(self):
        """ ファイルを作ります """
        original_data = [
            ['key', 'b', 'c'],
            ['A', '200', '30'],
            ['A', '50', '60'],
            ['B', '20', '300'],
            ['B', '500', '60'],
        ]
        self.write_to_csv(self.tempfile_path2, original_data)

    def sample_input2(self):
        """ Msum -> Mcut がしてみたい """
        self.make_sample()

        frame_uuid = str(uuid.uuid4())
        path = Path(self.tempfile_path2)
        # print('sample_input2 self.tempfile_path2:', self.tempfile_path2)
        source = PathFileSource('csv', path.parent.as_posix(), path.name)
        input = Frame(frame_uuid, source)
        # print('sample_input2 input.contents:', input.contents)
        return input

    def write_to_csv(self, path, object):
        """ 指定されたデータをファイルに書き出します """
        with open(path, 'w') as f:
            writer = csv.writer(f, lineterminator='\n')
            writer.writerows(object)

    def make_sample_mjoin(self):
        """ mjoin用のサンプルを作ります """
        main = [
            ['item','date','price'],
             ['A','20081201','100'],
             ['A','20081213','98'],
             ['B','20081002','400'],
             ['B','20081209','450'],
             ['C','20081201','100'],
        ]
        self.write_to_csv(self.tempfile_path3, main)

        sub = [
            ['item','cost'],
            ['A','50'],
            ['B','300'],
            ['E','200'],
        ]
        self.write_to_csv(self.tempfile_path4, sub)

    def input_with_path(self, csv_path):
        frame_uuid = str(uuid.uuid4())
        path = Path(csv_path)
        # print('sample_input2 self.tempfile_path2:', self.tempfile_path2)
        source = PathFileSource('csv', path.parent.as_posix(), path.name)
        input = Frame(frame_uuid, source)
        # print('input_with_path input.contents:', input.contents)
        return input

    def mjoin_main_input(self):
        return self.input_with_path(self.tempfile_path3)
        # return self.input_with_path('kskp/data/frames/mjoin_i_wrong.csv')

    def mjoin_sub_input(self):
        return self.input_with_path(self.tempfile_path4)
        # return self.input_with_path('kskp/data/frames/mjoin_m_wrong.csv')

    @unittest.skip
    def test_mcut(self):
        """ mcutのテスト """

        # TODO: なぜかf=a,b,cにすると動かない。意味不明。
        result = self.command.execute({'f': 'a,b'}, {'in': self.sample_input()})
        result_dict = result['out'].contents
        result['out'].dtor()

        self.assertEqual(result_dict['a'], ['1', '4'])
        self.assertEqual(result_dict['b'], ['2', '5'])

    @unittest.skip
    def test_sample_step(self):
        """ 単純なステップ実行のテスト """
        step = Step('command', self.command, {'f': 'a,b'})
        result = step.execute({'in': self.sample_input()})
        result_dict = result['out'].contents
        result['out'].dtor()

        self.assertEqual(result_dict['a'], ['1', '4'])
        self.assertEqual(result_dict['b'], ['2', '5'])

    def make_simple_flow(self):
        flow = Flow('uuid')
        flow.steps['s0'] = Step('command', self.command, {'f': 'a,b'})
        flow.data['in'] = self.sample_input()
        flow.data['out'] = Frame()
        flow.edges['in'] = {'srcs': [], 'dsts': ['s0.in']}
        flow.edges['out'] = {'srcs': ['s0.out'], 'dsts': []}
        flow.signature = [{}, {'out': flow.data['out']}]

        return flow

    # @unittest.skip
    def test_sample_flow(self):
        """ 単純なフロー実行のテスト """

        result = self.make_simple_flow().execute()
        # print('test_sample_flow:', result)
        result_dict = result['out'].contents
        result['out'].dtor()

        self.assertEqual(result_dict['a'], ['1', '4'])
        self.assertEqual(result_dict['b'], ['2', '5'])

    @unittest.skip
    def test_simple_engine_executing(self):
        """
        単純なフロー実行をエンジンから行うテスト
        engine.persist_to_filesをテストしたい
        """
        flow = self.make_simple_flow()
        result = e.execute_internal(flow, frame_path='kskp/data/frames')

    @unittest.skip
    def test_sample_flow2(self):
        """ 単純なフロー実行のテスト その2 """
        flow = Flow('uuid')
        flow.steps['s0'] = Step('command', self.command2, {'k': 'key', 'f': 'b:bsum'})
        flow.steps['s1'] = Step('command', self.command, {'f': 'key,bsum'})
        flow.data['in'] = self.sample_input2()
        # print('test_sample_flow2 flow.data[in]:', flow.data['in'])
        flow.data['d0'] = Frame()
        flow.data['out'] = Frame()
        flow.edges['in'] = {'srcs': [], 'dsts': ['s0.in']}
        flow.edges['d0'] = {'srcs': ['s0.out'], 'dsts': ['s1.in']}
        flow.edges['out'] = {'srcs': ['s1.out'], 'dsts': []}
        flow.signature = [{}, {'out': flow.data['out']}]

        result = flow.execute()
        # print('test_sample_flow:', result)
        result_dict = result['out'].contents
        # print('test_sample_flow2 result_dict:', result_dict)
        result['out'].dtor()

        self.assertEqual(result_dict['key%0'], ['A', 'B'])
        self.assertEqual(result_dict['bsum'], ['250', '520'])

    @unittest.skip
    def test_sample_subflow(self):
        """ 単純なサブフロー実行のテスト """

        # まずはサブフローを作る
        step = Step('command', self.command, { 'f': 'key,bsum' })

        subflow = Flow('sub')
        subflow.steps['s0'] = step
        subflow.data['in'] = Frame()
        subflow.data['out'] = Frame()
        subflow.edges['in'] = {'srcs': [], 'dsts': ['s0.in']}
        subflow.edges['out'] = {'srcs': ['s0.out'], 'dsts': []}
        subflow.signature = [{'in': subflow.data['in']}, {'out': subflow.data['out']}]

        # それを呼び出す親フローを作る
        flow = Flow('main')
        flow.steps['s0'] = Step('command', self.command2, {'k': 'key', 'f': 'b:bsum'})
        flow.steps['s1'] = Step('flow', subflow, {})
        flow.data['in'] = self.sample_input2()
        # print('test_sample_flow2 flow.data[in]:', flow.data['in'])
        flow.data['d0'] = Frame()
        flow.data['out'] = Frame()
        flow.edges['in'] = {'srcs': [], 'dsts': ['s0.in']}
        flow.edges['d0'] = {'srcs': ['s0.out'], 'dsts': ['s1.in']}
        flow.edges['out'] = {'srcs': ['s1.out'], 'dsts': []}
        flow.signature = [{}, {'out': flow.data['out']}]

        result = flow.execute()
        result_dict = result['out'].contents
        # print('test_sample_subflow result_dict:', result_dict)
        result['out'].dtor()

    @unittest.skip
    def test_mjoin(self):
        """ 単純な複数INのテスト """

        flow = Flow('mjoin')
        flow.steps['s0'] = Step('command', self.mjoin_command, {'k': 'item'})
        flow.data['in1'] = self.mjoin_main_input()
        flow.data['in2'] = self.mjoin_sub_input()
        flow.data['out'] = Frame()
        flow.edges['in1'] = {'srcs': [], 'dsts': ['s0.i']}
        flow.edges['in2'] = {'srcs': [], 'dsts': ['s0.m']}
        flow.edges['out'] = {'srcs': ['s0.out'], 'dsts': []}
        flow.signature = [{}, {'out': flow.data['out']}]

        result = flow.execute()
        result_dict = result['out'].contents
        # print('test_mjoin result_dict:', result_dict)
        result['out'].dtor()

    def get_result(self, result, key):
        result_dict = result[key].contents
        # print('test_mjoin result_dict:', result_dict)
        result[key].dtor()

    @unittest.skip
    def test_file_spliting(self):
        """ 単純な複数OUTのテスト """

        flow = Flow('spliting')
        flow.steps['s0'] = Step('command', self.command, {'f': 'a'})
        flow.steps['s1'] = Step('command', self.mcut_command, {'f': 'b'})
        flow.data['in'] = self.sample_input()
        flow.data['out1'] = Frame()
        flow.data['out2'] = Frame()
        flow.edges['in'] = {'srcs': [], 'dsts': ['s0.in', 's1.in']}
        flow.edges['out1'] = {'srcs': ['s0.out'], 'dsts': []}
        flow.edges['out2'] = {'srcs': ['s1.out'], 'dsts': []}
        flow.signature = [{}, {'out1': flow.data['out1'], 'out2': flow.data['out2']}]

        result = flow.execute()

        self.get_result(result, 'out1')
        self.get_result(result, 'out2')

    @unittest.skip
    def test_file_spliting2(self):
        """ 単純な複数OUTのテスト 2 バグが出そうなパターン """

        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'

        flow = Flow('spliting')
        flow.steps['s0'] = Step('command', self.command, {'f': 'a,b'})
        flow.steps['s1'] = Step('command', self.mcut_command, {'f': 'a'})
        flow.steps['s2'] = Step('command', self.mcut_command2, {'f': 'b'})
        flow.data['in'] = self.sample_input()
        flow.data['d0'] = Frame()
        flow.data['out1'] = Frame()
        flow.data['out2'] = Frame()
        flow.edges['in'] = {'srcs': [], 'dsts': ['s0.in']}
        flow.edges['d0'] = {'srcs': ['s0.out'], 'dsts': ['s1.in', 's2.in']}
        flow.edges['out1'] = {'srcs': ['s1.out'], 'dsts': []}
        flow.edges['out2'] = {'srcs': ['s2.out'], 'dsts': []}
        flow.signature = [{}, {'out1': flow.data['out1'], 'out2': flow.data['out2']}]

        result = flow.execute()

        self.get_result(result, 'out1')
        self.get_result(result, 'out2')

    @unittest.skip
    def test_making_command(self):
        """
        Commandクラスを定義してみる

        型チェックの方法について
        """

        class TestCommand(Command):
            """
            テスト用に、元のframeに指定されたカラムを付け足すコマンドを作ってみる
            """

            def __init__(self):
                super().__init__()
                self.parameters.append(Parameter('f', '列名'))
                self.parameters.append(Parameter('v', '値'))

                self.signature = (
                    {'in' : { 'type': 'frame' }},
                    {'out': { 'type': 'frame' }}
                )

            def execute(self, args={}, inputs={}):
                i = inputs['in']
                count = i.row_count()
                import itertools
                values = list(itertools.repeat(args['v'], count))

                i.update( {args['f']: values} )

                return {'out': i}

        command = TestCommand()

        input = Frame()
        input.contents = {
            'name': ['Tom', 'Mary', 'Brian'],
            'age': ['18', '19', '16']
        }
        res = command.execute({'f': 'alien', 'v': 0}, {'in': input})

        print(res)

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

    def tearDown(self):
        # self.command.dtor()
        # self.command2.dtor()
        # self.mjoin_command.dtor()
        # self.mcut_command.dtor()
        # self.mcut_command2.dtor()

        os.close(self.fd)
        os.unlink(self.tempfile_path)
        os.close(self.fd2)
        os.unlink(self.tempfile_path2)
        os.close(self.fd3)
        os.unlink(self.tempfile_path3)
        os.close(self.fd4)
        os.unlink(self.tempfile_path4)


class NIJapanSampleTestCase(unittest.TestCase):
    """ 日本NI様サンプルテスト """

    def setUp(self):
        # self.commands = []
        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'

        self.mcut = Mcut()
        self.mjoin = Mjoin()
        self.mstats = Mstats()
        self.mavg = Mavg()
        self.mselstr = Mselstr()
        self.msetstr = Msetstr()
        self.mbucket = Mbucket()
        self.mcat = Mcat()

    def register(self, command):
        # self.commands.append(command)
        return command

    def set_data(self, flow, key, data, srcs, dsts):
        """ syntax sugar用 """
        flow.data[key] = data
        flow.edges[key] = { 'srcs': srcs, 'dsts': dsts }

    def set_empty_data(self, flow, key, srcs, dsts):
        """ syntax sugar、中間ファイル用 """
        # self.set_data(flow, key, Frame(), srcs, dsts)
        self.set_data(flow, key, None, srcs, dsts)

    def set_temp_data(self, flow, key, srcs, dsts):
        """ syntax sugar、中間ファイルを消す用 """
        self.set_data(flow, key, Frame(None, TempPathFileSource('csv')), srcs, dsts)

    def set_signature(self, flow, input_data_keys, output_data_keys):
        """
        syntax sugar、signature設定用
        TODO: もはや、そもそもこのsignatureの設計自体が微妙ではある
        """
        for key in input_data_keys:
            flow.signature[0][key] = flow.data[key]

        for key in output_data_keys:
            flow.signature[1][key] = flow.data[key]

    def set_command_step(self, flow, key, command, args):
        flow.steps[key] = Step('command', self.register(command), args)

    def set_flow_step(self, flow, key, subflow, args):
        flow.steps[key] = Step('flow', self.register(subflow), args)

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

    def stats_by_4_sensors(self):
        """
        入力されたファイルの3H 3V 4H 4Vそれぞれについて、統計量を求めて返すサブフロー
        """
        flow = Flow('stats_by_4_sensors')
        make_stats_all_flow = self.make_stats_all_flow()
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

    def make_splitting_flow(self):
        # execute_flow_by_uuid('A71D793C-AEFD-42DE-9BA4-56532EA47975')
        flow = Flow('ex')
        self.set_command_step(flow, 's0', self.mcut, { 'x': True, 'f': '@[f]' })
        self.set_command_step(flow, 's1', self.mbucket, {'rng': True, 'n': 10, 'f': 'Time:Section'})
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

    @unittest.skip
    def test(self):
        flow = Flow('parent')

        self.set_flow_step(flow, 's0', self.make_splitting_flow(), {'f': '0,1,2,3,4', 'pattern': '1'})
        self.set_flow_step(flow, 's1', self.make_splitting_flow(), {'f': '0,5,6,7,8', 'pattern': '2'})
        self.set_flow_step(flow, 's2', self.make_splitting_flow(), {'f': '0,9,10,11,12', 'pattern': '3'})
        self.set_flow_step(flow, 's3', self.make_splitting_flow(), {'f': '0,13,14,15,16', 'pattern': '4'})
        self.set_flow_step(flow, 's4', self.make_splitting_flow(), {'f': '0,17,18,19,20', 'pattern': '5'})

        frame_uuid = '2C72275F-2019-49AE-B36D-A29D1507F8DD'
        source1 = PathFileSource('csv', 'kskp/data/frames', frame_uuid + '.csv')
        flow.data['d0'] = Frame(frame_uuid, source1)
        flow.edges['d0'] = { 'srcs': [], 'dsts': ['s0.in', 's1.in', 's2.in', 's3.in', 's4.in'] }

        self.set_command_step(flow, 's_mcat_all', self.mcat, {})
        self.set_command_step(flow, 's_mcat_section', self.mcat, {})

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

        self.set_command_step(flow, 'mtee_all', Mtee(), {'o': 'kskp/data/stats_all.csv'})
        self.set_command_step(flow, 'mtee_section', Mtee(), {'o': 'kskp/data/stats_section.csv'})
        self.set_empty_data(flow, 'out_all', ['mtee_all.out'], [])
        self.set_empty_data(flow, 'out_section', ['mtee_section.out'], [])

        self.set_signature(flow, [], ['out_all', 'out_section'])

        results = flow.execute()

        for res in results.values():
            if res is not None:
                for k, v in res.contents.items():
                    print(f'{k}:', v[0])


def execute_flow_by_uuid(flow_uuid):
    with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
        e.execute(flow_uuid, f.read(), frame_path='kskp/data/frames')

if __name__ == '__main__':
    # パフォーマンステスト時に使ったコード
    runner = unittest.TextTestRunner()
    suite = unittest.TestSuite()
    suite.addTest(NIJapanSampleTestCase('test'))
    runner.run(suite)
