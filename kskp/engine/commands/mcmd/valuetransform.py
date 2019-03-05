from . import *

class Mchgnum:
    pass

class Mchgstr:
    pass

class Mdformat:
    pass

class Mnullto(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnullto'
        self.description = 'NULL置換'
        self.parameters.append(Parameter('f', '対象列名'))
        self.parameters.append(Parameter('v', '変換後文字列'))

class Msed(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msed'
        self.description = '文字列置換'
        self.parameters.append(Parameter('f', '対象列名'))
        self.parameters.append(Parameter('c', '変換パターン'))
        self.parameters.append(Parameter('v', '変換後文字列'))

class Mtonull:
    pass

class Mvdelim:
    pass

class Mvdelnull:
    pass

class Mvnullto:
    pass

class Mvsort:
    pass

class Mvuniq:
    pass
