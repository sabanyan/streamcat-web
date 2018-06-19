"""
{
  "version": "0.1",
  "name": "mtra",
  "description": "縦横変換",
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
      "name": "k",
      "caption": "変換キー列名",
      "type": "string",
      "default": "",
      "validation" : {}
    },
    {
      "name": "f",
      "caption": "連結前列名:連結後列名",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "mtra.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mtra', parameters)
