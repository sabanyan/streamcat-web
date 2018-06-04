# 連番なのでcolumn_addか
import kskp.engine.util as util

def execute(context={}, parameters={}):
    return util.execute_m_command(context, 'mnumber', parameters)
