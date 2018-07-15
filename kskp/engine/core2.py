import re

from .util import Parameter

class Job:
    def __init__(self, step, inputs=None):
        self.step = step
        self.inputs = {} if inputs is None else inputs
        self.errors = []

    def execute(self):
        return self.step.execute(self.inputs)

    def dtor(self):
        for input in self.inputs.values():
            if input is not None:
                input.dtor()

        flow = self.step.command_or_flow

        if self.step.kind == 'flow':
            # for datum in flow.data.values():
            #     if datum is not None:
            #         datum.dtor()

            for job in flow.jobs.values():
                job.dtor()

class Step:
    def __init__(self, kind, command_or_flow, args):
        self.kind = kind
        self.command_or_flow = command_or_flow
        self.args = args

    def execute(self, inputs={}):
        return self.command_or_flow.execute(self.args, inputs)

class Flow:
    def __init__(self, flow_uuid):
        self.uuid = flow_uuid
        self.params = []
        self.i_ports = {}
        self.o_ports = {}
        self.description = ''

        self.jobs = {}
        self.data = {}
        self.src_edges = {} # { 's1': {'in': 'd0'} }
        self.dst_edges = {} # { 's1': {'out': 'd1'} }

    def execute(self, args={}, inputs={}):
        self.prepare_inputs(inputs)

        self.data.update({ k: self.get_datum(k, args) for k in self.last_keys })

        return self.outputs

    def get_datum(self, datum_id, args):
        datum = self.data[datum_id]
        if datum is not None and datum.uuid is not None: return datum

        job_id, port = self.src_job_from(datum_id)
        job = self.jobs[job_id]

        self.expand_args(job, args)
        job.inputs = self.check_inputs(self.inputs_of_job(job_id, args), job_id)
        result = job.execute()[port]
        # self.data[datum_id] = result
        return result

    def src_job_from(self, datum_id):
        for k, v in self.dst_edges.items():
            if v == datum_id:
                return tuple(k.split('.'))

    def inputs_of_job(self, job_id, args):
        return {d: self.check_multi_use(d, self.get_datum(d, args))
                    for k, d in self.src_edges.items() if f'{job_id}.' in k}

    def check_multi_use(self, datum_id, datum):
        if len(self.dst_job_ids(datum_id)) >= 2 \
        and isinstance(datum.source, UnixCommandSource):
            path = Path(os.environ['KENG_FRAME_PATH']).joinpath(datum.uuid + datum.source.ext)
            with path.open(mode='w', encoding='utf-8') as fd:
                datum.source.save(fd)
            datum.source = PathFileSource('csv', path.parent, path.name)
        return datum

    def dst_job_ids(self, datum_id):
        return [k for k, v in self.src_edges.items() if datum_id == v]

    def check_inputs(self, inputs, job_id):
        res = inputs
        i_ports = self.jobs[job_id].step.command_or_flow.i_ports
        if '*' not in list(i_ports.keys()):
            res = {src_key.split('.')[1]: v for k, v in inputs.items()
                              for src_key, src_datum_id in self.src_edges.items()
                              if f'{job_id}.' in src_key and src_datum_id == k}
        return res

    def expand_args(self, job, args):
        job.step.args = {k: self.replace_arg(v, args)
                            for k, v in job.step.args.items()}

    def replace_arg(self, v, args):
        res = v
        if isinstance(v, str):
            r = re.search(r'@\[(\S*?)\]', v)
            if r is not None:
                for g in r.groups():
                    res = v.replace(f'@[{g}]', args[g])
        return res

    def prepare_inputs(self, inputs):
        for key in self.i_ports.keys():
            self.data[key] = inputs[key]

    @property
    def outputs(self):
        return { k: v for k, v in self.data.items() if k in self.o_ports.keys() }

    @property
    def last_keys(self):
        """ flow上の終端データをdictにして返す engineからも使っている """
        return set(self.data.keys()) - self.src_datum_ids

    @property
    def src_datum_ids(self):
        return { v for v in self.src_edges.values() }

class Command:
    def __init__(self, name=''):
        self.name = name
        self.params = []
        self.i_ports = {}
        self.o_ports = {}
        self.description = ''

    def execute(self, args={}, inputs={}):
        pass


from .data import *

class Port:
    def __init__(self, job_id, name):
        self.job_id = job_id
        self.name = name

class MCommand(Command):
    def __init__(self):
        super().__init__()
        self.i_ports = {'in': {'type': 'frame'}}
        self.o_ports = {'out': {'type': 'frame'}}

    def execute(self, args={}, inputs={}):
        source = UnixCommandSource('csv', self.command_args(args, inputs), stdin=self.stdin(inputs))
        frame = Frame(str(uuid.uuid4()), source)
        return { self.out_key: frame }

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

    def stdin(self, inputs):
        return list(inputs.values())[0].source.fd

    @property
    def out_key(self):
        return list(self.o_ports.keys())[0]

    def save(self, input):
        # パイプなら、CSVに吐く
        if isinstance(input.source, UnixCommandSource):
            path = Path(os.environ['KENG_FRAME_PATH']).joinpath(input.uuid + input.source.ext)
            with path.open(mode='w', encoding='utf-8') as fd:
                input.source.save(fd)
            input.source = PathFileSource('csv', path.parent, path.name)

class Mcut(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcut'
        self.description = '列選択'
        self.params.append(Parameter('f', '対象列名'))

class Msetstr(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msetstr'
        self.description = '文字列追加'
        self.params.append(Parameter('a', '追加列名'))
        self.params.append(Parameter('v', '追加する値'))

class Msum(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msum'
        self.description = '合計'
        self.params.append(Parameter('k', '合計の基準となる列名'))
        self.params.append(Parameter('f', '合計する列名:合計後の列名'))

class Mstats(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mstats'
        self.description = '統計情報'
        self.params.append(Parameter('c', '計算項目'))
        self.params.append(Parameter('f', '対象列名'))

class Mavg(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mavg'
        self.description = '平均'
        self.params.append(Parameter('f', '対象列名'))

class Mbucket(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mbucket'
        self.description = '行分割'
        self.params.append(Parameter('n', '行数'))
        self.params.append(Parameter('f', '対象列名'))

class Mtee(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtee'
        self.description = '出力'
        self.params.append(Parameter('o', '出力先'))

class Mselstr(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mselstr'
        self.description = '行選択(文字列)'
        self.params.append(Parameter('f', '対象列名'))
        self.params.append(Parameter('v', '絞込条件値（文字列）'))

class Mcat(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.i_ports = {'*': {'type': 'frame'}} # 何個でも取れる

    def command_args(self, args, inputs):
        res = self.name.split()

        # 引数をそれぞれパスにしていく
        inputs_for_arg_i = []
        for key, input in inputs.items():
            self.save(input)
            inputs_for_arg_i.append(input.source.fullpath.as_posix())
        res.append(f"i={','.join(inputs_for_arg_i)}")
        return res

    def stdin(self, inputs):
        return None

class Mjoin(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mjoin'
        self.description = '結合'
        self.i_ports = {'i' : {'type': 'frame'}, 'm' : {'type': 'frame'}}
        self.params.append(Parameter('k', '結合キー名'))

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        self.save(input_m)
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd
