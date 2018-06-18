"""
{
  "version": "0.1",
  "name": "mnumber",
  "description": "連番",
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
      "name": "s",
      "caption": "ソート対象列名",
      "type": "string",
      "default": "",
      "validation" : {}
    },
    {
      "name": "a",
      "caption": "追加列名",
      "type": "string",
      "default": "",
      "validation" : {}
    }
  ],
  "script": {
    "type": "file",
    "name": "mnumber.py"
  }
}
"""

# 連番なのでcolumn_addか
import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mnumber', parameters)
