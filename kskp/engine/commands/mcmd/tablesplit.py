from . import *

class Mbucket(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mbucket'
        self.description = '行分割'
        self.parameters.append(Parameter('n', '行数'))
        self.parameters.append(Parameter('f', '対象列名'))

class Mmbucket:
    pass

class Msep:
    pass

class Msep2:
    pass

class Mshuffle:
    pass
