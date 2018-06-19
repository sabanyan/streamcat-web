class Mcut_n:
    pass

class Mcut(MCommand):
    def __init__(self):
        self.name = 'mcut'
        self.description = '列選択'
        self.parameters.append(FieldParameter())

class Mfldname:
    pass

class Mnumber(MCommand):
    def __init__(self):
        self.name = 'mnumber'
        self.description = '連番'
        self.parameters.append(SortFieldParameter())
        self.parameters.append(AppendingFieldParameter())

class Mrand:
    pass

class Msetstr(MCommand):
    def __init__(self):
        self.name = 'msetstr'
        self.description = '文字列追加'
        self.parameters.append(AppendingFieldParameter())
        self.parameters.append(ValueParameter())

class Mshare:
    pass

class Msplit:
    pass

class Mvcat:
    pass

class Mvcount:
    pass
