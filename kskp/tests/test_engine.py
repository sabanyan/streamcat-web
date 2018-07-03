import unittest

from .. import engine as e
from ..engine.data import *
from ..engine.core import Parameter, Command


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


class NIJapanSampleTestCase(unittest.TestCase):
    def setUp(self):
        self.fd, self.tempfile_path = tempfile.mkstemp()

        with open(self.tempfile_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            original_data = [['a', 'b', 'c'], [1, 2, 3], [4, 5, 6]]
            writer.writerows(original_data)

    def test_mcut(self):
        """ mcutのテスト """
        self.command = Mcut()
        frame_uuid = str(uuid.uuid4())
        path = Path(self.tempfile_path)
        source = PathFileSource('csv', path.parent.as_posix(), path.name)
        input = Frame(frame_uuid, source)

        result = self.command.execute({'f': 'a,b'}, {'in': input})
        result_dict = result['out'].contents
        result['out'].dtor()

        self.assertEqual(result_dict['a'], ['1', '4'])
        self.assertEqual(result_dict['b'], ['2', '5'])

    def tearDown(self):
        self.command.dtor()

        os.close(self.fd)
        os.unlink(self.tempfile_path)


class EngineTestCase(unittest.TestCase):
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
    def test_minimum_flow(self):
        """
        最小限のフローのテスト
        stepが1つ
        """
        execute_flow_by_uuid('833fdb62-2bb6-4a77-a0e1-77941ad951a3')

    @unittest.skip
    def test_minimum_piping_flow(self):
        """
        パイプを使う最小限のフローのテスト
        stepが2つ
        """
        execute_flow_by_uuid('70218468-417E-458B-B820-A17C55D04AF9')

    @unittest.skip
    def test_minimum_nested_flow(self):
        """ nested flowのテスト """
        execute_flow_by_uuid('3E4899CC-3296-4490-8C3F-3D9C6E857E14')

    @unittest.skip
    def test_mjoin(self):
        """複数INのテスト"""
        execute_flow_by_uuid('91E36B47-197B-4768-960B-AA1DEEA94873')

    @unittest.skip
    def test_ni(self):
        """日本NI様サンプルテスト"""
        execute_flow_by_uuid('A71D793C-AEFD-42DE-9BA4-56532EA47975')

    @unittest.skip
    def test_ni2(self):
        """日本NI様サンプルテスト"""
        execute_flow_by_uuid('b')

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


def execute_flow_by_uuid(flow_uuid):
    with open(f'kskp/data/flows/{flow_uuid}.json', 'r') as f:
        e.execute(flow_uuid, f.read(), frame_path='kskp/data/frames')
