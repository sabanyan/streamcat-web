import kskp.engine.util as util

def execute(context={}, parameters={}):
  return util.execute_command(context, 'wc', ['l'], [])
