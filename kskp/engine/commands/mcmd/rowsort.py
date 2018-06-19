class Mfsort:
    pass

class Msortf(Mcommand):
    def __init__(self):
        self.name = 'msortf'
        self.desription = 'ソート'
        self.parameters.append(FieldParameter())
