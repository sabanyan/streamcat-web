from . import *

class Maccum:
    pass

class Mavg:
    pass

class Mcount(MCommand):
    def __init__(self):
        self.name = 'mcount'
        self.description = '行数カウント'
        self.parameters.append(KeyFieldParameter('対象列名'))
        self.parameters.append(AppendingFieldParameter('結果列名'))

class Mhashavg:
    pass

class Mhashsum:
    pass

class Mkeybreak:
    pass

class Mmvavg:
    pass

class Mmvsim:
    pass

class Mmvstats:
    pass

class Mnormalize:
    pass

class Msim:
    pass

class Mslide(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mslide'
        self.description = '行ずらし'
        self.parameters.append(SortFieldParameter())
        self.parameters.append(FieldParameter('ずらす対象の列名'))

class Mstats:
    pass

class Msum(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msum'
        self.description = '合計'
        self.parameters.append(KeyFieldParameter('合計の基準となる列名'))
        self.parameters.append(FieldParameter('合計する列名:合計後の列名'))

class Msummary:
    pass

class Mwindow:
    pass
