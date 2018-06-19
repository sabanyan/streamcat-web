"""
{
  "version": "0.1",
  "name": "mnullto",
  "description": "NULL置換",
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
    },
    {
      "name": "v",
      "caption": "変換後文字列",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "mnullto.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mnullto', parameters)
