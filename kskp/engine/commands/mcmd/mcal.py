from . import *

class Mcal(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcal'
        self.description = '計算'
        self.parameters.append(CalculateParameter('計算式'))
        self.parameters.append(AppendingFieldParameter())

"""
{
  "version": "0.1",
  "name": "mcal",
  "description": "計算",
  "inputs": [
    {
      "type": "csv"
    }
  ],
  "outputs": [
    {
      "type": "csv"
    }
  ],
  "arguments": [
    {
      "name": "c",
      "caption": "計算式",
      "type": "string",
      "default": "",
      "validation" : {}
    },
    {
      "name": "a",
      "caption": "結果列名",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "mcal.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mcal', parameters)
