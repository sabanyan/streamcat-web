import os
import unittest
import json
from pathlib import Path

class TranslateJsonTestCase(unittest.TestCase):
    def updated_dict(self, a, b):
        b.update(a)
        return b

    @unittest.skip
    def test(self):
        from pathlib import Path
        flow_uuids = [
            '2C096E39-28BD-491B-B0E2-7ECFFD113304',
            'F0F2DCC5-6F17-4B58-9D54-B66C1CF05B89',
            'FE9D0AD2-E9BC-4E42-8455-3AF3B2C33155',
            'E3EB7A3B-D015-4DA3-BF56-1784023D8FCD',
            '6C21E7C3-8060-42D3-9C8E-E05592AE1979'
        ]
        for flow_uuid in flow_uuids:
            FLOWS_PATH = Path('kskp/data/flows')
            FLOW_PATH = FLOWS_PATH.joinpath(flow_uuid + '.json')
            with FLOW_PATH.open('r', encoding='utf-8') as fd:
                obj = json.load(fd, encoding='utf-8')

            new_nodes = [self.updated_dict(node, {'id': key}) for key, node in obj['nodes'].items()]
            obj['nodes'] = new_nodes

            with FLOW_PATH.open('w', encoding='utf-8') as wfd:
                json.dump(obj, wfd, indent=2, ensure_ascii=False)

    def translate2(self, node):
        if node['type'] == 'command':
            node['commandId'] = node['name']
            del node['name']
        node['label'] = None
        return node

    @unittest.skip
    def test_translate2(self):
        from pathlib import Path
        flow_uuids = [
            '2C096E39-28BD-491B-B0E2-7ECFFD113304',
            'F0F2DCC5-6F17-4B58-9D54-B66C1CF05B89',
            'FE9D0AD2-E9BC-4E42-8455-3AF3B2C33155',
            'E3EB7A3B-D015-4DA3-BF56-1784023D8FCD',
            '6C21E7C3-8060-42D3-9C8E-E05592AE1979'
        ]
        for flow_uuid in flow_uuids:
            FLOWS_PATH = Path('kskp/data/flows')
            FLOW_PATH = FLOWS_PATH.joinpath(flow_uuid + '.json')
            with FLOW_PATH.open('r', encoding='utf-8') as fd:
                obj = json.load(fd, encoding='utf-8')
            obj['ports'][0] = [{'name': key, 'type': port['type']} for key, port in obj['ports'][0].items()]
            obj['ports'][1] = [{'name': key, 'type': port['type']} for key, port in obj['ports'][1].items()]
            obj['nodes'] = [self.translate2(node) for node in obj['nodes']]
            with FLOW_PATH.open('w', encoding='utf-8') as wfd:
                json.dump(obj, wfd, indent=2, ensure_ascii=False)

    @unittest.skip
    def test_translate3(self):
        from pathlib import Path
        flow_uuids = [
            '2C096E39-28BD-491B-B0E2-7ECFFD113304',
            'F0F2DCC5-6F17-4B58-9D54-B66C1CF05B89',
            'FE9D0AD2-E9BC-4E42-8455-3AF3B2C33155',
            'E3EB7A3B-D015-4DA3-BF56-1784023D8FCD',
            '6C21E7C3-8060-42D3-9C8E-E05592AE1979'
        ]
        for flow_uuid in flow_uuids:
            FLOWS_PATH = Path('kskp/data/flows')
            FLOW_PATH = FLOWS_PATH.joinpath(flow_uuid + '.json')
            with FLOW_PATH.open('r', encoding='utf-8') as fd:
                obj = json.load(fd, encoding='utf-8')
            obj['label'] = obj['name']
            del obj['name']
            with FLOW_PATH.open('w', encoding='utf-8') as wfd:
                json.dump(obj, wfd, indent=2, ensure_ascii=False)

class TranslateCommandsTestCase(unittest.TestCase):
    def change_dict_key(self, target_dict, from_key, to_key):
        if from_key in target_dict:
            target_dict[to_key] = [val for val in target_dict[from_key]]
            del target_dict[from_key]

    @unittest.skip
    def test_translate_commands(self):
        path = Path('kskp/data/commands')
        for command in path.iterdir():
            print(command)
            with Path(command).open('r', encoding='utf-8') as rfd:
                obj = json.load(rfd, encoding='utf-8')
            if 'ports' not in obj:
                if 'signature' in obj:
                    self.change_dict_key(obj, 'signature', 'ports')
                else:
                    obj['ports'] = [{}, {}]
            if 'inputs' in obj:
                obj['ports'][0] = {'i': {'type': 'frame'} for key in obj['inputs']}
                del obj['inputs']
            if 'outputs' in obj:
                obj['ports'][1] = {'o': {'type': 'frame'} for key in obj['outputs']}
                del obj['outputs']
            if 'script' in obj:
                del obj['script']
            self.change_dict_key(obj, 'arguments', 'params')
            if 'params' in obj:
                for param in obj['params']:
                    if 'caption' in param:
                        param['label'] = param['caption']
                        del param['caption']
                    if 'default' in param:
                        del param['default']
                    if 'validation' in param:
                        del param['validation']

            if 'name' in obj:
                obj['id'] = obj['name']
            if 'description' in obj:
                obj['name'] = obj['description']
                del obj['description']
            if 'version' in obj:
                obj['version'] = '0.7.0'

            with command.open('w', encoding='utf-8') as wfd:
                json.dump(obj, wfd, ensure_ascii=False, indent=2)

    @unittest.skip
    def test_translate_commands(self):
        path = Path('kskp/data/commands')
        for command in path.iterdir():
            with Path(command).open('r', encoding='utf-8') as rfd:
                obj = json.load(rfd, encoding='utf-8')

            obj['ports'][0] = [{'name': key, 'type': port['type']} for key, port in obj['ports'][0].items()]
            obj['ports'][1] = [{'name': key, 'type': port['type']} for key, port in obj['ports'][1].items()]

            obj['label'] = obj['name']
            del obj['name']
            with command.open('w', encoding='utf-8') as wfd:
                json.dump(obj, wfd, ensure_ascii=False, indent=2)
