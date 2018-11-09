import re
import json

from .data3 import *
from .util import Parameter
from datetime import datetime, timedelta, timezone

flow_obj_cache = {} # uuid: Jsonオブジェクト
flows_cache = {} # uuid: Flowインスタンス

def parse(flow_uuid):
    global flow_obj_cache
    global flows_cache
    flow_obj_cache = {}
    flows_cache = {}
    return parse_job(load_flow(flow_uuid), flow_uuid, {}, {}, {}, {})

def load_flow(flow_uuid):
    if flow_uuid in flow_obj_cache:
        return flow_obj_cache[flow_uuid]

    flows_path = Path(os.environ['KENG_FLOWS_PATH']).joinpath(f'{flow_uuid}.json')
    with open(flows_path, 'r', encoding='utf-8') as fd:
        obj = json.loads(fd.read(), encoding='utf-8')
        flow_obj_cache[flow_uuid] = obj
        return obj

def parse_job(obj, flow_uuid, args, srcs, dsts, inputs):
    data = parse_data(obj)

    # make step
    if flow_uuid in flows_cache:
        flow = flows_cache[flow_uuid]
    else:
        flow = parse_flow(obj, flow_uuid)
    step = Step(flow, args, srcs, dsts)

    # make subjobs
    nodes = parse_nodes(obj)
    jobs = parse_subjobs(nodes, data)

    # make lasts
    lasts = parse_lasts(data, jobs)

    # make job
    job = Job(step, inputs)
    if step.is_flow:
        job.jobs = jobs
        job.lasts = lasts

    return job

def parse_flow(obj, flow_uuid):
    flow = Flow(flow_uuid)
    for param in obj['params']:
        flow.params.append(Parameter(param['name']))
    flow.i_ports = obj['ports'][0]
    flow.o_ports = obj['ports'][1]
    return flow

def parse_lasts(data, subjobs):
    src_values = {src for subjob in subjobs for src in subjob.step.srcs.values()}
    last_keys = data.keys() - src_values
    return {key: data[key] for key in last_keys}

def parse_data(obj):
    return {node['id']: parse_datum(node) for node in obj['nodes']
                                 if node['type'] == 'frame'}

def parse_datum(node_obj):
    frame_uuid = node_obj['uuid']
    if frame_uuid is not None:
        frames_path = os.environ['KENG_FRAMES_PATH']
        data_source = node_obj['dataSource']
        file_name = f'{frame_uuid}.{data_source}'
        source = PathFileSource(data_source, frames_path, file_name)
        datum = Frame(frame_uuid, source)
        datum.is_temp = False
    else:
        datum = Frame()
    return datum

def parse_nodes(obj):
    return [node for node in obj['nodes']
                 if node['type'] in ['command', 'flow']]

def parse_subjobs(nodes, data):
    return [parse_subjob(node, data) for node in nodes]

def parse_subjob(node, data):
    t = node['type']

    args = node['args']
    srcs = node['srcs']
    dsts = node['dsts']
    inputs = parse_job_inputs(data, srcs)
    if t == 'command':
        new_step = parse_command_step(node, args, srcs, dsts)
        new_job = Job(new_step, inputs)
    elif t == 'flow':
        flow_uuid = node['uuid']
        new_job = parse_job(load_flow(flow_uuid), flow_uuid, args, srcs, dsts, inputs)
    return new_job

def parse_job_inputs(data, srcs):
    return {v: data[v] for v in srcs.values() if v is not None}

def parse_command_step(node_obj, args, srcs, dsts):
    return Step(commands[node_obj['commandId']], args, srcs, dsts)


class Job:
    def __init__(self, step, inputs=None):
        self.step = step
        self.inputs = {} if inputs is None else inputs
        self.lasts = {}
        self.jobs = []
        # self.errors = []

    # @profile
    def execute(self, step_paths=None):
        self.replace_inputs()

        s = self.step
        cf = s.command_or_flow
        # print('execute stt:', cf, s.args)
        if s.is_flow:
            if step_paths is not None:
                self.lasts = self.get_lasts_from(step_paths)
            output = { k: self.get_datum(k, v) for k, v in self.lasts.items() }
            self.lasts = output

            if len(self.step.srcs) == 0 and len(self.step.dsts) == 0:
                for last in self.lasts.values():
                    last.is_temp = False

        elif s.is_command:
            output = cf.execute(self.step.args, self.inputs)
        # print('execute end:', cf, output)

        return self.replace_outputs(output)

    def get_lasts_from(self, step_paths):
        result = {}
        for k, v in self.lasts.items():
            if step_paths == k:
                result[k] = v
        for job in self.jobs:
            for k, v in job.inputs.items():
                if step_paths == k:
                    result[k] = v
        return result

    def replace_inputs(self):
        for p_k, p_v in self.inputs.items():
            for job in self.jobs:
                for c_k, c_v in job.inputs.items():
                    if c_k == p_k:
                        job.inputs[c_k] = p_v

    def replace_outputs(self, output):
        result = {}
        for o_port in self.step.command_or_flow.o_ports:
            for o_k, o_v in output.items():
                if o_k == o_port['name']:
                    result[o_k] = o_v

            for job in self.jobs:
                for c_k, c_v in job.inputs.items():
                    if c_k == o_port['name']:
                        result[c_k] = c_v

        return result

    def get_datum(self, datum_id, datum):
        if datum.uuid is not None: return datum

        job, port = self.src_job_from(datum_id)

        self.expand_args(job)
        job.inputs = job.check_inputs(self.inputs_of(job))

        return job.execute()[port]

    def src_job_from(self, datum_id):
        for j in self.jobs:
            for k, v in j.step.dsts.items():
                if v == datum_id:
                    return j, k

    def expand_args(self, job):
        job.step.args = {k: self.replace_arg(v, self.step.args)
                             for k, v in job.step.args.items()}

    def replace_arg(self, v, args):
        res = v
        if isinstance(v, str):
            r = re.search(r'@\[(\S*?)\]', v)
            if r is not None:
                for g in r.groups():
                    res = v.replace(f'@[{g}]', args[g])
        return res

    def inputs_of(self, job):
        # print(job.step.command_or_flow, job.inputs, job.step.srcs)
        result = {}
        for port, d in job.step.srcs.items():
            if d is None:
                continue
            # Sourceが未作成の場合は作成する
            # 内包表記でも書けるけど、この場合は内包表記じゃない方が何やっているか見やすいと思います。
            if job.inputs[d].source is None:
                result[d] = self.check_multi_use(job, d, self.get_datum(d, job.inputs[d]))
            else:
                result[d] = job.inputs[d]
        return result


    def check_multi_use(self, job, datum_id, datum):
        job_ports = self.dst_job_ids(datum_id)
        if len(job_ports) >= 2:
            datum.command_to_file()

            for j, port in job_ports.items():
                if j != job:
                    j.inputs[j.step.srcs[port]] = datum
        return datum

    def dst_job_ids(self, datum_id):
        return {j: port for j in self.jobs
                  for port, src_id in j.step.srcs.items()
                  if src_id == datum_id}

    def check_inputs(self, inputs):
        res = inputs
        step = self.step
        i_ports = step.command_or_flow.i_ports
        if '*' not in i_ports:
            res = {port: v for k, v in inputs.items()
                           for port, datum_id in step.srcs.items()
                           if datum_id == k}
        return res

    def dtor(self):
        for datum in self.inputs.values():
            datum.dtor()

        for datum in self.lasts.values():
            datum.command_to_file().dtor()

        for job in self.jobs:
            job.dtor()


class Step:
    def __init__(self, command_or_flow, args, srcs, dsts):
        self.command_or_flow = command_or_flow
        self.args = args
        self.srcs = srcs # {'in': 'd0'}
        self.dsts = dsts # {'out': 'd1'}

    @property
    def is_command(self):
        return isinstance(self.command_or_flow, Command)

    @property
    def command(self):
        if isinstance(self.command_or_flow, Command):
            return self.command_or_flow
        else:
            raise Exception()

    @property
    def is_flow(self):
        return isinstance(self.command_or_flow, Flow)

    @property
    def flow(self):
        if isinstance(self.command_or_flow, Flow):
            return self.command_or_flow
        else:
            raise Exception()

class Flow:
    def __init__(self, flow_uuid):
        self.uuid = flow_uuid
        self.params = []
        self.i_ports = []
        self.o_ports = []
        self.description = ''

    def __repr__(self):
        return f'<Flow uuid:{self.uuid}>'


class Command:
    def __init__(self, name=''):
        self.name = name
        self.params = []
        self.i_ports = []
        self.o_ports = []
        self.description = ''

    def execute(self, args, inputs):
        pass

    def __repr__(self):
        return f'<Command name:{self.name}>'

    @property
    def out_key(self):
        return self.o_ports[0]['name']

class UnixCommand(Command):
    def __init__(self):
        super().__init__()
        self.i_ports = [{'name': 'i', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}]

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)
        frame = Frame(str(uuid.uuid4()), source)
        return { self.out_key: frame }

    def source(self, args, inputs):
        """ for override """
        raise Exception()

    def command_args(self, args, inputs):
        """ for override """
        raise Exception()

    def stdin(self, inputs):
        return list(inputs.values())[0].source.fd


class Split(Command):
    def __init__(self):
        super().__init__()
        self.name = 'split'
        self.i_ports = [{'name': 'i', 'type': 'frame'}]
        self.o_ports = [{'name': 'o1', 'type': 'frame'}, {'name': 'o2', 'type': 'frame'}]
        self.params.append(Parameter('l'))

    def execute(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        command_args = ['split']
        command_args.append(f"-l {args['l']}")
        command_args.append(inputs['i'].command_to_file().source.file_name)
        import subprocess
        popen = subprocess.Popen(command_args, cwd=frames_path)
        popen.wait()
        source1 = PathFileSource('', frames_path, 'xaa')
        frame1 = Frame(str(uuid.uuid4()), source1)
        source2 = PathFileSource('', frames_path, 'xab')
        frame2 = Frame(str(uuid.uuid4()), source2)
        return {'o1': frame1, 'o2': frame2}


class MCommand(UnixCommand):

    def command_args(self, args, inputs):
        res = self.name.split()
        for k, v in args.items():
            # booleanに対応していないのでひとまず
            if k == 'x':
                if v == True or v == "true":
                    res.append('-x')
            elif k == 'rng':
                if v == True:
                    res.append('-rng')
            elif k == 'r':
                if v == True or v == "true":
                    res.append('-r')
            else:
                res.append('%s=%s' % (k, v))
        return res

    # @property
    def source(self, args, inputs):
        return UnixCommandSource('csv', self.command_args(args, inputs), stdin=self.stdin(inputs))

class MCommandNew(UnixCommand):
    def __init__(self, nysol_mod):
        super().__init__()
        self.i_ports = [{'name': 'i', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}]
        self.nysol_mod = nysol_mod

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        return args_for_nysol, process_flow

    def source(self, args, inputs):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow)

import nysol.mcmd as nm

class Msel(MCommandNew):
    def __init__(self):
        super().__init__(nm.msel)
        self.name = 'msel'
        self.description = '行絞り込み'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('c', '絞込条件式'))
        self.disagree_output = str(uuid.uuid4())
        self.disagre_source = None

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MselOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msel'
        self.description = '行絞り込み'
        self.params.append(Parameter('c', '絞込条件式'))

class Mcut(MCommandNew):
    def __init__(self):
        super().__init__(nm.mcut)
        self.name = 'mcut'
        self.description = '列選択'
        self.params.append(Parameter('f', '対象列名(必須)'))

class McutOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcut'
        self.description = '列選択'
        self.params.append(Parameter('f', '対象列名(必須)'))

class Msetstr(MCommandNew):
    def __init__(self):
        super().__init__(nm.msetstr)
        self.name = 'msetstr'
        self.description = '文字列追加'
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('v', '追加する値(必須)'))

class MsetstrOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msetstr'
        self.description = '文字列追加'
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('v', '追加する値(必須)'))

class Mstats(MCommandNew):
    def __init__(self):
        super().__init__(nm.mstats)
        self.name = 'mstats'
        self.description = '統計情報'
        self.params.append(Parameter('k', '単位として集計する列名'))
        self.params.append(Parameter('c', '計算列名(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))

class MstatsOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mstats'
        self.description = '統計情報'
        self.params.append(Parameter('k', '単位として集計する列名'))
        self.params.append(Parameter('c', '計算列名(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))

class Mavg(MCommandNew):
    def __init__(self):
        super().__init__(nm.mavg)
        self.name = 'mavg'
        self.description = '平均'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('k', '集計の単位となる列名'))

class MavgOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mavg'
        self.description = '平均'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('k', '集計の単位となる列名'))

class Mbucket(MCommandNew):
    def __init__(self):
        super().__init__(nm.mbucket)
        self.name = 'mbucket'
        self.description = '行分割'
        self.params.append(Parameter('n', '行数(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('F', '出力形式'))
        self.params.append(Parameter('k', 'バケット分割を行う単位となる列名'))
        self.params.append(Parameter('O', 'バケット範囲出力ファイル'))

class MbucketOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mbucket'
        self.description = '行分割'
        self.params.append(Parameter('n', '行数(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('F', '出力形式'))
        self.params.append(Parameter('k', 'バケット分割を行う単位となる列名'))
        self.params.append(Parameter('O', 'バケット範囲出力ファイル'))

class Mselstr(MCommandNew):
    def __init__(self):
        super().__init__(nm.mselstr)
        self.name = 'mselstr'
        self.description = '行選択(文字列)'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '絞込条件値（文字列）(必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列名'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MselstrOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mselstr'
        self.description = '行選択(文字列)'
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '絞込条件値（文字列）(必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列名'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

class Msortf(MCommandNew):
    def __init__(self):
        super().__init__(nm.msortf)
        self.name = 'msortf'
        self.desription = 'ソート'
        self.params.append(Parameter('f', '対象列名(必須)'))

class MsortfOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msortf'
        self.desription = 'ソート'
        self.params.append(Parameter('f', '対象列名(必須)'))

class Mcal(MCommandNew):
    def __init__(self):
        super().__init__(nm.mcal)
        self.name = 'mcal'
        self.description = '計算'
        self.params.append(Parameter('c', '計算式(必須)'))
        self.params.append(Parameter('a', '追加列名(必須)'))

class McalOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcal'
        self.description = '計算'
        self.params.append(Parameter('c', '計算式(必須)'))
        self.params.append(Parameter('a', '追加列名(必須)'))

class Mcat(MCommandNew):
    def __init__(self):
        super().__init__(nm.m2cat)

        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.i_ports = [{'name': '*', 'type': 'frame'}] # 何個でも取れる1
        self.params.append(Parameter('k', '結合する列名'))

    def execute(self, args, inputs):
        # args_for_nysol = args

        # m2catはなんのパラメータがあるかわからないので（少なくともmcatとは違う）
        args_for_nysol = {}
        inputs_for_arg_i = []
        for key, input in inputs.items():
            inputs_for_arg_i.append(input.source.nysol_module)
        args_for_nysol.update({'i': inputs_for_arg_i})

        source = NysolPythonSource('csv', self.nysol_mod, args_for_nysol)
        frame = Frame(str(uuid.uuid4()), source)
        return { self.out_key: frame }

class McatOld(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.i_ports = [{'name': '*', 'type': 'frame'}] # 何個でも取れる1
        self.params.append(Parameter('k', '結合する列名'))

    def command_args(self, args, inputs):
        res = self.name.split()

        # 引数をそれぞれパスにしていく
        inputs_for_arg_i = []
        for key, input in inputs.items():
            input.command_to_file()
            inputs_for_arg_i.append(input.source.fullpath.as_posix())
        res.append(f"i={','.join(inputs_for_arg_i)}")
        return res

    def stdin(self, inputs):
        return None

class Mjoin(MCommandNew):
    def __init__(self):
        super().__init__(nm.mjoin)
        self.name = 'mjoin'
        self.description = '結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MjoinOld(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mjoin'
        self.description = '結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mnumber(MCommandNew):
    def __init__(self):
        super().__init__(nm.mnumber)
        self.name = 'mnumber'
        self.description = '連番'
        self.params.append(Parameter('s', 'ソート対象列名'))
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('e', '同一キー同一ソートの処理方法の指定'))
        self.params.append(Parameter('l', '連番の間隔'))
        self.params.append(Parameter('k', '連番もしくは連文字を振る単位となる列'))
        self.params.append(Parameter('S', '開始No'))

class MnumberOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnumber'
        self.description = '連番'
        self.params.append(Parameter('s', 'ソート対象列名'))
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('e', '同一キー同一ソートの処理方法の指定'))
        self.params.append(Parameter('l', '連番の間隔'))
        self.params.append(Parameter('k', '連番もしくは連文字を振る単位となる列'))
        self.params.append(Parameter('S', '開始No'))

class Msummary(MCommandNew):
    def __init__(self):
        super().__init__(nm.msummary)
        self.name = 'msummary'
        self.description = '1変数の統計量の計算'
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('c', '統計量を指定'))

class MsummaryOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'msummary'
        self.description = '1変数の統計量の計算'
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('c', '統計量を指定'))
        #統計量はあらかじめ決められている
        # 統計量リスト:sum/mean/count/ucount/devsq/var/uvar/sd/usd/cv/min/qtile1/median/qtile3/max/
        # range/qrange/mode/skew/uskew/kurt/ukurt

class M2cross(MCommandNew):
    def __init__(self):
        super().__init__(nm.m2cross)
        self.name = 'm2cross'
        self.description = '1対Nのクロス集計'
        self.params.append(Parameter('f', '組み合わせ列名(必須)'))
        self.params.append(Parameter('s', '列項目名に展開する列(選択必須)'))
        self.params.append(Parameter('a', '２項目指定(選択必須)'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL血置換文字列'))

class M2crossOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcross'
        self.description = 'クロス集計'
        self.params.append(Parameter('f', '指定列の値(必須)'))
        self.params.append(Parameter('s', '列名となる元のデータ列(必須)'))#ここの説明が怪しい
        self.params.append(Parameter('a', 'f=で指定した列名がデータとして展開する列名'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL値置換文字列'))

class Mcross(MCommandNew):
    def __init__(self):
        super().__init__(nm.mcross)
        self.name = 'mcross'
        self.description = 'クロス集計'
        self.params.append(Parameter('f', '指定列の値(必須)'))
        self.params.append(Parameter('s', '列名となる元のデータ列(必須)'))#ここの説明が怪しい
        self.params.append(Parameter('a', 'f=で指定した列名がデータとして展開する列名'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL値置換文字列'))

class McrossOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcross'
        self.description = 'クロス集計'
        self.params.append(Parameter('f', '指定列の値(必須)'))
        self.params.append(Parameter('s', '列名となる元のデータ列(必須)'))#ここの説明が怪しい
        self.params.append(Parameter('a', 'f=で指定した列名がデータとして展開する列名'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL値置換文字列'))

class Msum(MCommandNew):
    def __init__(self):
        super().__init__(nm.msum)
        self.name = 'msum'
        self.description = '合計'
        self.params.append(Parameter('k', '合計の基準となる列名'))
        self.params.append(Parameter('f', '合計する列名:合計後の列名(必須)'))

class MsumOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msum'
        self.description = '合計'
        self.params.append(Parameter('k', '合計の基準となる列名'))
        self.params.append(Parameter('f', '合計する列名:合計後の列名(必須)'))

class Mmbucket(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mmbucket)
        self.name = 'mmbucket'
        self.description = '多次元行分割'
        self.params.append(Parameter('n', '行数(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('F', '出力形式'))
        self.params.append(Parameter('k', '各項目の各バケットの数値範囲を出力するファイル名'))

class MmbucketOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mmbucket'
        self.description = '多次元行分割'
        self.params.append(Parameter('n', '行数(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('F', '出力形式'))
        self.params.append(Parameter('k', '各項目の各バケットの数値範囲を出力するファイル名'))

class Msep(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.msep)
        self.name = 'msep'
        self.description = 'レコードの分割'
        self.params.append(Parameter('d', '異なるデータファイルに分割する列名(必須)'))

class MsepOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'msep'
        self.description = 'レコードの分割'
        self.params.append(Parameter('d', '異なるデータファイルに分割する列名(必須)'))

class Msep2(MCommandNew):#mnew
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'msep2'
        self.description = '連番、項目値表の出力を伴った行分割'
        self.params.append(Parameter('k', '分割単位となる項目(必須)'))
        self.params.append(Parameter('O', '連番ファイルを作成するディレクトリ名(必須)'))
        self.params.append(Parameter('a', 'o=にて出力するファイル名の項目名(必須)'))

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        # 文字列のコマンドを作成する
        args_list = self.name
        for key,value in args_for_nysol.items():
            if isinstance(value, bool):
                if value == True:
                    args_list +=  ' -' + key
            else:
                args_list += ' %s=%s' % (key, value)

        return args_list, process_flow

    def source(self, args, inputs):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, ' o=')

class Msep2Old(MCommand):#mnew
    def __init__(self):
        super().__init__()
        self.name = 'msep2'
        self.description = '連番、項目値表の出力を伴った行分割'
        self.params.append(Parameter('k', '分割単位となる項目(必須)'))
        self.params.append(Parameter('O', '連番ファイルを作成するディレクトリ名(必須)'))
        self.params.append(Parameter('a', 'o=にて出力するファイル名の項目名(必須)'))

class Mshuffle(MCommandNew):
    def __init__(self):
        super().__init__(nm.mshuffle)
        self.name = 'mshuffle'
        self.description = 'レコード分割'
        self.params.append(Parameter('d', '出力ファイル名の接頭辞(必須)'))
        self.params.append(Parameter('f', 'キー指定'))
        self.params.append(Parameter('n', '分割ファイル数(選択必須)'))
        self.params.append(Parameter('v', '分割するファイルごとのデータ量の重み(選択必須)'))

class MshuffleOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mshuffle'
        self.description = 'レコード分割'
        self.params.append(Parameter('d', '出力ファイル名の接頭辞(必須)'))
        self.params.append(Parameter('f', 'キー指定'))
        self.params.append(Parameter('n', '分割ファイル数(選択必須)'))
        self.params.append(Parameter('v', '分割するファイルごとのデータ量の重み(選択必須)'))

class Mtee(MCommandNew):
    def __init__(self):
        super().__init__(nm.m2tee)
        self.name = 'mtee'
        self.description = '出力'
        self.params.append(Parameter('o', '出力先'))

class MteeOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtee'
        self.description = '出力'
        self.params.append(Parameter('o', '出力先'))

class Mnewnumber(MCommandNew):
    def __init__(self):
        super().__init__(nm.mnewnumber)
        self.name = 'mnewnumber'
        self.description = '連番データの新規作成'
        self.params.append(Parameter('a', '新規作成する連番行の項目名(必須)'))
        self.params.append(Parameter('I', '連番を振る間隔'))
        self.params.append(Parameter('S', '開始数値/アルファベット(大文字)'))
        self.params.append(Parameter('l', '作成するデータ行数'))

class MnewnumberOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnewnumber'
        self.description = '連番データの新規作成'
        self.params.append(Parameter('a', '新規作成する連番行の項目名(必須)'))
        self.params.append(Parameter('I', '連番を振る間隔'))
        self.params.append(Parameter('S', '開始数値/アルファベット(大文字)'))
        self.params.append(Parameter('l', '作成するデータ行数'))

class Mnewrand(MCommandNew):
    def __init__(self):
        super().__init__(nm.mnewrand)
        self.name = 'mnewrand'
        self.description = '乱数データの新規作成'
        self.params.append(Parameter('a', '新規作成する連番行の項目名(必須)'))
        self.params.append(Parameter('max', '乱数の最大値'))
        self.params.append(Parameter('min', '乱数の最小値'))
        self.params.append(Parameter('l', '作成するデータ行数'))
        self.params.append(Parameter('S', '乱数の種を指定する'))

class MnewrandOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnewrand'
        self.description = '乱数データの新規作成'
        self.params.append(Parameter('a', '新規作成する連番行の項目名(必須)'))
        self.params.append(Parameter('max', '乱数の最大値'))
        self.params.append(Parameter('min', '乱数の最小値'))
        self.params.append(Parameter('l', '作成するデータ行数'))
        self.params.append(Parameter('S', '乱数の種を指定する'))

class Mnewstr(MCommandNew):
    def __init__(self):
        super().__init__(nm.mnewstr)
        self.name = 'mnewstr'
        self.description = '固定文字列データの新規作成'
        self.params.append(Parameter('a', '新規作成する連番行の項目名(必須)'))
        self.params.append(Parameter('v', '新しく作成する文字列'))
        self.params.append(Parameter('l', '作成するデータ行数'))

class MnewstrOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnewstr'
        self.description = '固定文字列データの新規作成'
        self.params.append(Parameter('a', '新規作成する連番行の項目名(必須)'))
        self.params.append(Parameter('v', '新しく作成する文字列'))
        self.params.append(Parameter('l', '作成するデータ行数'))

class Mnjoin(MCommandNew):
    def __init__(self):
        super().__init__(nm.mnjoin)

        self.name = 'mnjoin'
        self.description = '参照ファイル列の結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MnjoinOld(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mnjoin'
        self.description = '参照ファイル列の結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mrjoin(MCommandNew):
    def __init__(self):
        super().__init__(nm.mrjoin)

        self.name = 'mrjoin'
        self.description = '参照ファイル列の範囲条件結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MrjoinOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mrjoin'
        self.description = '参照ファイルの範囲条件結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")
        res.append(f"f={args['r']}")
        res.append(f"K={args['R']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mnrjoin(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mnrjoin)

        self.name = 'mnrjoin'
        self.description = '参照ファイルのの複数範囲条件結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MnrjoinOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mnrjoin'
        self.description = '参照ファイルのの複数範囲条件結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")
        res.append(f"f={args['r']}")
        res.append(f"K={args['R']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mvjoin(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvjoin)
        self.name = 'mvjoin'
        self.description = 'ベクトル要素の参照結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MvjoinOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvjoin'
        self.description = 'ベクトル要素の参照結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"K={args['K']}")
        res.append(f"f={args['f']}")
        res.append(f"f={args['vf']}")
        res.append(f"K={args['n']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mvreplace(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvreplace)
        self.name = 'mvreplace'
        self.description = 'ベクトル要素の参照置換'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MvreplaceOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvreplace'
        self.description = 'ベクトル要素の参照置換'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"K={args['K']}")
        res.append(f"f={args['f']}")
        res.append(f"f={args['vf']}")
        res.append(f"K={args['n']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mpaste(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mpaste)
        self.name = 'mpaste'
        self.description = '参照ファイル列の行番号マッチング結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MpasteOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mpaste'
        self.description = '参照ファイル列の行番号マッチング結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"f={args['f']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mproduct(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mproduct)
        self.name = 'mproduct'
        self.description = '参照ファイルの直積結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

class MproductOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mproduct'
        self.description = '参照ファイルの直積結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"f={args['f']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mcommon(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mcommon)
        self.name = 'mcommon'
        self.description = '行選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.disagree_output = str(uuid.uuid4())
        self.disagre_source = None

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class McommonOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mcommon'
        self.description = '行選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mnrcommon(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mnrcommon)
        self.name = 'mnrcommon'
        self.description = '参照ファイルの複数範囲条件による行選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.disagree_output = str(uuid.uuid4())
        self.disagre_source = None

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MnrcommonOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mnrcommon'
        self.description = '参照ファイルの複数範囲条件による行選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"K={args['K']}")
        res.append(f"k={args['r']}")
        res.append(f"K={args['R']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mvcommon(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvcommon)
        self.name = 'mvcommon'
        self.description = 'ベクトル要素の参照選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        input_m = inputs['m']
        if isinstance(input_m.source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        return args_for_nysol, process_flow


class MvcommonOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvcommon'
        self.description = 'ベクトル要素の参照選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['vf']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mfsort(MCommandNew):
    def __init__(self):
        super().__init__(nm.mfsort)
        self.name = 'mfsortf'
        self.desription = '項目ソート'
        self.params.append(Parameter('f', '対象列名(必須)'))

class MfsortOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mfsortf'
        self.desription = '項目ソート'
        self.params.append(Parameter('f', '対象列名(必須)'))

class Mfldname(MCommandNew):
    def __init__(self):
        super().__init__(nm.mfldname)
        self.name = 'mfldname'
        self.description = '列名の変更'
        self.params.append(Parameter('f', '旧列名(必須)'))
        self.params.append(Parameter('n', '新列名'))

class MfldnameOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mfldname'
        self.description = '列名の変更'
        self.params.append(Parameter('f', '旧列名(必須)'))
        self.params.append(Parameter('n', '新列名'))

class Mrand(MCommandNew):
    def __init__(self):
        super().__init__(nm.mrand)
        self.name = 'mrand'
        self.description = '擬似乱数'
        self.params.append(Parameter('k', '指定キーと同名のキー値に同じラン数値'))
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('max', '乱数の最大値、この値の指定時には-intも設定することが必須'))
        self.params.append(Parameter('min', '乱数の最小値、この値の指定時には-intも設定することが必須'))
        self.params.append(Parameter('S', '乱数の種'))

class MrandOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mrand'
        self.description = '擬似乱数'
        self.params.append(Parameter('k', '指定キーと同名のキー値に同じラン数値'))
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('max', '乱数の最大値、この値の指定時には-intも設定することが必須'))
        self.params.append(Parameter('min', '乱数の最小値、この値の指定時には-intも設定することが必須'))
        self.params.append(Parameter('S', '乱数の種'))

class Mshare(MCommandNew):#edit
    def __init__(self):
        super().__init__(nm.mshare)
        self.name = 'mshare'
        self.description = '構成費の計算'
        self.params.append(Parameter('f', '指定列の構成比計算(必須)'))
        self.params.append(Parameter('k', '構成比計算の単位となる列名'))

class MshareOld(MCommand):#edit
    def __init__(self):
        super().__init__()
        self.name = 'mshare'
        self.description = '構成費の計算'
        self.params.append(Parameter('f', '指定列の構成比計算(必須)'))
        self.params.append(Parameter('k', '構成比計算の単位となる列名'))

class Msplit(MCommandNew):
    def __init__(self):
        super().__init__(nm.msplit)
        self.name = 'msplit'
        self.desription = '区切り文字による列分割'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('a', '新項目名(必須)'))
        self.params.append(Parameter('delim', '新しい区切り文字'))

class MsplitOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msplit'
        self.desription = '区切り文字による列分割'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('a', '新項目名(必須)'))
        self.params.append(Parameter('delim', '新しい区切り文字'))

class Mvcat(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvcat)
        self.name = 'mvcat'
        self.description = 'ベクトルの併合'
        self.params.append(Parameter('vf', '併合するベクトル列名(必須)'))
        self.params.append(Parameter('a', '併合後の列名(必須)'))

class MvcatOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvcat'
        self.description = 'ベクトルの併合'
        self.params.append(Parameter('vf', '併合するベクトル列名(必須)'))
        self.params.append(Parameter('a', '併合後の列名(必須)'))

class Mvcount(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvcount)
        self.name = 'mvcount'
        self.description = 'ベクトルサイズの計算'
        self.params.append(Parameter('vf', '要素数をカウントするベクトルの列名(必須)'))

class MvcountOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvcount'
        self.description = 'ベクトルサイズの計算'
        self.params.append(Parameter('vf', '要素数をカウントするベクトルの列名(必須)'))

class Marff2csv(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.marff2csv)
        self.name = 'marff2csv'
        self.description = 'arffからcsv形式への変換'

class Marff2csvOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'marff2csv'
        self.description = 'arffからcsv形式への変換'

class Mcsv2arff(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'mcsv2marff'
        self.description = 'csvからarff形式への変換'
        self.params.append(Parameter('n', '数値列名(必須)'))
        self.params.append(Parameter('d', 'カテゴリ列名(必須)'))
        self.params.append(Parameter('D', '日付列名リスト(必須)'))
        self.params.append(Parameter('s', '文字列列名(必須)'))
        self.params.append(Parameter('T', 'タイトル名'))

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        # 文字列のコマンドを作成する
        args_list = self.name
        for key,value in args_for_nysol.items():
            if isinstance(value, bool):
                if value == True:
                    args_list +=  ' -' + key
            else:
                args_list += ' %s=%s' % (key, value)
        return args_list, process_flow

    def source(self, args, inputs):
        args, process_flow= self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, ' o=')

class Mcsv2arffOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mcsv2marff'
        self.description = 'csvからarff形式への変換'
        self.params.append(Parameter('n', '数値列名(必須)'))
        self.params.append(Parameter('d', 'カテゴリ列名(必須)'))
        self.params.append(Parameter('D', '日付列名リスト(必須)'))
        self.params.append(Parameter('s', '文字列列名(必須)'))
        self.params.append(Parameter('T', 'タイトル名'))

class Mtab2csv(MCommandNew):
    def __init__(self):
        super().__init__(nm.mtab2csv)
        self.name = 'mtab2csv'
        self.desription = 'TSVからCSVデータへの変換'
        self.params.append(Parameter('d', '区切り文字'))

class Mtab2csvOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtab2csv'
        self.desription = 'TSVからCSVデータへの変換'
        self.params.append(Parameter('d', '区切り文字'))

class Mxml2csv(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mxml2csv)
        self.name = 'mxml2csv'
        self.description = 'xmlからcsv形式への変換'
        self.params.append(Parameter('k', '１行の単位となる要素のパス名(必須)'))
        self.params.append(Parameter('f', '要素もしくは属性の指定(必須)'))
        self.params.append(Parameter('i', 'xmlデータファイル'))

class Mxml2csvOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mxml2csv'
        self.description = 'xmlからcsv形式への変換'
        self.params.append(Parameter('k', '１行の単位となる要素のパス名(必須)'))
        self.params.append(Parameter('f', '要素もしくは属性の指定(必須)'))
        self.params.append(Parameter('i', 'xmlデータファイル'))

class Mbest(MCommandNew):
    def __init__(self):
        super().__init__(nm.mbest)
        self.name = 'mbest'
        self.description = '指定行選択'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('s', 'ソート対象列名(必須)'))
        self.params.append(Parameter('from', '選択する開始行番号'))
        self.params.append(Parameter('to', '選択する終了行番号'))
        self.params.append(Parameter('size', '選択する行数'))
        self.params.append(Parameter('k', '指定列が同じ値の行ごとにfrom=,to=,sizeで指定した行番号の行を選択'))

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MbestOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mbest'
        self.description = '指定行選択'
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('s', 'ソート対象列名(必須)'))
        self.params.append(Parameter('from', '選択する開始行番号'))
        self.params.append(Parameter('to', '選択する終了行番号'))
        self.params.append(Parameter('size', '選択する行数'))
        self.params.append(Parameter('k', '指定列が同じ値の行ごとにfrom=,to=,sizeで指定した行番号の行を選択'))#???
        # self.params.append(Parameter('u', '条件に合わないデータ出力ファイル名'))

class Mdelnull(MCommandNew):
    def __init__(self):
        super().__init__(nm.mdelnull)
        self.name = 'mdelnull'
        self.description = 'NULL行削除'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('k', '削除する単位となるキー列名'))
        self.disagree_output = str(uuid.uuid4())
        self.disagre_source = None

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MdelnullOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mdelnull'
        self.description = 'NULL行削除'
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('k', '削除する単位となるキー列名'))
        # self.params.append(Parameter('u', '条件に合わないデータ出力ファイル名'))

class Mduprec(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mduprec)
        self.name = 'mduprec'
        self.description = 'レコードの複写'
        self.params.append(Parameter('f', '指定列の値の回数分の複写を実行(選択必須)'))
        self.params.append(Parameter('n', '各行の複写回数(選択必須)'))

class MduprecOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mduprec'
        self.description = 'レコードの複写'
        self.params.append(Parameter('f', '指定列の値の回数分の複写を実行(選択必須)'))
        self.params.append(Parameter('n', '各行の複写回数(選択必須)'))

class Mpadding(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mpadding)
        self.name = 'mpadding'
        self.description = '行補完コマンド'
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('f', '連続パディング対象列名(必須)'))
        self.params.append(Parameter('v', 'パディング用文字列'))
        self.params.append(Parameter('S', '開始値'))
        self.params.append(Parameter('E', '終了値'))

class MpaddingOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mpadding'
        self.description = '行補完コマンド'
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('f', '連続パディング対象列名(必須)'))
        self.params.append(Parameter('v', 'パディング用文字列'))
        self.params.append(Parameter('S', '開始値'))
        self.params.append(Parameter('E', '終了値'))

class Mselnum(MCommandNew):
    def __init__(self):
        super().__init__(nm.mselnum)
        self.name = 'mselnum'
        self.description = '数値範囲による行選択'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '検索列名(必須)'))
        self.params.append(Parameter('c', '検索文字列(必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列名'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MselnumOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mselnum'
        self.description = '数値範囲による行選択'
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '検索列名(必須)'))
        self.params.append(Parameter('c', '検索文字列(必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列名'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

class Mselrand(MCommandNew):
    def __init__(self):
        super().__init__(nm.mselrand)
        self.name = 'mselrand'
        self.description = 'ランダムな行選択'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('c', '各キーの値毎に選択する行数(選択必須)'))
        self.params.append(Parameter('p', '各キーを選択する割合をパーセンテージで指定(選択必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列'))
        self.params.append(Parameter('S', '乱数の種'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

    def execute(self, args, inputs):
        source = self.source(args, inputs)
        # 不一致出力データソース
        source_for_u = self.source(args, inputs, multi_out=True)

        for input in inputs.values():
            if isinstance(input.source, PathFileSource):
                source.deletable_uuids.append(input.uuid)
            elif isinstance(input.source, UnixCommandSource) or \
                 isinstance(input.source, PandasSource) or \
                 isinstance(input.source, NysolPythonSource):
                source.deletable_uuids = input.source.deletable_uuids
                source.deletable_uuids.append(input.uuid)

        # uが直書きだが、一致をi不一致をuに結びつけるものがないので、このままでいいかなと思っています。
        return { self.out_key:  Frame(str(uuid.uuid4()), source) ,'u': Frame(str(uuid.uuid4()), source_for_u)}

    def source(self, args, inputs, multi_out=False):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, multi_out=multi_out)

class MselrandOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mselrand'
        self.description = 'ランダムな行選択'
        # self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('c', '各キーの値毎に選択する行数(選択必須)'))
        self.params.append(Parameter('p', '各キーを選択する割合をパーセンテージで指定(選択必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列'))
        self.params.append(Parameter('S', '乱数の種'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

class Muniq(MCommandNew):
    def __init__(self):
        super().__init__(nm.muniq)
        self.name = 'muniq'
        self.description = '単一化'
        self.params.append(Parameter('k', 'キー列名'))

class MuniqOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'muniq'
        self.description = '単一化'
        self.params.append(Parameter('k', 'キー列名'))

class Maccum(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.maccum)
        self.name = 'maccum'
        self.description = '累積計算'
        self.params.append(Parameter('f', '累積列名(必須)'))
        self.params.append(Parameter('s', '並び替えの後、累積計算を行う列名(必須)'))
        self.params.append(Parameter('k', '累積単位となる列名'))

class MaccumOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'maccum'
        self.description = '累積計算'
        self.params.append(Parameter('f', '累積列名(必須)'))
        self.params.append(Parameter('s', '並び替えの後、累積計算を行う列名(必須)'))
        self.params.append(Parameter('k', '累積単位となる列名'))

class Mcount(MCommandNew):
    def __init__(self):
        super().__init__(nm.mcount)
        self.name = 'mcount'
        self.description = '行数カウント'
        self.params.append(Parameter('k', '対象列名'))
        self.params.append(Parameter('a', '結果列名(必須)'))

class McountOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcount'
        self.description = '行数カウント'
        self.params.append(Parameter('k', '対象列名'))
        self.params.append(Parameter('a', '結果列名(必須)'))

class Mhashavg(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mhashavg)
        self.name = 'mhashavg'
        self.description = 'ハッシュ法による列値の平均'
        self.params.append(Parameter('f', '平均を求める列名(必須)'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('hs', 'ハッシュサイズ'))

class MhashavgOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mhashavg'
        self.description = 'ハッシュ法による列値の平均'
        self.params.append(Parameter('f', '平均を求める列名(必須)'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('hs', 'ハッシュサイズ'))

class Mhashsum(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mhashsum)
        self.name = 'mhashsum'
        self.description = 'ハッシュ法による列の値の合計'
        self.params.append(Parameter('f', '合計を求める列名(必須)'))
        self.params.append(Parameter('k', 'キーとする列名'))
        self.params.append(Parameter('hs', 'ハッシュサイズ'))

class MhashsumOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mhashsum'
        self.description = 'ハッシュ法による列の値の合計'
        self.params.append(Parameter('f', '合計を求める列名(必須)'))
        self.params.append(Parameter('k', 'キーとする列名'))
        self.params.append(Parameter('hs', 'ハッシュサイズ'))

class Mkeybreak(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mkeybreak)
        self.name = 'mkeybreak'
        self.description = 'キーブレイク箇所'
        self.params.append(Parameter('k', '集計キー列名(必須)'))
        self.params.append(Parameter('s', '並べ替えの後、先端、終端に印をつける列名'))
        self.params.append(Parameter('a', '先端と終端の印を出力する列名'))

class MkeybreakOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mkeybreak'
        self.description = 'キーブレイク箇所'
        self.params.append(Parameter('k', '集計キー列名(必須)'))
        self.params.append(Parameter('s', '並べ替えの後、先端、終端に印をつける列名'))
        self.params.append(Parameter('a', '先端と終端の印を出力する列名'))

class Mmvavg(MCommandNew):#editting(判断を仰ぐ、多分大丈夫やと思うけどね)
    def __init__(self):
        super().__init__(nm.mmvavg)
        self.name = 'mmvavg'
        self.description = '移動平均の算出'
        self.params.append(Parameter('s', '並べ替えの後、移動平均を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '移動平均を求める列名(必須)'))
        self.params.append(Parameter('t', '期間数の指定、alpha=指定時には設定できない'))
        self.params.append(Parameter('alpha', '平滑化係数、-exp指定時のみ'))
        self.params.append(Parameter('skip', '出力を抑制する最初の行数'))

class MmvavgOld(MCommand):#editting(判断を仰ぐ、多分大丈夫やと思うけどね)
    def __init__(self):
        super().__init__()
        self.name = 'mmvavg'
        self.description = '移動平均の算出'
        self.params.append(Parameter('s', '並べ替えの後、移動平均を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '移動平均を求める列名(必須)'))
        self.params.append(Parameter('t', '期間数の指定、alpha=指定時には設定できない'))
        self.params.append(Parameter('alpha', '平滑化係数、-exp指定時のみ'))
        self.params.append(Parameter('skip', '出力を抑制する最初の行数'))

class Mmvsim(MCommandNew):#editting
    def __init__(self):
        super().__init__(nm.mmvsim)
        self.name = 'mmvsim'
        self.description = '移動窓の類似度計算'
        self.params.append(Parameter('s', '並べ替えの後、各種類似度を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('t', '期間数の指定'))
        self.params.append(Parameter('c', '類似度名を指定(必須)'))#コマンド指定
        self.params.append(Parameter('a', '新規に作成する項目名(必須)'))
        #類似度名はあらかじめ決められている。
        #類似度=covar|ucovar|pearson|spearman|kendall|euclid|cosine|
        #cityblock|hamming|chi|phi|jaccard|supportr|lift|confMax|
        #confMin|yuleQ|yuleY|kappa|oddsRatio|convMax|convMin
        self.params.append(Parameter('skip', '出力抑制を行う最初の行数指定'))

class MmvsimOld(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'mmvsim'
        self.description = '移動窓の類似度計算'
        self.params.append(Parameter('s', '並べ替えの後、各種類似度を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('t', '期間数の指定'))
        self.params.append(Parameter('c', '類似度名を指定(必須)'))#コマンド指定
        self.params.append(Parameter('a', '新規に作成する項目名(必須)'))
        #類似度名はあらかじめ決められている。
        #類似度=covar|ucovar|pearson|spearman|kendall|euclid|cosine|
        #cityblock|hamming|chi|phi|jaccard|supportr|lift|confMax|
        #confMin|yuleQ|yuleY|kappa|oddsRatio|convMax|convMin
        self.params.append(Parameter('skip', '出力抑制を行う最初の行数指定'))

class Mmvstats(MCommandNew):#editting
    def __init__(self):
        super().__init__(nm.mmvstats)
        self.name = 'mmvstats'
        self.description = '移動窓の統計量の計算'
        self.params.append(Parameter('s', '並べ替えの後、各種統計量を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('t', '期関数の指定'))
        self.params.append(Parameter('c', '統計量を指定(必須)'))#コマンド指定
        #統計量はあらかじめ決められている
        # 統計量リスト:sum/mean/count/ucount/devsq/var/uvar/sd/usd/cv/min/qtile1/median/qtile3/max/
        # range/qrange/mode/skew/uskew/kurt/ukurt
        self.params.append(Parameter('skip', '出力抑制を行う最初の行数指定'))

class MmvstatsOld(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'mmvstats'
        self.description = '移動窓の統計量の計算'
        self.params.append(Parameter('s', '並べ替えの後、各種統計量を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('t', '期関数の指定'))
        self.params.append(Parameter('c', '統計量を指定(必須)'))#コマンド指定
        #統計量はあらかじめ決められている
        # 統計量リスト:sum/mean/count/ucount/devsq/var/uvar/sd/usd/cv/min/qtile1/median/qtile3/max/
        # range/qrange/mode/skew/uskew/kurt/ukurt
        self.params.append(Parameter('skip', '出力抑制を行う最初の行数指定'))

class Mnormalize(MCommandNew):#editting
    def __init__(self):
        super().__init__(nm.mnormalize)
        self.name = 'mnormalize'
        self.description = '基準化'
        self.params.append(Parameter('c', '基準化方法を指定(必須)'))#二者択一
        self.params.append(Parameter('f', '基準化列名(必須)'))
        self.params.append(Parameter('k', '単位とする列名'))

class MnormalizeOld(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'mnormalize'
        self.description = '基準化'
        self.params.append(Parameter('c', '基準化方法を指定(必須)'))#二者択一
        self.params.append(Parameter('f', '基準化列名(必須)'))
        self.params.append(Parameter('k', '単位とする列名'))

class Msim(MCommandNew):#editting
    def __init__(self):
        super().__init__(nm.msim)
        self.name = 'msim'
        self.description = '二変数間の類似度の計算'
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '二列間の類似度を求める列名(必須)'))
        self.params.append(Parameter('c', '類似度名を指定(必須)'))
        #類似度名はあらかじめ決められている。
        #類似度=covar|ucovar|pearson|spearman|kendall|euclid|cosine|
        #cityblock|hamming|chi|phi|jaccard|supportr|lift|confMax|
        #confMin|yuleQ|yuleY|kappa|oddsRatio|convMax|convMin
        self.params.append(Parameter('a', '二変数の名前の指定'))

class MsimOld(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'msim'
        self.description = '二変数間の類似度の計算'
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '二列間の類似度を求める列名(必須)'))
        self.params.append(Parameter('c', '類似度名を指定(必須)'))
        #類似度名はあらかじめ決められている。
        #類似度=covar|ucovar|pearson|spearman|kendall|euclid|cosine|
        #cityblock|hamming|chi|phi|jaccard|supportr|lift|confMax|
        #confMin|yuleQ|yuleY|kappa|oddsRatio|convMax|convMin
        self.params.append(Parameter('a', '二変数の名前の指定'))

class Mslide(MCommandNew):
    def __init__(self):
        super().__init__(nm.mslide)
        self.name = 'mslide'
        self.description = '行ずらし'
        self.params.append(Parameter('s', 'ソート対象列名'))
        self.params.append(Parameter('f', 'ずらす対象の列名(必須)'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('t', 'ずらす回数'))

class MslideOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mslide'
        self.description = '行ずらし'
        self.params.append(Parameter('s', 'ソート対象列名'))
        self.params.append(Parameter('f', 'ずらす対象の列名(必須)'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('t', 'ずらす回数'))

class Mwindow(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mwindow)
        self.name = 'mwindow'
        self.description = 'スライド窓の生成'
        self.params.append(Parameter('wk', '出力データにおける、窓を識別する値となる入力データの列名(必須)'))
        self.params.append(Parameter('t', '窓の行数指定(必須)'))
        self.params.append(Parameter('k', '窓を生成する単位となる列名'))

class MwindowOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mwindow'
        self.description = 'スライド窓の生成'
        self.params.append(Parameter('wk', '出力データにおける、窓を識別する値となる入力データの列名(必須)'))
        self.params.append(Parameter('t', '窓の行数指定(必須)'))
        self.params.append(Parameter('k', '窓を生成する単位となる列名'))

class Mcombi(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mcombi)
        self.name = 'mcombi'
        self.description = '組合せ計算'
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('f', '組み合わせ列名(必須)'))
        self.params.append(Parameter('n', '組み合わせ数(必須)'))
        self.params.append(Parameter('s', '並び替えの後、f=で指定の列の組み合わせを求める列名'))
        self.params.append(Parameter('k', 'キー列名'))

class McombiOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mcombi'
        self.description = '組合せ計算'
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('f', '組み合わせ列名(必須)'))
        self.params.append(Parameter('n', '組み合わせ数(必須)'))
        self.params.append(Parameter('s', '並び替えの後、f=で指定の列の組み合わせを求める列名'))
        self.params.append(Parameter('k', 'キー列名'))

class Mtra(MCommandNew):
    def __init__(self):
        super().__init__(nm.mtra)
        self.name = 'mtra'
        self.description = '縦横変換'
        self.params.append(Parameter('k', '変換キー列名'))
        self.params.append(Parameter('s', '並び替えの後、変換を行う列名'))
        self.params.append(Parameter('f', '連結前列名:連結後列名(必須)'))

class MtraOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtra'
        self.description = '縦横変換'
        self.params.append(Parameter('k', '変換キー列名'))
        self.params.append(Parameter('s', '並び替えの後、変換を行う列名'))
        self.params.append(Parameter('f', '連結前列名:連結後列名(必須)'))

class Mtrafld(MCommandNew):#mtraflgと名前がダブる
    def __init__(self):
        super().__init__(nm.mtrafld)
        self.name = 'mtrafld'
        self.description = 'クロス表をトランザクション項目に変換(Mtrafld)'
        self.params.append(Parameter('a', 'トランザクション列名(必須)'))
        self.params.append(Parameter('f', '列名リスト'))
        self.params.append(Parameter('delim', 'トランザクション項目アイテムを区切る文字列'))
        self.params.append(Parameter('delim2', '項目名と値ペアを区切る文字列'))

class MtrafldOld(MCommand):#mtraflgと名前がダブる
    def __init__(self):
        super().__init__()
        self.name = 'mtrafld'
        self.description = 'クロス表をトランザクション項目に変換(Mtrafld)'
        self.params.append(Parameter('a', 'トランザクション列名(必須)'))
        self.params.append(Parameter('f', '列名リスト'))
        self.params.append(Parameter('delim', 'トランザクション項目アイテムを区切る文字列'))
        self.params.append(Parameter('delim2', '項目名と値ペアを区切る文字列'))

class Mtraflg(MCommandNew):#mtrafldと名前がダブる
    def __init__(self):
        super().__init__(nm.mtraflg)
        self.name = 'mtraflg'
        self.description = 'クロス表をトランザクション項目に変換(Mtraflg)'
        self.params.append(Parameter('a', 'トランザクション列名(必須)'))
        self.params.append(Parameter('f', '列名リスト(必須)'))
        self.params.append(Parameter('delim', 'トランザクション項目アイテムを区切る文字'))

class MtraflgOld(MCommand):#mtrafldと名前がダブる
    def __init__(self):
        super().__init__()
        self.name = 'mtraflg'
        self.description = 'クロス表をトランザクション項目に変換(Mtraflg)'
        self.params.append(Parameter('a', 'トランザクション列名(必須)'))
        self.params.append(Parameter('f', '列名リスト(必須)'))
        self.params.append(Parameter('delim', 'トランザクション項目アイテムを区切る文字'))

class Mchgnum(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mchgnum)
        self.name = 'mchgnum'
        self.description = '数値範囲による置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('R', '置換対象となる数値範囲(必須)'))
        self.params.append(Parameter('O', '範囲外文字列'))
        self.params.append(Parameter('v', 'R=に対応する置換文字列'))

class MchgnumOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mchgnum'
        self.description = '数値範囲による置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('R', '置換対象となる数値範囲(必須)'))
        self.params.append(Parameter('O', '範囲外文字列'))
        self.params.append(Parameter('v', 'R=に対応する置換文字列'))

class Mchgstr(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mchgstr)
        self.name = 'mchgnum'
        self.description = '文字列の置換'
        self.params.append(Parameter('c', '置換対象となる文字列と対応する置換文字列(必須)'))
        self.params.append(Parameter('f', '置換対象列(必須)'))
        self.params.append(Parameter('O', 'c=に無い文字列を置換する場合の文字列'))

class MchgstrOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mchgnum'
        self.description = '文字列の置換'
        self.params.append(Parameter('c', '置換対象となる文字列と対応する置換文字列(必須)'))
        self.params.append(Parameter('f', '置換対象列(必須)'))
        self.params.append(Parameter('O', 'c=に無い文字列を置換する場合の文字列'))

class Mdformat(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mdformat)
        self.name = 'mdformat'
        self.description = '日付時刻抽出'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('c', '文字列のフォーマット(必須)'))

class MdformatOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mdformat'
        self.description = '日付時刻抽出'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('c', '文字列のフォーマット(必須)'))

class Mnullto(MCommandNew):
    def __init__(self):
        super().__init__(nm.mnullto)
        self.name = 'mnullto'
        self.description = 'NULL置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '置換後の文字列'))
        self.params.append(Parameter('O', 'NULL値以外を置換する文字列'))

class MnulltoOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnullto'
        self.description = 'NULL置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '置換後の文字列'))
        self.params.append(Parameter('O', 'NULL値以外を置換する文字列'))

class Msed(MCommandNew):
    def __init__(self):
        super().__init__(nm.msed)
        self.name = 'msed'
        self.description = '文字列置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('c', '変換パターン(必須)'))
        self.params.append(Parameter('v', '変換後文字列(必須)'))

class MsedOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msed'
        self.description = '文字列置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('c', '変換パターン(必須)'))
        self.params.append(Parameter('v', '変換後文字列(必須)'))

class Mtonull(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mtonull)
        self.name = 'mtonull'
        self.description = 'NULL値へ置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '変換前文字列(必須)'))

class MtonullOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mtonull'
        self.description = 'NULL値へ置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '変換前文字列(必須)'))

class Mvdelim(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvdelim)
        self.name = 'mvdelim'
        self.description = 'ベクトル要素の区切り文字変更'
        self.params.append(Parameter('vf', '対象列名(必須)'))
        self.params.append(Parameter('v', '新しい区切り文字(必須)'))

class MvdelimOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvdelim'
        self.description = 'ベクトル要素の区切り文字変更'
        self.params.append(Parameter('vf', '対象列名(必須)'))
        self.params.append(Parameter('v', '新しい区切り文字(必須)'))

class Mvdelnull(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvdelnull)
        self.name = 'mvdelnull'
        self.description = 'ベクトル要素のNULL要素削除'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class MvdelnullOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvdelnull'
        self.description = 'ベクトル要素のNULL要素削除'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class Mvnullto(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvnullto)
        self.name = 'mvnullto'
        self.description = 'ベクトル要素のNULL置換'
        self.params.append(Parameter('vf', '対象列名(必須)'))
        self.params.append(Parameter('v', '置換文字列'))
        self.params.append(Parameter('O', 'NULL以外の全要素を置換する文字列'))

class MvnulltoOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvnullto'
        self.description = 'ベクトル要素のNULL置換'
        self.params.append(Parameter('vf', '対象列名(必須)'))
        self.params.append(Parameter('v', '置換文字列'))
        self.params.append(Parameter('O', 'NULL以外の全要素を置換する文字列'))

class Mvsort(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvsort)
        self.name = 'mvsort'
        self.description = 'ベクトル要素のソート'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class MvsortOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvsort'
        self.description = 'ベクトル要素のソート'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class Mvuniq(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mvuniq)
        self.name = 'mvuniq'
        self.description = 'ベクトル要素の単一化'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class MvuniqOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvuniq'
        self.description = 'ベクトル要素の単一化'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class Mchkcsv(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'mchkcsv'
        self.description = 'csvデータのチェック・修復'
        self.params.append(Parameter('i', '入力ファイル名'))
        self.params.append(Parameter('a', '入力データ列を無視する、新しい列名'))

    def command_args(self, args, inputs):
        args_for_nysol = args
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        # 文字列のコマンドを作成する
        args_list = self.name
        for key,value in args_for_nysol.items():
            if isinstance(value, bool):
                if value == True:
                    args_list +=  ' -' + key
            else:
                args_list += ' %s=%s' % (key, value)

        return args_list, process_flow

    def source(self, args, inputs):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource('csv', self.nysol_mod, args, process_flow, ' o=')

class MchkcsvOld(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mchkcsv'
        self.description = 'csvデータのチェック・修復'
        self.params.append(Parameter('i', '入力ファイル名'))
        self.params.append(Parameter('a', '入力データ列を無視する、新しい列名'))

# KCMD
class KCommand(UnixCommand):
    def __init__(self, nysol_mod):
        super().__init__()
        self.nysol_mod = nysol_mod
        self.output_ext = 'csv'
        self.stdout_param = ' -o '

    def command_args(self, args, inputs):
        cl_args = self.command_path
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            cl_args += ' -i ' + inputs['i'].source.fullpath.as_posix()
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        # nm.cmd用の文字列のコマンドを作成する
        for key, value in args.items():
            if not len(value) == 0:
                # 短い引数と長い引数をlen(key) > 1で判断しているがゴリ押し感があるので別の書き方があれば書き換えて下さい。
                cl_args += ' --' if len(key) > 1 else ' -'
                cl_args += key + ' ' + value
        return cl_args, process_flow

    def source(self, args, inputs):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource(self.output_ext, self.nysol_mod, args, process_flow, self.stdout_param)

class SelectTargetColumn(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'SelectTargetColumn'
        self.command_path = '/kskp/engine/commands/kcmd/preprocess/selecttargetcolumn.py'
        self.description = ''
        self.params.append(Parameter('t', '対象の列を選択'))# todo 何が言いたいのかが分からない

class SelectTargetColumnOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'SelectTargetColumn'
        self.description = ''
        self.params.append(Parameter('t', '対象の列を選択'))# todo 何が言いたいのかが分からない

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.preprocess.selecttargetcolumn import SelectTargetColumn as Base
        command = Base()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        # command.main()では空の引数
        for key, value in args.items():
            if not len(value) == 0:
                # 短い引数と長い引数をlen(key) > 1で判断しているがゴリ押し感があるので別の書き方があれば書き換えて欲しいです。
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Standardize(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Standardize'
        self.command_path = '/kskp/engine/commands/kcmd/preprocess/standardize.py'
        self.description = ''
        self.output_ext = 'csv'
        self.params.append(Parameter('c', '標準化を行う行を選択'))
        self.params.append(Parameter('a', '全列に適用させるかどうか'))

class StandardizeOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Standardize'
        self.description = ''
        self.params.append(Parameter('c', '標準化を行う行を選択'))
        self.params.append(Parameter('a', '全列に適用させるかどうか'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.preprocess.standardize import Standardize as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Label_encode(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Label_encode'
        self.command_path = '/kskp/engine/commands/kcmd/preprocess/label_encode.py'
        self.description = ''
        self.output_ext = 'csv'
        self.params.append(Parameter('c', '標準化を行う行を選択'))

class Label_encodeOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Label_encode'
        self.description = ''
        self.params.append(Parameter('c', '標準化を行う行を選択'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.preprocess.label_encode import Label_encode as Base
        command = Base()
        inputs['i'].command_to_file()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Normalize(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Normalize'
        self.command_path = '/kskp/engine/commands/kcmd/preprocess/normalize.py'
        self.description = ''
        self.output_ext = 'csv'
        self.params.append(Parameter('c', '正規化を行う列を選択'))
        self.params.append(Parameter('a', '全列に適用させるかどうか'))

class NormalizeOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Normalize'
        self.description = ''
        self.params.append(Parameter('c', '標準化を行う列を選択'))
        self.params.append(Parameter('a', '全列に適用させるかどうか'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.preprocess.normalize import Normalize as Base
        command = Base()
        inputs['i'].command_to_file()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class One_hot_encode(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'One_hot_encode'
        self.command_path = '/kskp/engine/commands/kcmd/preprocess/one_hot_encode.py'
        self.description = ''
        self.output_ext = 'csv'
        self.params.append(Parameter('c', '標準化を行う行を選択'))

class One_hot_encodeOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'One_hot_encode'
        self.description = ''
        self.params.append(Parameter('c', '標準化を行う行を選択'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.preprocess.one_hot_encode import One_hot_encode as Base
        command = Base()
        inputs['i'].command_to_file()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Pca(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Pca'
        self.command_path = '/kskp/engine/commands/kcmd/preprocess/pca.py'
        self.description = ''
        self.output_ext = 'csv'
        self.params.append(Parameter('n_components', '保持するコンポーネント数（デフォルト：2）'))

class PcaOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Pca'
        self.description = ''
        self.params.append(Parameter('n_components', '保持するコンポーネント数（デフォルト：2）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.preprocess.pca import Pca as Base
        command = Base()
        inputs['i'].command_to_file()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Kkmeans(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Kkmeans'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/clustering/kkmeans.py'
        self.description = 'k-means法によるクラスタ分析'
        self.output_ext = 'csv'
        self.params.append(Parameter('n_clusters', 'クラスタ数（デフォルト：8）'))
        self.params.append(Parameter('n_init', '初期値選択において、初期の重心を異なる乱数シードを用いて選ぶ回数（デフォルト：10）'))
        self.params.append(Parameter('max_iter', 'アルゴリズムの繰り返しの最大回数（デフォルト：300）'))
        self.params.append(Parameter('precompute_distances', '距離をあらかじめ計算する（高速ですが、メモリを大量に使用します）（デフォルト：auto）'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))

class KkmeansOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Kkmeans'
        self.description = 'k-means法によるクラスタ分析'
        self.params.append(Parameter('n_clusters', 'クラスタ数（デフォルト：8）'))
        self.params.append(Parameter('n_init', '初期値選択において、初期の重心を異なる乱数シードを用いて選ぶ回数（デフォルト：10）'))
        self.params.append(Parameter('max_iter', 'アルゴリズムの繰り返しの最大回数（デフォルト：300）'))
        self.params.append(Parameter('precompute_distances', '距離をあらかじめ計算する（高速ですが、メモリを大量に使用します）（デフォルト：auto）'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.clustering.kkmeans import Kkmeans as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class CKab(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Ckab'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/kab.py'
        self.description = 'アダブーストによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '学習率'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：SAMME.R）'))#ここ２択、SAMMEとSAMME.R
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト値：50）'))

class CKabOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKab'
        self.description = 'アダブーストによる分類'
        self.params.append(Parameter('l', '学習率'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：SAMME.R）'))#ここ２択、SAMMEとSAMME.R
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト値：50）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.kab import Kab as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKbag(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKbag'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/kbag.py'
        self.description = 'バギングによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '決定木の数（デフォルト値：50）'))
        self.params.append(Parameter('max_samples', 'それぞれの決定木を訓練するために使用するサンプルの数'))
        self.params.append(Parameter('unuse_bootstrap', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))#怪しい
        self.params.append(Parameter('max_features', 'それぞれの決定木を訓練するために使用するサンプルから抽出する特徴量の数（デフォルト：1.0）'))
        self.params.append(Parameter('unuse_bootstrap_features', 'ブートストラップサンプルの特徴量を使用するかどうか（デフォルト：False）'))

class CKbagOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKbag'
        self.description = 'バギングによる分類'
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '決定木の数（デフォルト値：50）'))
        self.params.append(Parameter('max_samples', 'それぞれの決定木を訓練するために使用するサンプルの数'))
        self.params.append(Parameter('unuse_bootstrap', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))#怪しい
        self.params.append(Parameter('max_features', 'それぞれの決定木を訓練するために使用するサンプルから抽出する特徴量の数（デフォルト：1.0）'))
        self.params.append(Parameter('unuse_bootstrap_features', 'ブートストラップサンプルの特徴量を使用するかどうか（デフォルト：False）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.kbag import Kbag as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKdt(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKdt'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/kdt.py'
        self.description = '決定木による分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：gini）'))
        self.params.append(Parameter('r', '乱数のシード値'))

class CKdtOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKdt'
        self.description = '決定木による分類'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：gini）'))
        self.params.append(Parameter('r', '乱数のシード値'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.kdt import Kdt as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKgb(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKgb'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/kgb.py'
        self.description = '勾配ブースティングによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値（デフォルト：3）'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：friedman_mse）'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト：100）'))
        self.params.append(Parameter('loss', '損失関数（デフォルト：deviance）'))

class CKgbOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKgb'
        self.description = '勾配ブースティングによる分類'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値（デフォルト：3）'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：friedman_mse）'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト：100）'))
        self.params.append(Parameter('loss', '損失関数（デフォルト：deviance）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.kgb import Kgb as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKnearestNeighbors(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKnearestNeighbors'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/knearest_neighbors.py'
        self.description = '最近傍法による分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('n_neighbors', '未知のデータを与えた際に、近い順に取得するデータの数、いわゆるkの値（デフォルト：5）'))
        self.params.append(Parameter('weights', '重み付けを行うかどうか（デフォルト：uniform）'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：auto)'))
        self.params.append(Parameter('leaf_size', 'BallTreeまたはKDTreeに渡される葉の大きさ（デフォルト：30）'))
        self.params.append(Parameter('p', 'ミンコフスキー距離を用いた距離計算でのパラメータの値（デフォルト：2）'))

class CKnearestNeighborsOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKnearestNeighbors'
        self.description = '最近傍法による分類'
        self.params.append(Parameter('n_neighbors', '未知のデータを与えた際に、近い順に取得するデータの数、いわゆるkの値（デフォルト：5）'))
        self.params.append(Parameter('weights', '重み付けを行うかどうか（デフォルト：uniform）'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：auto)'))
        self.params.append(Parameter('leaf_size', 'BallTreeまたはKDTreeに渡される葉の大きさ（デフォルト：30）'))
        self.params.append(Parameter('p', 'ミンコフスキー距離を用いた距離計算でのパラメータの値（デフォルト：2）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.knearest_neighbors import Knearest_neighbors as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKneuralnet(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKneuralnet'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/kneuralnet.py'
        self.description = 'ニューラルネットワークによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('hidden_layer_sizes', '隠れ層の層の数と各層に配置するニューロンの数（デフォルト：100,）'))
        self.params.append(Parameter('a', '活性化関数（デフォルト：relu）'))
        self.params.append(Parameter('solver', '最適化手法（デフォルト：adam）'))
        self.params.append(Parameter('alpha', 'L2正則化の係数（デフォルト：1e-4）'))
        self.params.append(Parameter('tol', '学習の収束と判断するための、損失もしくはスコアの変動値の基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('learning_rate_init', '重みの学習値の初期値（デフォルト：1e-3）'))
        self.params.append(Parameter('early_stopping', 'トレーニングデータの内、10％をテストデータとして使用、スコアが２連続でtolより低いと学習を停止する。（デフォルト：False）'))#? validation_fractionが変数として設定できないため、それの初期値（0.1）はそのまま数字で記述する。
        self.params.append(Parameter('momentum', 'SGDの収束性能を向上するための学習係数(デフォルト：0.9)'))# 怪しい
        self.params.append(Parameter('epsilon', 'solverがadamの際の、数式εの値（デフォルト：1e-8）'))

class CKneuralnetOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKneuralnet'
        self.description = 'ニューラルネットワークによる分類'
        self.params.append(Parameter('hidden_layer_sizes', '隠れ層の層の数と各層に配置するニューロンの数（デフォルト：100,）'))
        self.params.append(Parameter('a', '活性化関数（デフォルト：relu）'))
        self.params.append(Parameter('solver', '最適化手法（デフォルト：adam）'))
        self.params.append(Parameter('alpha', 'L2正則化の係数（デフォルト：1e-4）'))
        self.params.append(Parameter('tol', '学習の収束と判断するための、損失もしくはスコアの変動値の基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('learning_rate_init', '重みの学習値の初期値（デフォルト：1e-3）'))
        self.params.append(Parameter('early_stopping', 'トレーニングデータの内、10％をテストデータとして使用、スコアが２連続でtolより低いと学習を停止する。（デフォルト：False）'))#? validation_fractionが変数として設定できないため、それの初期値（0.1）はそのまま数字で記述する。
        self.params.append(Parameter('momentum', 'SGDの収束性能を向上するための学習係数(デフォルト：0.9)'))# 怪しい
        self.params.append(Parameter('epsilon', 'solverがadamの際の、数式εの値（デフォルト：1e-8）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.kneuralnet import Kneural_network as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKrf(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKrf'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/krf.py'
        self.description = 'ランダムフォレストによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('b', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))

class CKrfOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKrf'
        self.description = 'ランダムフォレストによる分類'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('b', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.krf import Krf as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKsvm(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'CKsvm'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/ksvm.py'
        self.description = 'サポートベクターマシンによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('c', 'マージンの大きさ（デフォルト：1.0）'))
        self.params.append(Parameter('k', 'アルゴリズムで使用するカーネルの種類（デフォルト：rbf）'))
        self.params.append(Parameter('g', 'カーネル係数（デフォルト：-1）'))

class CKsvmOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'CKsvm'
        self.description = 'サポートベクターマシンによる分類'
        self.params.append(Parameter('c', 'マージンの大きさ（デフォルト：1.0）'))
        self.params.append(Parameter('k', 'アルゴリズムで使用するカーネルの種類（デフォルト：rbf）'))
        self.params.append(Parameter('g', 'カーネル係数（デフォルト：-1）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.ksvm import Ksvm as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class KgaussianNb(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'KgaussianNb'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/kgaussian_nb.py'
        self.description = 'ナイーブベイズによる分類'
        self.output_ext = 'pickle'
        self.params.append(Parameter('priors', '事前確率'))

class KgaussianNbOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'KgaussianNb'
        self.description = 'ナイーブベイズによる分類'
        self.params.append(Parameter('priors', '事前確率'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.kgaussian_nb import Kgaussian_nb as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Klogreg(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Klogreg'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/classification/klogreg.py'
        self.description = 'ロジスティック回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('C', '正則化強度の逆数（デフォルト：1）'))
        self.params.append(Parameter('p', '正則化を行う地点（デフォルト：l2）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか（デフォルト：True）'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('c', 'クラスに対する重み'))

class KlogregOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Klogreg'
        self.description = 'ロジスティック回帰'
        self.params.append(Parameter('C', '正則化強度の逆数（デフォルト：1）'))
        self.params.append(Parameter('p', '正則化を行う地点（デフォルト：l2）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか（デフォルト：True）'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('c', 'クラスに対する重み'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.classification.klogreg import Klogreg as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKab(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKab'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kab.py'
        self.description = 'アダブーストによる回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '学習率'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：SAMME.R）'))
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト値：50）'))
        self.params.append(Parameter('loss', '損失関数（デフォルト：linear）'))

class RKabOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKab'
        self.description = 'アダブーストによる回帰'
        self.params.append(Parameter('l', '学習率'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：SAMME.R）'))
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト値：50）'))
        self.params.append(Parameter('loss', '損失関数（デフォルト：linear）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kab import Kab as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKbag(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKbag'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kbag.py'
        self.description = 'バギングによる回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '決定木の数（デフォルト値：50）'))
        self.params.append(Parameter('max_samples', 'それぞれの決定木を訓練するために使用するサンプルの数'))
        self.params.append(Parameter('unuse_bootstrap', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))
        self.params.append(Parameter('max_features', 'それぞれの決定木を訓練するために使用するサンプルから抽出する特徴量の数（デフォルト：1.0）'))
        self.params.append(Parameter('unuse_bootstrap_features', 'ブートストラップサンプルの特徴量を使用するかどうか（デフォルト：False）'))

class RKbagOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKbag'
        self.description = 'バギングによる回帰'
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '決定木の数（デフォルト値：50）'))
        self.params.append(Parameter('max_samples', 'それぞれの決定木を訓練するために使用するサンプルの数'))
        self.params.append(Parameter('unuse_bootstrap', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))
        self.params.append(Parameter('max_features', 'それぞれの決定木を訓練するために使用するサンプルから抽出する特徴量の数（デフォルト：1.0）'))
        self.params.append(Parameter('unuse_bootstrap_features', 'ブートストラップサンプルの特徴量を使用するかどうか（デフォルト：False）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kbag import Kbag as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKdt(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKdt'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kdt.py'
        self.description = '決定木による回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：gini）'))
        self.params.append(Parameter('r', '乱数のシード値'))

class RKdtOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKdt'
        self.description = '決定木による回帰'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：gini）'))
        self.params.append(Parameter('r', '乱数のシード値'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kdt import Kdt as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKgb(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKgb'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kgb.py'
        self.description = '勾配ブースティングによる回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値（デフォルト：3）'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：friedman_mse）'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト：100）'))
        self.params.append(Parameter('loss', '損失関数（デフォルト：deviance）'))

class RKgbOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKgb'
        self.description = '勾配ブースティングによる回帰'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('min_samples_split', '一定数以上のサンプルを持つノードを分割する、その基準値（デフォルト：2）'))
        self.params.append(Parameter('d', '木の深さの最大値（デフォルト：3）'))
        self.params.append(Parameter('c', 'データの分割基準（デフォルト：friedman_mse）'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('n_estimators', '弱い学習器の数（デフォルト：100）'))
        self.params.append(Parameter('loss', '損失関数（デフォルト：deviance）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kgb import Kgb as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKnearestNeighbors(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKnearestNeighbors'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/knearest_neighbors.py'
        self.description = '最近傍法による回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('radius', 'set the range of parameter space'))#todo この引数はないのでは？
        self.params.append(Parameter('weights', '重み付けを行うかどうか（デフォルト：uniform）'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：auto)'))
        self.params.append(Parameter('leaf_size', 'BallTreeまたはKDTreeに渡される葉の大きさ（デフォルト：30）'))
        self.params.append(Parameter('p', 'ミンコフスキー距離を用いた距離計算でのパラメータの値（デフォルト：2）'))

class RKnearestNeighborsOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKnearestNeighbors'
        self.description = '最近傍法による回帰'
        self.params.append(Parameter('radius', 'set the range of parameter space'))#todo この引数はないのでは？
        self.params.append(Parameter('weights', '重み付けを行うかどうか（デフォルト：uniform）'))
        self.params.append(Parameter('a', 'アルゴリズム（デフォルト：auto)'))
        self.params.append(Parameter('leaf_size', 'BallTreeまたはKDTreeに渡される葉の大きさ（デフォルト：30）'))
        self.params.append(Parameter('p', 'ミンコフスキー距離を用いた距離計算でのパラメータの値（デフォルト：2）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.knearest_neighbors import Knearest_neighbors as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKneuralnet(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKneuralnet'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kneuralnet.py'
        self.description = 'ニューラルネットワークによる回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('hidden_layer_sizes', '隠れ層の層の数と各層に配置するニューロンの数（デフォルト：100,）'))
        self.params.append(Parameter('a', '活性化関数（デフォルト：relu）'))
        self.params.append(Parameter('solver', '最適化手法（デフォルト：adam）'))
        self.params.append(Parameter('alpha', 'L2正則化の係数（デフォルト：1e-4）'))
        self.params.append(Parameter('tol', '学習の収束と判断するための、損失もしくはスコアの変動値の基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('learning_rate_init', '重みの学習値の初期値（デフォルト：1e-3）'))
        self.params.append(Parameter('early_stopping', 'トレーニングデータの内、10％をテストデータとして使用、スコアが２連続でtolより低いと学習を停止する。（デフォルト：False）'))
        self.params.append(Parameter('momentum', 'SGDの収束性能を向上するための学習係数(デフォルト：0.9)'))
        self.params.append(Parameter('epsilon', 'solverがadamの際の、数式εの値（デフォルト：1e-8）'))

class RKneuralnetOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKneuralnet'
        self.description = 'ニューラルネットワークによる回帰'
        self.params.append(Parameter('hidden_layer_sizes', '隠れ層の層の数と各層に配置するニューロンの数（デフォルト：100,）'))
        self.params.append(Parameter('a', '活性化関数（デフォルト：relu）'))
        self.params.append(Parameter('solver', '最適化手法（デフォルト：adam）'))
        self.params.append(Parameter('alpha', 'L2正則化の係数（デフォルト：1e-4）'))
        self.params.append(Parameter('tol', '学習の収束と判断するための、損失もしくはスコアの変動値の基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('learning_rate_init', '重みの学習値の初期値（デフォルト：1e-3）'))
        self.params.append(Parameter('early_stopping', 'トレーニングデータの内、10％をテストデータとして使用、スコアが２連続でtolより低いと学習を停止する。（デフォルト：False）'))
        self.params.append(Parameter('momentum', 'SGDの収束性能を向上するための学習係数(デフォルト：0.9)'))
        self.params.append(Parameter('epsilon', 'solverがadamの際の、数式εの値（デフォルト：1e-8）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kneuralnet import Kneural_network as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKrf(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKrf'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/krf.py'
        self.description = 'ランダムフォレストによる回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('b', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))

class RKrfOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKrf'
        self.description = 'ランダムフォレストによる回帰'
        self.params.append(Parameter('l', '各ノードに必要なサンプル数の下限（デフォルト：1）'))
        self.params.append(Parameter('d', '木の深さの最大値'))
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('b', 'ブートストラップサンプルを使用するかどうか（デフォルト：True）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.krf import Krf as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKsvm(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'RKsvm'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/ksvm.py'
        self.description = 'サポートベクターマシンによる回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('c', 'マージンの大きさ（デフォルト：1.0）'))
        self.params.append(Parameter('k', 'アルゴリズムで使用するカーネルの種類（デフォルト：rbf）'))
        self.params.append(Parameter('g', 'カーネル係数（デフォルト：-1）'))

class RKsvmOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'RKsvm'
        self.description = 'サポートベクターマシンによる回帰'
        self.params.append(Parameter('c', 'マージンの大きさ（デフォルト：1.0）'))
        self.params.append(Parameter('k', 'アルゴリズムで使用するカーネルの種類（デフォルト：rbf）'))
        self.params.append(Parameter('g', 'カーネル係数（デフォルト：-1）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.ksvm import Ksvm as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Kelastic(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Kelastic'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kelastic.py'
        self.description = 'kelastic net回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('a', 'モデルの正則化強度（デフォルト：1）'))
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか'))#todo ここにデフォルト値が設定されていなかったが、必要なのでは？
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('l1_ratio', 'L1、L2に与えるペナルティのうち、L1の比率'))

class KelasticOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Kelastic'
        self.description = 'elastic net回帰'
        self.params.append(Parameter('a', 'モデルの正則化強度（デフォルト：1）'))
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか'))#todo ここにデフォルト値が設定されていなかったが、必要なのでは？
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))
        self.params.append(Parameter('l1_ratio', 'L1、L2に与えるペナルティのうち、L1の比率'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kelastic import Kelastic as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Kridge(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Kridge'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/kridge.py'
        self.description = 'ridge回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('a', 'モデルの正則化強度（デフォルト：1）'))
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか'))#todo ここにデフォルト値が設定されていなかったが、必要なのでは？
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))

class KridgeOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Kridge'
        self.description = 'ridge回帰'
        self.params.append(Parameter('a', 'モデルの正則化強度（デフォルト：1）'))
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか'))#todo ここにデフォルト値が設定されていなかったが、必要なのでは？
        self.params.append(Parameter('r', '乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.kridge import Kridge as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Klasso(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Klasso'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/klasso.py'
        self.description = 'lasso回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('a', 'モデルの正則化強度（デフォルト：1）'))
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか（デフォルト：False）'))
        self.params.append(Parameter('r', 's乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))

class KlassoOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Klasso'
        self.description = 'lasso回帰'
        self.params.append(Parameter('a', 'モデルの正則化強度（デフォルト：1）'))
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))
        self.params.append(Parameter('b', 'バイアスをかけるかどうか（デフォルト：False）'))
        self.params.append(Parameter('r', 's乱数のシード値'))
        self.params.append(Parameter('tol', '学習の収束を判定するための基準値（デフォルト：1e-4）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.klasso import Klasso as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath

        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'

        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()

        return PathFileSource('pickle', frames_path, file_name)

class Klinreg(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Klinreg'
        self.command_path = '/kskp/engine/commands/kcmd/modeling/regression/klinreg.py'
        self.description = '線形回帰'
        self.output_ext = 'pickle'
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))

class KlinregOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'Klinreg'
        self.description = '線形回帰'
        self.params.append(Parameter('normalize', '正規化を行うかどうか（デフォルト」：False）'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.modeling.regression.klinreg import Klinreg as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath

        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'

        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-o', Path(frames_path).joinpath(file_name).as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        command.main(cl_args)
        command.write()

        return PathFileSource('pickle', frames_path, file_name)

class Evaluate(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Evaluate'
        self.command_path = '/kskp/engine/commands/kcmd/postprocess/evaluate.py'
        self.description = '評価'
        self.output_ext = 'csv'
        self.params.append(Parameter('m', 'select metrics appling model'))
        self.params.append(Parameter('p', 'set probability on'))
        self.params.append(Parameter('metrics_file_name', 'metrics_file_name'))
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]

    def command_args(self, args, inputs):
        cl_args = self.command_path
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            cl_args += ' -i ' + input_i.source.fullpath.as_posix()
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        # テストデータはcsv（現状実ファイル）でなければいけないので一旦、CSVに吐く
        input_d = inputs['d']
        input_d.command_to_file()
        cl_args += ' -d ' + input_d.source.fullpath.as_posix()

        # nm.cmd用の文字列のコマンドを作成する
        for key, value in args.items():
            if not len(value) == 0:
                # 短い引数と長い引数をlen(key) > 1で判断しているがゴリ押し感があるので別の書き方があれば書き換えて欲しいです。
                cl_args += ' --' if len(key) > 1 else ' -'
                cl_args += key + ' ' + value
        return cl_args, process_flow

class EvaluateOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('m', 'select metrics appling model'))
        self.params.append(Parameter('p', 'set probability on'))
        self.params.append(Parameter('metrics_file_name', 'metrics_file_name'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.postprocess.evaluate import Evaluate as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath

        inputs['i'].command_to_file()
        inputs['d'].command_to_file()

        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-d', inputs['d'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Predict(KCommand):
    def __init__(self):
        super().__init__(nm.cmd)
        self.name = 'Klinreg'
        self.command_path = '/kskp/engine/commands/kcmd/postprocess/predict.py'
        self.description = '推定'
        self.output_ext = 'csv'
        self.params.append(Parameter('p', 'set probability on'))

    def command_args(self, args, inputs):
        cl_args = self.command_path
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            cl_args += ' -i ' + input_i.source.fullpath.as_posix()
        elif isinstance(input_i.source, NysolPythonSource):
            process_flow = input_i.source.nysol_module

        # テストデータはcsv（現状実ファイル）でなければいけないので一旦、CSVに吐く
        input_d = inputs['d']
        input_d.command_to_file()
        cl_args += ' -d ' + input_d.source.fullpath.as_posix()

        # nm.cmd用の文字列のコマンドを作成する
        for key, value in args.items():
            if not len(value) == 0:
                # 短い引数と長い引数をlen(key) > 1で判断しているがゴリ押し感があるので別の書き方があれば書き換えて欲しいです。
                cl_args += ' --' if len(key) > 1 else ' -'
                cl_args += key + ' ' + value
        return cl_args, process_flow

class PredictOld(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('p', 'set probability on'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = os.environ['KENG_FRAMES_PATH']
        from .commands.kcmd.postprocess.predict import Predict as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath

        inputs['i'].command_to_file()
        inputs['d'].command_to_file()

        # 引数の設定
        cl_args = []
        cl_args.extend(['-i', inputs['i'].source.fullpath.as_posix()])
        cl_args.extend(['-d', inputs['d'].source.fullpath.as_posix()])
        for key, value in args.items():
            if not len(value) == 0:
                cl_args.extend(['--' + key, value]) if len(key) > 1 else cl_args.extend(['-' + key, value])

        dataframe = command.main(cl_args)

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

# PCMD
class Groupby(UnixCommand):
    pass

class Groupby2(UnixCommand):
    pass

class SmlModeling(UnixCommand):
    def __init__(self):
        super().__init__()
        self.name = 'SmlModeling'
        self.nysol_mod = nm.cmd
        self.command_path = '/kskp/engine/commands/pcmd/sml_modeling.sh'
        self.description = 'モデリング'
        self.output_ext = 'csv'
        self.stdout_param = ' output_metrics_data='

    def command_args(self, args, inputs):
        cl_args = self.command_path
        process_flow = None

        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            cl_args += ' i=' + input_i.source.fullpath.as_posix()
        elif isinstance(input_i.source, NysolPythonSource):
            # process_flow = input_i.source.nysol_module
            input_i.command_to_file()
            cl_args += ' i=' + input_i.source.fullpath.as_posix()

        # nm.cmd用の文字列のコマンドを作成する
        for key, value in args.items():
            if isinstance(value, bool):
                cl_args += ' ' +  key
                continue
            if not len(value) == 0:
                cl_args += ' ' + key + '=' + value

        cl_args += ' kcmd_path=/kskp/engine/commands/kcmd'
        cl_args += ' temp_path=/kskp/engine/commands/pcmd/tmp'
        cl_args += ' model_data_path=/kskp/engine/commands/pcmd/model'

        return cl_args, process_flow

    def source(self, args, inputs):
        args, process_flow = self.command_args(args, inputs)
        return NysolPythonSource(self.output_ext, self.nysol_mod, args, process_flow, self.stdout_param)

commands = {
    # MCDM
    'mcsv2arff': Mcsv2arff(),
    'm2cross': M2cross(),
    'maccum': Maccum(),
    'marff2csv': Marff2csv(),
    'mbest': Mbest(),
    'mchgnum': Mchgnum(),
    'mcombi': Mcombi(),
    'mchkcsv': Mchkcsv(),
    'mcommon': Mcommon(),
    'mcount': Mcount(),
    'mcross': Mcross(),
    'mdelnull': Mdelnull(),
    'mdformat': Mdformat(),
    'mduprec': Mduprec(),
    'mfldname': Mfldname(),
    'mfsortf': Mfsort(),
    'mhashavg': Mhashavg(),
    'mhashsum': Mhashsum(),
    'mkeybreak': Mkeybreak(),
    'mmbucket': Mmbucket(),
    'mmvavg': Mmvavg(),
    'mmvsim': Mmvsim(),
    'mmvstats': Mmvstats(),
    'mnjoin': Mnjoin(),
    'mnormalize': Mnormalize(),
    'mnrcommon': Mnrcommon(),
    'mnrjoin': Mnrjoin(),
    'mnullto': Mnullto(),
    'mnumber': Mnumber(),
    'mpadding': Mpadding(),
    'mpaste': Mpaste(),
    'mproduct': Mproduct(),
    'mrand': Mrand(),
    'mrjoin': Mrjoin(),
    'msed': Msed(),
    'mselnum': Mselnum(),
    'mselrand': Mselrand(),
    'msep': Msep(),
    'msep2': Msep2(),
    'mshare': Mshare(),
    'mshuffle': Mshuffle(),
    'mslide': Mslide(),
    'msplit': Msplit(),
    'msum': Msum(),
    'msummary': Msummary(),
    'mtab2csv': Mtab2csv(),
    'mtonull': Mtonull(),
    'mtra': Mtra(),
    'mtrafld': Mtrafld(),
    'mtraflg': Mtraflg(),
    'muniq': Muniq(),
    'mvcat': Mvcat(),
    'mvcommon': Mvcommon(),
    'mvcount': Mvcount(),
    'mvdelim': Mvdelim(),
    'mvdelnull': Mvdelnull(),
    'mvjoin': Mvjoin(),
    'mvnullto': Mvnullto(),
    'mvreplace': Mvreplace(),
    'mvsort': Mvsort(),
    'mvuniq': Mvuniq(),
    'mwindow': Mwindow(),
    'mxml2csv': Mxml2csv(),
    'mcut': Mcut(),
    'msel': Msel(),
    'split': Split(),
    'mjoin': Mjoin(),
    'mstats': Mstats(),
    'mavg': Mavg(),
    'mselstr': Mselstr(),
    'msetstr': Msetstr(),
    'mbucket': Mbucket(),
    'mcat': Mcat(),
    'mtee': Mtee(),
    'mnewrand': Mnewrand(),
    'mnewstr': Mnewstr(),
    'mnewnumber': Mnewnumber(),
    'msortf': Msortf(),
    'mcal': Mcal(),

    # KCMD
    'select_target_column': SelectTargetColumn(),
    'standardize': Standardize(),
    'label_encode': Label_encode(),
    'normalize': Normalize(),
    'one_hot_encode': One_hot_encode(),
    'pca': Pca(),

    'kkmeans': Kkmeans(),

    'ckab': CKab(),
    'ckbag': CKbag(),
    'ckdt': CKdt(),
    'ckgb': CKgb(),
    'cknearest_neighbors': CKnearestNeighbors(),
    'ckneuralnet': CKneuralnet(),
    'ckrf': CKrf(),
    'cksvm': CKsvm(),
    'kgaussian_nb': KgaussianNb(),
    'klogreg': Klogreg(),

    'rkab': RKab(),
    'rkbag': RKbag(),
    'rkdt': RKdt(),
    'rkgb': RKgb(),
    'rknearest_neighbors': RKnearestNeighbors(),
    'rkneuralnet': RKneuralnet(),
    'rkrf': RKrf(),
    'rksvm': RKsvm(),
    'kelastic': Kelastic(),
    'kridge': Kridge(),
    'klasso': Klasso(),
    'klinreg': Klinreg(),

    'evaluate': Evaluate(),
    'predict': Predict(),

    'groupby': Groupby(),
    'groupby2': Groupby2(),
    'sml_modeling': SmlModeling()
}
