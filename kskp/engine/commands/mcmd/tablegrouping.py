from . import *

class Maccum:
    pass

class Mavg(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mavg'
        self.description = '平均'
        self.parameters.append(Parameter('f', '対象列名'))

class Mcount(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcount'
        self.description = '行数カウント'
        self.parameters.append(Parameter('k', '対象列名'))
        self.parameters.append(Parameter('a', '結果列名'))

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
        self.parameters.append(Parameter('s', 'ソート対象列名'))
        self.parameters.append(Parameter('f', 'ずらす対象の列名'))

class Mstats(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mstats'
        self.description = '統計情報'
        self.parameters.append(Parameter('c', '計算項目'))
        self.parameters.append(Parameter('f', '対象列名'))

class Msum(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msum'
        self.description = '合計'
        self.parameters.append(Parameter('k', '合計の基準となる列名'))
        self.parameters.append(Parameter('f', '合計する列名:合計後の列名'))

class Msummary:
    pass

class Mwindow:
    pass
