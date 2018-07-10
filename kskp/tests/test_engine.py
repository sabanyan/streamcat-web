import unittest
import json

from .. import engine as e
from ..engine.data import *
from ..engine.core import Parameter, Command, Step, Flow, Job


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

from ..engine.commands.mcmd.coledit import Mcut
from ..engine.commands.mcmd.tablegrouping import Msum
from ..engine.commands.mcmd.tablejoin import Mjoin


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
        print('sample_input2 input.contents:', input.contents)
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
        print('input_with_path input.contents:', input.contents)
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

    @unittest.skip
    def test_sample_flow(self):
        """ 単純なフロー実行のテスト """

        result = self.make_simple_flow().execute()
        # print('test_sample_flow:', result)
        result_dict = result['out'].contents
        result['out'].dtor()

        self.assertEqual(result_dict['a'], ['1', '4'])
        self.assertEqual(result_dict['b'], ['2', '5'])

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
        print('test_sample_flow2 flow.data[in]:', flow.data['in'])
        flow.data['d0'] = Frame()
        flow.data['out'] = Frame()
        flow.edges['in'] = {'srcs': [], 'dsts': ['s0.in']}
        flow.edges['d0'] = {'srcs': ['s0.out'], 'dsts': ['s1.in']}
        flow.edges['out'] = {'srcs': ['s1.out'], 'dsts': []}
        flow.signature = [{}, {'out': flow.data['out']}]

        result = flow.execute()
        # print('test_sample_flow:', result)
        result_dict = result['out'].contents
        print('test_sample_flow2 result_dict:', result_dict)
        result['out'].dtor()

        self.assertEqual(result_dict['key%0'], ['1', '4'])
        self.assertEqual(result_dict['bsum'], ['2', '5'])

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
        print('test_sample_subflow result_dict:', result_dict)
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
        print('test_mjoin result_dict:', result_dict)
        result['out'].dtor()

    def get_result(self, result, key):
        result_dict = result[key].contents
        print('test_mjoin result_dict:', result_dict)
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

    def test_make_job_json(self):
        # クエリパラメータのcount
        count = 1

        os.environ['KENG_FRAME_PATH'] = 'kskp/data/frames'

        # テストの準備
        flow_uuid = '91E36B47-197B-4768-960B-AA1DEEA94873'
        with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
            flow_json = f.read()
        args = ''
        step = Step('flow', e.parse(flow_uuid, flow_json), args)

        inputs = None
        job = Job(step, inputs)

        job.execute()

        # flow_uuidを使ってjobsディレクトリから出力したjsonファイルを探す
        # flowのuuidで探しているためかなり雑な判定方法、何かいい方法があれば変えたい！
        jobs_path = Path(__file__).parent.parent.as_posix() / Path('data/jobs')
        for job_path in jobs_path.iterdir():
            data = json.loads(job_path.read_text(encoding='utf-8'))
            if data[count - 1]['flow']['uuid'] == flow_uuid:
                result = data

        self.assertEqual(result[count - 1]['flow']['uuid'], flow_uuid)

    def tearDown(self):
        self.command.dtor()
        self.command2.dtor()
        self.mjoin_command.dtor()
        self.mcut_command.dtor()
        self.mcut_command2.dtor()

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
        self.commands = []

    def register(self, command):
        self.commands.append(command)
        return command

    def make_splitting_flow(self):
        # execute_flow_by_uuid('A71D793C-AEFD-42DE-9BA4-56532EA47975')
        flow = Flow('ex')
        args = { 'x': True, 'f': '@[f]' } # argsを使う
        flow.steps['s0'] = Step('command', self.register(Mcut()), args)

        frame_uuid = '2C72275F-2019-49AE-B36D-A29D1507F8DD'
        source1 = PathFileSource('csv', 'kskp/data/frames', frame_uuid + '.csv')
        flow.data['d0'] = Frame(frame_uuid, source1)
        source2 = PathFileSource('csv', 'kskp/data/frames', 'result.csv')
        flow.data['out'] = Frame(None, source2)
        flow.edges['d0'] = { 'srcs': [], 'dsts': ['s0.in'] }
        flow.edges['out'] = { 'srcs': ['s0.out'], 'dsts': [] }
        flow.signature = [{}, {'out': flow.data['out']}]

        return flow

    @unittest.skip
    def test(self):
        flow = Flow('parent')
        child_flow = self.make_splitting_flow()
        flow.steps['s0'] = Step('flow', child_flow, {'f': '0,1,2,3,4'})
        flow.data['d1'] = Frame(None, TempPathFileSource('csv'))
        flow.edges['d1'] = { 'srcs': ['s0.out'], 'dsts': [] }
        flow.signature = [{}, {'d1': flow.data['d1']}]

        contents = flow.execute()['d1'].contents
        for v in contents.values():
            print('v:', v[0])

        flow.dtor()

    def tearDown(self):
        for c in self.commands:
            c.dtor()


def execute_flow_by_uuid(flow_uuid):
    with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
        e.execute(flow_uuid, f.read(), frame_path='kskp/data/frames')
