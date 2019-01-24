import kskp.engine.util as util

def execute(context={}, parameters={}):
  if 'file_name' in parameters:
    command_params = [parameters['search_string'], parameters['file_name']]
  else:
    command_params = [parameters['search_string']]
  return util.execute_command(context, 'grep', [], command_params)
