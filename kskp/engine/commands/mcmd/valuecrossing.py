from . import *

class M2cross:
    pass

class Mcombi:
    pass

class Mcross:
    pass

class Mtra(MCommand):
    def __init__(self):
        self.name = 'mtra'
        self.description = '縦横変換'
        self.parameters.append(KeyFieldParameter('変換キー列名'))
        self.parameters.append(FieldParameter('連結前列名:連結後列名'))

class Mtrafld:
    pass

class Mtraflg:
    pass
