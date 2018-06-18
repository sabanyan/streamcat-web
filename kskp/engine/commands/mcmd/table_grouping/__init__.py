class Mcount(MCommand):
    def __init__(self):
        self.name = 'mcount'
        self.description = '行数カウント'
        self.parameters.append(KeyFieldParameter('対象列名'))
        self.parameters.append(AppendingFieldParameter('結果列名'))

class Mslide(MCommand):
    def __init__(self):
        self.name = 'mslide'
        self.description = '行ずらし'
        self.parameters.append(SortFieldParameter())
        self.parameters.append(FieldParameter('ずらす対象の列名'))

class Msum(MCommand):
    def __init__(self):
        self.name = 'msum'
        self.description = '合計'
        self.parameters.append(KeyFieldParameter('合計の基準となる列名'))
        self.parameters.append(FieldParameter('合計する列名:合計後の列名'))
