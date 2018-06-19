"""
{
  "version": "0.1",
  "name": "msetstr",
  "description": "文字列追加",
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
      "name": "a",
      "caption": "追加列名",
      "type": "string",
      "default": "",
      "validation" : {}
    },
    {
      "name": "v",
      "caption": "追加する値",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "msetstr.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'msetstr', parameters)
