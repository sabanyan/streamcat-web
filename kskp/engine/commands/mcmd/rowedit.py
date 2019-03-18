from . import *

class Mbest(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mbest'
        self.description = '指定行選択'
        self.parameters.append(Parameter('s', 'ソート対象列名'))

class Mdelnull(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mdelnull'
        self.description = 'NULL行削除'
        self.parameters.append(Parameter('f', '対象列名'))

class Mduprec:
    pass

class Mpadding:
    pass

class Msel(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msel'
        self.description = '行絞り込み'
        self.parameters.append(Parameter('c', '絞込条件式'))

class Mselnum:
    pass

class Mselrand:
    pass

class Mselstr(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mselstr'
        self.description = '行選択(文字列)'
        self.parameters.append(Parameter('f', '対象列名'))
        self.parameters.append(Parameter('v', '絞込条件値（文字列）'))

class Muniq(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'muniq'
        self.description = '単一化'
        self.parameters.append(Parameter('k', 'キー列名'))
