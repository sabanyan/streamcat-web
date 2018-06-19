class Mchgnum:
    pass

class Mchgstr:
    pass

class Mdformat:
    pass

class Mnullto(MCommand):
    def __init__(self):
        self.name = 'mnullto'
        self.description = 'NULL置換'
        self.parameters.append(FieldParameter())
        self.parameters.append(ValueParameter('変換後文字列'))

class Msed(MCommand):
    def __init__(self):
        self.name = 'msed'
        self.description = '文字列置換'
        self.parameters.append(FieldParameter())
        self.parameters.append(CalculateParameter('変換パターン'))
        self.parameters.append(ValueParameter('変換後文字列'))

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
