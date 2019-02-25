class Msum(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msum'
        self.description = '合計'
        self.params.append(Parameter('k', '合計の基準となる列名'))
        self.params.append(Parameter('f', '合計する列名:合計後の列名'))

class Mmbucket(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mmbucket'
        self.description = '多次元行分割'
        self.params.append(Parameter('n', '行数(必須)'))
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('F', '出力形式'))
        self.params.append(Parameter('k', '各項目の各バケットの数値範囲を出力するファイル名'))

class Msep(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'msep'
        self.description = 'レコードの分割'
        self.params.append(Parameter('d', '異なるデータファイルに分割する列名(必須)'))

class Msep2(MCommand):#mnew
    def __init__(self):
        super().__init__()
        self.name = 'msep2'
        self.description = '連番、項目値表の出力を伴った行分割'
        self.params.append(Parameter('k', '分割単位となる項目(必須)'))
        self.params.append(Parameter('O', '連番ファイルを作成するディレクトリ名(必須)'))
        self.params.append(Parameter('o', 'kでの指定項目値に対する連番ファイル名の対応表名'))
        self.params.append(Parameter('a', 'o=にて出力するファイル名の項目名(必須)'))

class Mshuffle(MCommand):#ない？
    def __init__(self):
        super().__init__()
        self.name = 'mshuffle'
        self.description = 'レコード分割'
        self.params.append(Parameter('d', '出力ファイル名の接頭辞(必須)'))
        self.params.append(Parameter('f', 'キー指定'))
        self.params.append(Parameter('n', '分割ファイル数(選択必須)'))
        self.params.append(Parameter('v', '分割するファイルごとのデータ量の重み(選択必須)'))

class Mtee(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtee'
        self.description = '出力'
        self.params.append(Parameter('o', '出力先'))

class Mnjoin(MCommand):
    def __init__(self):
        super().__init__()

        self.name = 'mnjoin'
        self.description = '参照ファイル列の結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mrjoin(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mrjoin'
        self.description = '参照ファイルの範囲条件結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")
        res.append(f"f={args['r']}")
        res.append(f"K={args['R']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mnrjoin(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mnrjoin'
        self.description = '参照ファイルの複数範囲条件結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"f={args['f']}")
        res.append(f"K={args['K']}")
        res.append(f"f={args['r']}")
        res.append(f"K={args['R']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mvjoin(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvjoin'
        self.description = 'ベクトル要素の参照結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"K={args['K']}")
        res.append(f"f={args['f']}")
        res.append(f"f={args['vf']}")
        res.append(f"K={args['n']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mvreplace(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvreplace'
        self.description = 'ベクトル要素の参照置換'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"K={args['K']}")
        res.append(f"f={args['f']}")
        res.append(f"f={args['vf']}")
        res.append(f"K={args['n']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mpaste(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mpaste'
        self.description = '参照ファイル列の行番号マッチング結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"f={args['f']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mproduct(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mproduct'
        self.description = '参照ファイルの直積結合'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"f={args['f']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mcommon(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mcommon'
        self.description = '行選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mnrcommon(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mnrcommon'
        self.description = '参照ファイルの複数範囲条件による行選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['k']}")
        res.append(f"K={args['K']}")
        res.append(f"k={args['r']}")
        res.append(f"K={args['R']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mvcommon(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvcommon'
        self.description = 'ベクトル要素の参照選択'
        self.i_ports = [{'name': 'i', 'type': 'frame'}, {'name': 'm', 'type': 'frame'}]

    def command_args(self, args, inputs):
        res = self.name.split()

        res.append(f"k={args['vf']}")
        res.append(f"K={args['K']}")

        input_m = inputs['m']

        # パイプなら、CSVに吐く
        input_m.command_to_file()
        res.append(f"m={ input_m.source.fullpath }")

        return res

    def stdin(self, inputs):
        return inputs['i'].source.fd

class Mfsort(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mfsortf'
        self.desription = '項目ソート'
        self.params.append(Parameter('f', '対象列名(必須)'))

class Mfldname(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mfldname'
        self.description = '列名の変更'
        self.params.append(Parameter('f', '旧列名(必須)'))
        self.params.append(Parameter('n', '新列名'))


class Mnumber(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnumber'
        self.description = '連番'
        self.params.append(Parameter('s', 'ソート対象列名'))
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('e', '同一キー同一ソートの処理方法の指定'))
        self.params.append(Parameter('l', '連番の間隔'))
        self.params.append(Parameter('k', '連番もしくは連文字を振る単位となる列'))
        self.params.append(Parameter('S', '開始No'))

class Mrand(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mrand'
        self.description = '擬似乱数'
        self.params.append(Parameter('k', '指定キーと同名のキー値に同じラン数値'))
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('max', '乱数の最大値、この値の指定時には-intも設定することが必須'))
        self.params.append(Parameter('min', '乱数の最小値、この値の指定時には-intも設定することが必須'))
        self.params.append(Parameter('S', '乱数の種'))#update 2018 july 12

class Mshare(MCommand):#edit
    def __init__(self):
        super().__init__()
        self.name = 'mshare'
        self.description = '構成比の計算'
        self.params.append(Parameter('f', '指定列の構成比計算(必須)'))
        self.params.append(Parameter('k', '構成比計算の単位となる列名'))

class Msplit(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msplit'
        self.desription = '区切り文字による列分割'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('a', '新項目名(必須)'))
        self.params.append(Parameter('delim', '新しい区切り文字'))

class Mvcat(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvcat'
        self.description = 'ベクトルの併合'
        self.params.append(Parameter('vf', '併合するベクトル列名(必須)'))
        self.params.append(Parameter('a', '併合後の列名(必須)'))

class Mvcount(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvcount'
        self.description = 'ベクトルサイズの計算'
        self.params.append(Parameter('vf', '要素数をカウントするベクトルの列名(必須)'))

class Marff2csv(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'marff2csv'
        self.description = 'arffからcsv形式への変換'

class Mcsv2arff(MCommand):#new
    pass
#     def __init__(self):
#         super().__init__(nm.mcsv2arff)
#         self.name = 'csv2marff'
#         self.description = 'csvからarff形式への変換'
#         self.params.append(Parameter('n', '数値列名(必須)'))
#         self.params.append(Parameter('d', 'カテゴリ列名(必須)'))
#         self.params.append(Parameter('D', '日付列名リスト(必須)'))
#         self.params.append(Parameter('s', '文字列列名(必須)'))
#         self.params.append(Parameter('T', 'タイトル名'))

class Mtab2csv(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtab2csv'
        self.desription = 'TSVからCSVデータへの変換'
        self.params.append(Parameter('d', '区切り文字'))

class Mxml2csv(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mxml2csv'
        self.description = 'xmlからcsv形式への変換'
        self.params.append(Parameter('k', '１行の単位となる要素のパス名(必須)'))
        self.params.append(Parameter('f', '要素もしくは属性の指定(必須)'))
        self.params.append(Parameter('i', 'xmlデータファイル'))

class Mbest(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mbest'
        self.description = '指定行選択'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('s', 'ソート対象列名(必須)'))
        self.params.append(Parameter('from', '選択する開始行番号'))
        self.params.append(Parameter('to', '選択する終了行番号'))
        self.params.append(Parameter('size', '選択する行数'))
        self.params.append(Parameter('k', '指定列が同じ値の行ごとにfrom=,to=,sizeで指定した行番号の行を選択'))#???
        # self.params.append(Parameter('u', '条件に合わないデータ出力ファイル名'))

class Mdelnull(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mdelnull'
        self.description = 'NULL行削除'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('k', '削除する単位となるキー列名'))
        # self.params.append(Parameter('u', '条件に合わないデータ出力ファイル名'))

class Mduprec(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mduprec'
        self.description = 'レコードの複写'
        self.params.append(Parameter('f', '指定列の値の回数分の複写を実行(選択必須)'))
        self.params.append(Parameter('n', '各行の複写回数(選択必須)'))

class Mpadding(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mpadding'
        self.description = '行補完コマンド'
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('f', '連続パディング対象列名(必須)'))
        self.params.append(Parameter('v', 'パディング用文字列'))
        self.params.append(Parameter('S', '開始値'))
        self.params.append(Parameter('E', '終了値'))

# class Msel(MCommand):
#     def __init__(self):
#         super().__init__()
#         self.name = 'msel'
#         self.description = '行絞り込み'
#         self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
#         self.params.append(Parameter('c', '絞込条件式(必須)'))
#         # self.params.append(Parameter('u', '指定条件に合わない行を出力するファイル名'))

class Mselnum(MCommand):#editing(o, u)の扱いがわからない
    def __init__(self):
        super().__init__()
        self.name = 'mselnum'
        self.description = '数値範囲による行選択'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('f', '検索列名(必須)'))
        self.params.append(Parameter('c', '検索文字列(必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列名'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

class Mselrand(MCommand):#editing(u)の扱いがわからない
    def __init__(self):
        super().__init__()
        self.name = 'mselrand'
        self.description = 'ランダムな行選択'
        self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
        self.params.append(Parameter('c', '各キーの値毎に選択する行数(選択必須)'))
        self.params.append(Parameter('p', '各キーを選択する割合をパーセンテージで指定(選択必須)'))
        self.params.append(Parameter('k', '選択単位となるキー列'))
        self.params.append(Parameter('S', '乱数の種'))
        # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

# class Mselstr(MCommand):###ここから修正再開
#     def __init__(self):
#         super().__init__()
#         self.name = 'mselstr'
#         self.description = '行選択(文字列)'
#         self.o_ports = [{'name': 'o', 'type': 'frame'}, {'name': 'u', 'type': 'frame'}]
#         self.params.append(Parameter('f', '対象列名'))
#         self.params.append(Parameter('v', '絞込条件値（文字列）'))
#         self.params.append(Parameter('k', '選択単位となるキー列名'))
#         # self.params.append(Parameter('u', '指定条件に合わない行の出力ファイル名'))

class Muniq(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'muniq'
        self.description = '単一化'
        self.params.append(Parameter('k', 'キー列名'))

class Maccum(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'maccum'
        self.description = '累積計算'
        self.params.append(Parameter('f', '累積列名(必須)'))
        self.params.append(Parameter('s', '並び替えの後、累積計算を行う列名(必須)'))
        self.params.append(Parameter('k', '累積単位となる列名'))

class Mcount(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mcount'
        self.description = '行数カウント'
        self.params.append(Parameter('k', '対象列名'))
        self.params.append(Parameter('a', '結果列名(必須)'))

class Mhashavg(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mhashavg'
        self.description = 'ハッシュ法による列値の平均'
        self.params.append(Parameter('f', '平均を求める列名(必須)'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('hs', 'ハッシュサイズ'))

class Mhashsum(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mhashsum'
        self.description = 'ハッシュ法による列の値の合計'
        self.params.append(Parameter('f', '合計を求める列名(必須)'))
        self.params.append(Parameter('k', 'キーとする列名'))
        self.params.append(Parameter('hs', 'ハッシュサイズ'))

class Mkeybreak(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mkeybreak'
        self.description = 'キーブレイク箇所'
        self.params.append(Parameter('k', '集計キー列名(必須)'))
        self.params.append(Parameter('s', '並べ替えの後、先端、終端に印をつける列名'))
        self.params.append(Parameter('a', '先端と終端の印を出力する列名'))

class Mmvavg(MCommand):#editting(判断を仰ぐ、多分大丈夫やと思うけどね)
    def __init__(self):
        super().__init__()
        self.name = 'mmvavg'
        self.description = '移動平均の算出'
        self.params.append(Parameter('s', '並べ替えの後、移動平均を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '移動平均を求める列名(必須)'))
        self.params.append(Parameter('t', '期間数の指定、alpha=指定時には設定できない'))
        self.params.append(Parameter('alpha', '平滑化係数、-exp指定時のみ'))
        self.params.append(Parameter('skip', '出力を抑制する最初の行数'))

class Mmvsim(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'mmvsim'
        self.description = '移動窓の類似度計算'
        self.params.append(Parameter('s', '並べ替えの後、各種類似度を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('t', '期間数の指定'))
        self.params.append(Parameter('c', '類似度名を指定(必須)'))#コマンド指定
        self.params.append(Parameter('a', '新規に作成する項目名(必須)'))
        #類似度名はあらかじめ決められている。
        #類似度=covar|ucovar|pearson|spearman|kendall|euclid|cosine|
        #cityblock|hamming|chi|phi|jaccard|supportr|lift|confMax|
        #confMin|yuleQ|yuleY|kappa|oddsRatio|convMax|convMin
        self.params.append(Parameter('skip', '出力抑制を行う最初の行数指定'))

class Mmvstats(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'mmvstats'
        self.description = '移動窓の統計量の計算'
        self.params.append(Parameter('s', '並べ替えの後、各種統計量を計算する列名'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('t', '期関数の指定'))
        self.params.append(Parameter('c', '統計量を指定(必須)'))#コマンド指定
        #統計量はあらかじめ決められている
        # 統計量リスト:sum/mean/count/ucount/devsq/var/uvar/sd/usd/cv/min/qtile1/median/qtile3/max/
        # range/qrange/mode/skew/uskew/kurt/ukurt
        self.params.append(Parameter('skip', '出力抑制を行う最初の行数指定'))

class Mnormalize(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'mnormalize'
        self.description = '基準化'
        self.params.append(Parameter('c', '基準化方法を指定(必須)'))#二者択一
        self.params.append(Parameter('f', '基準化列名(必須)'))
        self.params.append(Parameter('k', '単位とする列名'))


class Msim(MCommand):#editting
    def __init__(self):
        super().__init__()
        self.name = 'msim'
        self.description = '二変数間の類似度の計算'
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '二列間の類似度を求める列名(必須)'))
        self.params.append(Parameter('c', '類似度名を指定(必須)'))
        #類似度名はあらかじめ決められている。
        #類似度=covar|ucovar|pearson|spearman|kendall|euclid|cosine|
        #cityblock|hamming|chi|phi|jaccard|supportr|lift|confMax|
        #confMin|yuleQ|yuleY|kappa|oddsRatio|convMax|convMin
        self.params.append(Parameter('a', '二変数の名前の指定'))

class Mslide(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mslide'
        self.description = '行ずらし'
        self.params.append(Parameter('s', 'ソート対象列名'))
        self.params.append(Parameter('f', 'ずらす対象の列名(必須)'))
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('t', 'ずらす回数'))

class Msummary(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'msummary'
        self.description = '1変数の統計量の計算'
        self.params.append(Parameter('k', '単位とする列名'))
        self.params.append(Parameter('f', '集計列名(必須)'))
        self.params.append(Parameter('c', '統計量を指定'))
        #統計量はあらかじめ決められている
        # 統計量リスト:sum/mean/count/ucount/devsq/var/uvar/sd/usd/cv/min/qtile1/median/qtile3/max/
        # range/qrange/mode/skew/uskew/kurt/ukurt

class Mwindow(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mwinddow'
        self.description = 'スライド窓の生成'
        self.params.append(Parameter('wk', '出力データにおける、窓を識別する値となる入力データの列名(必須)'))
        self.params.append(Parameter('t', '窓の行数指定(必須)'))
        self.params.append(Parameter('k', '窓を生成する単位となる列名'))

class M2cross(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'm2cross'
        self.description = '1対Nのクロス集計'
        self.params.append(Parameter('f', '組み合わせ列名(必須)'))
        self.params.append(Parameter('s', '列項目名に展開する列(選択必須)'))
        self.params.append(Parameter('a', '２項目指定(選択必須)'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL血置換文字列'))

class Mcombi(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mcombi'
        self.description = '組合せ計算'
        self.params.append(Parameter('a', '追加列名(必須)'))
        self.params.append(Parameter('f', '組み合わせ列名(必須)'))
        self.params.append(Parameter('n', '組み合わせ数(必須)'))
        self.params.append(Parameter('s', '並び替えの後、f=で指定の列の組み合わせを求める列名'))
        self.params.append(Parameter('k', 'キー列名'))

class Mcross(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mcross'
        self.description = 'クロス集計'
        self.params.append(Parameter('f', '指定列の値(必須)'))
        self.params.append(Parameter('s', '列名となる元のデータ列(必須)'))#ここの説明が怪しい
        self.params.append(Parameter('a', 'f=で指定した列名がデータとして展開する列名'))
        self.params.append(Parameter('k', 'キー列名'))
        self.params.append(Parameter('v', 'NULL値置換文字列'))

class Mtra(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mtra'
        self.description = '縦横変換'
        self.params.append(Parameter('k', '変換キー列名'))
        self.params.append(Parameter('s', '並び替えの後、変換を行う列名'))
        self.params.append(Parameter('f', '連結前列名:連結後列名(必須)'))

class Mtrafld(MCommand):#mtraflgと名前がダブる
    def __init__(self):
        super().__init__()
        self.name = 'mtrafld'
        self.description = 'クロス表をトランザクション項目に変換'
        self.params.append(Parameter('a', 'トランザクション列名(必須)'))
        self.params.append(Parameter('f', '列名リスト'))
        self.params.append(Parameter('delim', 'トランザクション項目アイテムを区切る文字列'))
        self.params.append(Parameter('delim2', '項目名と値ペアを区切る文字列'))

class Mtraflg(MCommand):#mtrafldと名前がダブる
    def __init__(self):
        super().__init__()
        self.name = 'mtraflg'
        self.description = 'クロス表をトランザクション項目に変換'
        self.params.append(Parameter('a', 'トランザクション列名(必須)'))
        self.params.append(Parameter('f', '列名リスト(必須)'))
        self.params.append(Parameter('delim', 'トランザクション項目アイテムを区切る文字'))

class Mchgnum(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mchgnum'
        self.description = '数値範囲による置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('R', '置換対象となる数値範囲(必須)'))
        self.params.append(Parameter('O', '範囲外文字列'))
        self.params.append(Parameter('v', 'R=に対応する置換文字列'))


class Mchgstr(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mchgnum'
        self.description = '文字列の置換'
        self.params.append(Parameter('c', '置換対象となる文字列と対応する置換文字列(必須)'))
        self.params.append(Parameter('f', '置換対象列(必須)'))
        self.params.append(Parameter('O', 'c=に無い文字列を置換する場合の文字列'))

class Mdformat(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mdformat'
        self.description = '日付時刻抽出'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('c', '文字列のフォーマット(必須)'))

class Mnullto(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'mnullto'
        self.description = 'NULL置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '置換後の文字列'))
        self.params.append(Parameter('O', 'NULL値以外を置換する文字列'))

class Msed(MCommand):
    def __init__(self):
        super().__init__()
        self.name = 'msed'
        self.description = '文字列置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('c', '変換パターン(必須)'))
        self.params.append(Parameter('v', '変換後文字列(必須)'))

class Mtonull(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mtonull'
        self.description = 'NULL値へ置換'
        self.params.append(Parameter('f', '対象列名(必須)'))
        self.params.append(Parameter('v', '変換前文字列(必須)'))

class Mvdelim(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvdelim'
        self.description = 'ベクトル要素の区切り文字変更'
        self.params.append(Parameter('vf', '対象列名(必須)'))
        self.params.append(Parameter('v', '新しい区切り文字(必須)'))

class Mvdelnull(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvdelnull'
        self.description = 'ベクトル要素のNULL要素削除'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class Mvnullto(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvnullto'
        self.description = 'ベクトル要素のNULL置換'
        self.params.append(Parameter('vf', '対象列名(必須)'))
        self.params.append(Parameter('v', '置換文字列'))
        self.params.append(Parameter('O', 'NULL以外の全要素を置換する文字列'))

class Mvsort(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvsort'
        self.description = 'ベクトル要素のソート'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class Mvuniq(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mvuniq'
        self.description = 'ベクトル要素の単一化'
        self.params.append(Parameter('vf', '対象列名(必須)'))

class Mchkcsv(MCommand):#new
    def __init__(self):
        super().__init__()
        self.name = 'mchkcsv'
        self.description = 'csvデータのチェック・修復'
        self.params.append(Parameter('i', '入力ファイル名'))
        self.params.append(Parameter('a', '入力データ列を無視する、新しい列名'))
# KCMD
class SelectTargetColumn(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('t', '目的変数'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.preprocess.selecttargetcolumn import SelectTargetColumn as Base
        command = Base()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-t', args['t']])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Standardize(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('c', '対象列名'))
        self.params.append(Parameter('a', '全ての列'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.preprocess.standardize import Standardize as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-c', args['c']])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Label_encode(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('c', '対象列名'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.preprocess.label_encode import Label_encode as Base
        command = Base()
        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-c', args['c']])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Normalize(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('c', '対象列名'))
        self.params.append(Parameter('a', '全ての列'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.preprocess.normalize import Normalize as Base
        command = Base()
        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-c', args['c']])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class One_hot_encode(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('c', '対象列名'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.preprocess.one_hot_encode import One_hot_encode as Base
        command = Base()
        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-c', args['c']])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Pca(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('--n_components', ''))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.preprocess.pca import Pca as Base
        command = Base()
        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix()])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Kkmeans(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('--n_clusters', ''))
        self.params.append(Parameter('--n_init', ''))
        self.params.append(Parameter('--max_iter', ''))
        self.params.append(Parameter('--precompute_distances', ''))
        self.params.append(Parameter('--tol', ''))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.clustering.kkmeans import Kkmeans as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix()])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class CKab(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('-l', ''))
        self.params.append(Parameter('-r', ''))
        self.params.append(Parameter('-a', ''))
        self.params.append(Parameter('--n_estimators', ''))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.kab import Kab as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKbag(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('-r', ''))
        self.params.append(Parameter('--n_estimators', ''))
        self.params.append(Parameter('--max_samples', ''))
        self.params.append(Parameter('--unuse_bootstrap', ''))
        self.params.append(Parameter('--max_features', ''))
        self.params.append(Parameter('--unuse_bootstrap_features', ''))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.kbag import Kbag as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKdt(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.kdt import Kdt as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKgb(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.kgb import Kgb as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKnearestNeighbors(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.knearest_neighbors import Knearest_neighbors as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKneuralnet(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.kneuralnet import Kneural_network as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKrf(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.krf import Krf as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class CKsvm(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.ksvm import Ksvm as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class KgaussianNb(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.kgaussian_nb import Kgaussian_nb as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Klogreg(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.classification.klogreg import Klogreg as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKab(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kab import Kab as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKbag(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kbag import Kbag as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKdt(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kdt import Kdt as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKgb(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kgb import Kgb as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKnearestNeighbors(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.knearest_neighbors import Knearest_neighbors as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKneuralnet(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kneuralnet import Kneural_network as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKrf(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.krf import Krf as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class RKsvm(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.ksvm import Ksvm as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Kelastic(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kelastic import Kelastic as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Kridge(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.kridge import Kridge as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Klasso(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.klasso import Klasso as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Klinreg(UnixCommand):
    def __init__(self):
        super().__init__()

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.modeling.regression.klinreg import Klinreg as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath
        inputs['i'].command_to_file()
        file_name = str(uuid.uuid4()) + '.pickle'
        command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-o', Path(frames_path).joinpath(file_name).as_posix()])
        command.write()
        return PathFileSource('pickle', frames_path, file_name)

class Evaluate(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('d', 'データのパス'))
        self.params.append(Parameter('m', 'メトリクス'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.postprocess.evaluate import Evaluate as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath

        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(),
                                  '-d', Path(frames_path).joinpath(args['d']).as_posix(),
                                  '-m', args['m']])
        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)

class Predict(UnixCommand):
    def __init__(self):
        super().__init__()
        self.params.append(Parameter('d', 'データのパス'))

    def execute(self, args, inputs):
        frame = Frame(str(uuid.uuid4()), self.source(args, inputs))
        return { self.o_ports[0]['name']: frame }

    def source(self, args, inputs):
        frames_path = 'kskp/data/frames'
        from .commands.kcmd.postprocess.predict import Predict as Base
        command = Base()
        # command.input = inputs['i'].source.fullpath

        inputs['i'].command_to_file()
        dataframe = command.main(['-i', inputs['i'].source.fullpath.as_posix(), '-d', Path(frames_path).joinpath(args['d']).as_posix()])

        return PandasSource('csv', frames_path, str(uuid.uuid4()) + '.csv', dataframe)
