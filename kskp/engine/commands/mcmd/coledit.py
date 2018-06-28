from . import *

class Mcut_n:
    pass

class Mcut(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcut'
        self.description = '列選択'
        self.parameters.append(Parameter('f', '対象列名'))

class Mfldname:
    pass

class Mnumber(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnumber'
        self.description = '連番'
        self.parameters.append(Parameter('s', 'ソート対象列名'))
        self.parameters.append(Parameter('a', '追加列名'))

class Mrand:
    pass

class Msetstr(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msetstr'
        self.description = '文字列追加'
        self.parameters.append(Parameter('a', '追加列名'))
        self.parameters.append(Parameter('v', '追加する値'))

class Mshare:
    pass

class Msplit:
    pass

class Mvcat:
    pass

class Mvcount:
    pass
