class FieldParameter(Parameter):
    def __init__(self):
        super().__init__()
        self.name = 'f'
        self.caption = '対象列名'

class SortFieldParameter(Parameter):
    def __init__(self):
        self.name = 's'
        self.caption = 'ソート対象列名'

class AppendingFieldParameter(Parameter):
    def __init__(self, caption='追加列名'):
        self.name = 'a'
        self.caption = caption

class ValueParameter(Parameter):
    def __init__(self, caption='追加する値'):
        self.name = 'v'
        self.caption = caption

class CalculateParameter(Parameter):
    def __init__(self, caption='条件式'):
        self.name = 'c'
        self.caption = caption

class KeyFieldParameter(Parameter):
    def __init__(self, caption='キー列名'):
        self.name = 'k'
        self.caption = caption

class InputParameter(Parameter):
    def __init__(self, caption='入力ファイル名'):
        self.name = 'i'
        self.caption = caption

class MasterTableParameter(Parameter):
    def __init__(self, caption='参照ファイル名'):
        self.name = 'm'
        self.caption = caption
