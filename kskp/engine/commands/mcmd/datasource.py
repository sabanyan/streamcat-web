from . import *

class Mdata:
    pass

class Mnewnumber:
    pass

class Mnewrand:
    pass

class Mnewstr:
    pass

class Mtee(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtee'
        self.description = '出力'
        self.parameters.append(Parameter('o', '出力先'))
