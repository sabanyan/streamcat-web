import os
from kskp.engine.core3 import parse

def execute(flow_uuid, step_paths=None):
    os.environ['KENG_FLOWS_PATH'] = 'kskp/data/flows'
    os.environ['KENG_FRAMES_PATH'] = 'kskp/data/frames'
    job = parse(flow_uuid)
    job.execute(step_paths=step_paths)
    job.dtor()

def test_ni():
    execute('2C096E39-28BD-491B-B0E2-7ECFFD113304')

if __name__ == '__main__':
    test_ni()
