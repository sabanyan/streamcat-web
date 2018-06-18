class Mtra(MCommand):
    def __init__(self):
        self.name = 'mtra'
        self.description = '縦横変換'
        self.parameters.append(KeyFieldParameter('変換キー列名'))
        self.parameters.append(FieldParameter('連結前列名:連結後列名'))
