import sys, os
import csv
import inspect
from pathlib import Path
import glob
import json
import operator


classifications = {
      "calculation":"項目間の計算",
      "col_edit":"列に対する選択・加工",
      "data_format":"フォーマットの整形",
      "data_source":"データソース出力",
      "row_edit":"行に対する選択・加工",
      "row_sort":"行のソート",
      "table_grouping":"テーブルの集計",
      "table_join":"テーブルの結合",
      "table_split":"テーブルの分割",
      "validation":"データの整合性チェック",
      "value_crossing":"行と列に対する加工",
      "value_transform":"セルの値の変換",
      "data_mining":"データマイニング",
      "views":"グラフ描画",
      "graphviz":"グラフ構造の画像への変換",
      "classification":"分類",
      "clustering":"クラスタリング",
      "postprocess":"機械学習 後処理",
      "preprocess":"機械学習 前処理",
      "regression":"回帰",
    }

def get_json_label():
    pass

def get_json_classification():
    pass

def make_csv():

    json_files = glob.glob("./*.json")

    cmd_llist = []
    # cmd_llist_name = ['コマンドID', 'コマンド名', '分類']
    # cmd_llist.append(cmd_llist_name)
    for json_file in json_files:
        cmd_clist = []
        with open(json_file, 'r') as f:
            jsonData = json.load(f)
            cmd_clist.append(jsonData["id"])
            cmd_clist.append(jsonData["label"])
            cmd_clist.append(classifications[jsonData["classification"]])
            print(cmd_clist)
            cmd_llist.append(cmd_clist)
    print(cmd_llist)

    # print(csv_files)
    with open("./cmd_name_and_description/output.csv", 'w', encoding='shift_jis') as file:
        writer = csv.writer(file, lineterminator='\n')
        for cmd in cmd_llist:
            writer.writerow(cmd)

    with open("./cmd_name_and_description/output.csv", 'r', encoding='shift_jis') as file:
        reader = csv.reader(file)
        sot = sorted(reader, key=operator.itemgetter(2))

    # print(sot)
    with open ("./cmd_name_and_description/KSKPコマンドリスト.csv", 'w', encoding='shift_jis') as file:
        writer = csv.writer(file, lineterminator='\n')
        for cmd in sot:
            writer.writerow(cmd)


make_csv()

#使用時のコマンドは
# $ python cmd_name_and_description.make_csv_by_json.py
#だろう