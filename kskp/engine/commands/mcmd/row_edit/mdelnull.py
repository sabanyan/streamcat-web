"""
{
  "version": "0.1",
  "name": "mdelnull",
  "description": "NULL行削除",
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
      "name": "f",
      "caption": "対象列名",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "mdelnull.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mdelnull', parameters)
