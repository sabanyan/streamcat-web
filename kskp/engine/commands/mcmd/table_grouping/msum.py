"""
{
  "version": "0.1",
  "name": "msum",
  "description": "合計",
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
      "caption": "合計の基準となる列名",
      "type": "string",
      "default": "",
      "validation" : {}
    },
    {
      "name": "f",
      "caption": "合計する列名:合計後の列名",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "msum.py"
  }
}
"""

import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'msum', parameters)
