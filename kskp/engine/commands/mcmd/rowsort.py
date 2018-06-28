from . import *

class Mfsort:
    pass

class Msortf(Mcommand):
    def __init__(self):
        super().__init__()
        self.name = 'msortf'
        self.desription = 'ソート'
        self.parameters.append(Parameter('f', '対象列名'))
