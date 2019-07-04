#!/usr/bin/env python3

import os,sys
import csv
import nysol.mcmd as nm
import traceback

# 目的　KSKP独自コマンドの雛形作成

# やったこと　雛形としての要素を持った簡単な機能を実装して、組み込めることを確認する。

# 雛形として想定した範囲
# 入力、出力とも１つで、runfuncを使って実行される
# 複数入出力がある場合は、runfuncでは対応できないため
# この形式では対応できない


#　ポイント
# ●標準入出力固定
# ●引数は、辞書argsで与えられる。

# KSKP上での実行イメージ(注意：runfunc実行のみの話です)
# ●あるフローを実行する場合、フローの先頭、末端には暗黙でmteeが入れられる仕様になっている。
# 　そのためmtee以外のコマンドは標準入出力でデータをやり取りする。
# ●コマンドへの入力、出力は、標準入出力に固定されるため、フロー上のコマンドは引数を受け取るだけになる。




# #テスト１
# def filereader_gen():
#     '''CSVを１行ずつ取得するジェネレータ'''
#     with sys.stdin as in_file:
#         reader = csv.reader(in_file, delimiter=',', quotechar='"', strict=True)
#         for line in reader:
#             yield line

# def writeline(gen_reader):
#     '''１行ずつとって、標準出力に出す'''
#     with sys.stdout as out_file:
#         writer = csv.writer(out_file, delimiter=',', quotechar='"', strict=True)
#         for line in gen_reader:
#             writer.writerow(line)

# def main(args):
#     reader = filereader_gen()
#     writeline(reader)

# # main(args={})
# print("````````````````")

# # #実行内容１
# f = None
# f <<= nm.runfunc(main,args={})
# f <<= nm.mcut(f="id,v1,v2",o="/dev/stdout")
# f.run(msg="off")



# ## テスト２ args追加
def filereader_gen(args):
    '''CSVを１行ずつ取得するジェネレータ'''
    fd = sys.stdin if args.get('i') is None else open(args['i'], 'r')
    with fd as in_file:
        reader = csv.reader(in_file, delimiter=',', quotechar='"', strict=True)
        for line in reader:
            yield line

def writeline(gen_reader, args):
    '''
    １行ずつとって、標準出力に出す
    ｎ番目の行まで出す
    '''
    fd = sys.stdout if args.get('o') is None else open(args['o'], 'w')
    with fd as out_file:
        writer = csv.writer(out_file, delimiter=',', quotechar='"', strict=True)
        for RowNo,line in enumerate(gen_reader):
            if RowNo <= args['n']:
                writer.writerow(line)

# def main(args):
#     n=args['n']
#     reader = filereader_gen()
#     writeline(reader,n)

# エラー出力確認したくてメッセージ入れたがでてない
def selectrows(args):
    try:
        sys.stderr.write(str("mainにいるよ\n"))
        # n=args['n']
        reader = filereader_gen(args)
        writeline(reader,args)
        sys.stderr.write(str("おわったよ\n"))

    # except Exception as e:
    except Exception :
        with open('/dev/stderr', 'w') as fpe:
            traceback.print_exc(file=fpe)



# in_args={'n': 3}

# f = None
# f <<= nm.runfunc(main,args=in_args)
# f <<= nm.mcut(f="id,v1,v2",o="/dev/stdout")
# f.run(msg="off")
