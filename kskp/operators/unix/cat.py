import kskp.engine.util as util

def execute(context={}, parameters={}):
  command_params = [parameters['file_name']]
  return util.execute_command(context, 'cat', [], command_params)
