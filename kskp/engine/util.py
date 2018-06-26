import sys

def command_from_name(name):
    """
    TODO: 結局この関数を作ってしまったが、この方法しかないのだろうか
    """

    d = {
        'ls': 'unix.ls',
        'grep': 'unix.grep',
        'wc': 'unix.wc',
        'cat': 'unix.cat',

        'mcut_n': 'mcmd.coledit.Mcut_n',
        'mcut': 'mcmd.coledit.Mcut',
        'msel': 'mcmd.rowedit.Msel',
        'mselstr': 'mcmd.rowedit.Mselstr',
        'mjoin': 'mcmd.tablejoin.Mjoin',
        'msortf': 'mcmd.rowsort.Msortf',
        'mcount': 'mcmd.tablegrouping.Mcount',
        'muniq': 'mcmd.rowedit.Muniq',
        'mcat': 'mcmd.tablejoin.Mcat',
        'mslide': 'mcmd.tablegrouping.Mslide',
        'msetstr': 'mcmd.coledit.Msetstr',
        'mnullto': 'mcmd.valuetransform.Mnullto',
        'mnumber': 'mcmd.coledit.Mnumber',
        'msum': 'mcmd.tablegrouping.Msum',
        'mbest': 'mcmd.rowedit.Mbest',
        'mtra': 'mcmd.valuecrossing.Mtra',
        'mdelnull': 'mcmd.rowedit.Mdelnull',
        'msed': 'mcmd.valuetransform.Msed',
        'mcal': 'mcmd.Mcal', # これは将来変わるかも

        'mchkcsv': 'mcmd.validation.Mchkcsv',
        'mbucket': 'mcmd.tablesplit.Mbucket',
        'mstats': 'mcmd.tablegrouping.Mstats',
        'mavg': 'mcmd.tablegrouping.Mavg',

        'aggregate': 'util.aggregate',

        'mtee': 'mcmd.datasource.mtee'
    }

    # TODO: このモジュールパスだとengine単体で使えない
    component_path = str(f'kskp.engine.commands.{ d[name] }').split('.')
    package_path = component_path[:-1]
    package_name = '.'.join(package_path)
    class_name = component_path[-1]
    import importlib
    importlib.import_module(str(package_name))
    cls = getattr(sys.modules[package_name], class_name)
    result = cls()
    return result


# TODO: どこでもUNIXコマンドはまだ使えるようにしていないので、この関数はひとまず残しておく
def make_command_array(command, options, parameters):
    '''
    パラメータ以外の（オプションなども加味した）コマンド文字列を作るメソッドが必要なはず
    ただ、その値はGUIで設定するはずなので、それを取得してくる必要がある
    '''
    res = [command]
    # self.paramtersはtupleのlist
    for opt in options:
        if isinstance(opt, str):
            res.append('-' + opt)

    for param in parameters:
        res.append(param)

    return res
