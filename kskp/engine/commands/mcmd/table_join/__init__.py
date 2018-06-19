class Mcat(MCommand):
    def __init__(self):
        self.name = 'mcat'
        self.description = 'ファイル結合'
        self.parameters.append(InputParameter())

class Mjoin(MCommand):
    def __init__(self):
        self.name = 'mjoin'
        self.description = '結合'
        self.parameters.append(KeyFieldParameter('結合キー名'))
        self.parameters.append(MasterTableParameter())
