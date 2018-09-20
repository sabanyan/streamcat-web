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
    return {v: data[v] for v in srcs.values()}

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
                result[k] == v
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
        result = {d: self.check_multi_use(job, d, self.get_datum(d, job.inputs[d]))
                    for port, d in job.step.srcs.items()}
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
        if len(self.step.srcs) == 0 and len(self.step.dsts) == 0:
            print('いちばん親のdtorだ！')

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
                 isinstance(input.source, PandasSource):
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
        frames_path = 'kskp/data/frames'
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
            if k == 'x' and v == True:
                res.append('-x')
            elif k == 'rng' and v == True:
                res.append('-rng')
            else:
                res.append('%s=%s' % (k, v))
        return res

    # @property
    def source(self, args, inputs):
        return UnixCommandSource('csv', self.command_args(args, inputs), stdin=self.stdin(inputs))

class MCommandNew(Command):
    def __init__(self, nysol_mod):
        super().__init__()
        self.i_ports = [{'name': 'i', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}]
        self.nysol_mod = nysol_mod

    def execute(self, args, inputs):
        args_for_nysol = args
        input_i = inputs['i']
        if isinstance(input_i.source, PathFileSource):
            input_i.command_to_file()
            args_for_nysol.update({'i': input_i.source.fullpath.as_posix()})
            # print('PathFileSource args_for_nysol:', args_for_nysol)
        elif isinstance(input_i.source, NysolPythonSource):
            args_for_nysol.update({'i': input_i.source.nysol_module})
            # print('NysolPythonSource args_for_nysol:', args_for_nysol)
            
        source = NysolPythonSource('csv', self.nysol_mod, args_for_nysol)

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

import nysol.mcmd as nm

class Msel(MCommandNew):
    def __init__(self):
        super().__init__(nm.msel)
        self.name = 'msel'
        self.description = '行絞り込み'
        self.params.append(Parameter('c', '絞込条件式'))

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
        self.params.append(Parameter('f', '対象列名'))
        self.params.append(Parameter('v', '絞込条件値（文字列）'))

class MselstrOld(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mselstr'
        self.description = '行選択(文字列)'
        self.params.append(Parameter('f', '対象列名'))
        self.params.append(Parameter('v', '絞込条件値（文字列）'))

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
        super().__init__(nm.mcat)

        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.i_ports = [{'name': '*', 'type': 'frame'}] # 何個でも取れる1
        self.params.append(Parameter('k', '結合する列名'))

    def execute(self, args, inputs):
        args_for_nysol = args
        inputs_for_arg_i = []
        for key, input in inputs.items():
            input.command_to_file()
            inputs_for_arg_i.append(input.source.fullpath.as_posix())
        args_for_nysol.update({'i': ','.join(inputs_for_arg_i)})

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

    def execute(self, args, inputs):
        args_for_nysol = args

        if isinstance(inputs['i'].source, PathFileSource):
            args_for_nysol.update({'i': inputs['i'].source.fullpath.as_posix()})
        elif isinstance(inputs['i'].source, NysolPythonSource):
            args_for_nysol.update({'i': inputs['i'].source.nysol_module})

        input_m = inputs['m']

        if isinstance(inputs['i'].source, NysolPythonSource):
            args_for_nysol.update({'m': input_m.source.nysol_module})
        else:
            # パイプなら、CSVに吐く
            input_m.command_to_file()
            args_for_nysol.update({'m': input_m.source.fullpath.as_posix()})

        # print('Mjoin execute:', args_for_nysol)
        source = NysolPythonSource('csv', self.nysol_mod, args_for_nysol)
        frame = Frame(str(uuid.uuid4()), source)
        return { self.out_key: frame }

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

class Msummary(MCommandNew):
    def __init__(self):
        super().__init__(nm.msummary)

class M2cross(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.m2cross)
        self.name = 'm2cross'
        self.description = '1対Nのクロス集計'
        self.params.append(Parameter('f', '組み合わせ列名(必須)'))
        self.params.append(Parameter('s', '列項目名に展開する列(選択必須)'))
        self.params.append(Parameter('a', '２項目指定(選択必須)'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL血置換文字列'))

class Mcross(MCommandNew):#new
    def __init__(self):
        super().__init__(nm.mcross)
        self.name = 'mcross'
        self.description = 'クロス集計'
        self.params.append(Parameter('f', '指定列の値(必須)'))
        self.params.append(Parameter('s', '列名となる元のデータ列(必須)'))#ここの説明が怪しい
        self.params.append(Parameter('a', 'f=で指定した列名がデータとして展開する列名'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL値置換文字列'))
#
# class Mchkcsv(MCommandNew):#new
#     def __init__(self):
#         super().__init__(nm.chkcsv)
#         self.name = 'mchkcsv'
#         self.description = 'csvデータのチェック・修復'
#         self.params.append(Parameter('i', '入力ファイル名'))
#         self.params.append(Parameter('a', '入力データ列を無視する、新しい列名'))

commands = {
    'msel': Msel(),
    'mcut': Mcut(),
    'mselstr' : Mselstr(),
    'mstats': Mstats(),
    'mavg': Mavg(),
    'msetstr' : Msetstr(),
    'mbucket' : Mbucket(),
    'msortf': Msortf(),
    'mcal': Mcal(),
    'mjoin': Mjoin(),
    'mcat': Mcat(),

    # 'msel': MselOld(),
    # 'mcut': McutOld(),
    # 'mselstr' : MselstrOld(),
    # 'mstats': MstatsOld(),
    # 'mavg': MavgOld(),
    # 'msetstr' : MsetstrOld(),
    # 'mbucket' : MbucketOld(),
    # 'msortf': MsortfOld(),
    # 'mcal': McalOld(),
    # 'mjoin': MjoinOld(),
    # 'mcat': McatOld(),

    # # MCDM
    'm2cross': M2cross(),
    'mcross': Mcross(),
    'mnumber': Mnumber(),
    'msummary':Msummary()
    #
    # # KCMD
    # 'select_target_column': SelectTargetColumn(),
    # 'standardize': Standardize(),
    # 'label_encode': Label_encode(),
    # 'normalize': Normalize(),
    # 'one_hot_encode': One_hot_encode(),
    # 'pca': Pca(),
    #
    # 'kkmeans': Kkmeans(),
    #
    # 'ckab': CKab(),
    # 'ckbag': CKbag(),
    # 'ckdt': CKdt(),
    # 'ckgb': CKgb(),
    # 'cknearest_neighbors': CKnearestNeighbors(),
    # 'ckneuralnet': CKneuralnet(),
    # 'ckrf': CKrf(),
    # 'cksvm': CKsvm(),
    # 'kgaussian_nb': KgaussianNb(),
    # 'klogreg': Klogreg(),
    #
    # 'rkab': RKab(),
    # 'rkbag': RKbag(),
    # 'rkdt': RKdt(),
    # 'rkgb': RKgb(),
    # 'rknearest_neighbors': RKnearestNeighbors(),
    # 'rkneuralnet': RKneuralnet(),
    # 'rkrf': RKrf(),
    # 'rksvm': RKsvm(),
    # 'kelastic': Kelastic(),
    # 'kridge': Kridge(),
    # 'klasso': Klasso(),
    # 'klinreg': Klinreg(),
    #
    # 'evaluate': Evaluate(),
    # 'predict': Predict()
}
