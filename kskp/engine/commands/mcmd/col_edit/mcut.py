"""
{
  "version": "0.1",
  "name": "mcut",
  "description": "列選択",
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
    "name": "mcut.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mcut', parameters)
