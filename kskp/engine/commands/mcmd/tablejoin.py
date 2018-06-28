from . import *

class Mcat(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.parameters.append(Parameter('i', '入力ファイル名'))

class Mcommon:
    pass

class Mjoin(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mjoin'
        self.description = '結合'
        self.parameters.append(Parameter('k', '結合キー名'))
        self.parameters.append(Parameter('m', '参照ファイル名'))

class Mnjoin:
    pass

class Mnrcommon:
    pass

class Mnrjoin:
    pass

class Mpaste:
    pass

class Mproduct:
    pass

class Mrjoin:
    pass

class Mvcommon:
    pass

class Mvjoin:
    pass

class Mvreplace:
    pass
