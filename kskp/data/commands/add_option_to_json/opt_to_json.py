import json, csv
import pathlib
import re

csv_path = './add_option_to_json/mcmd.csv'
json_hierarchy = './'
new_json_hierarchy = './add_option_to_json/new_json2/'

def add_params_to_json():
    # csvファイルを読み込む
    # jsonファイルを読み込む
    # 読み込んだcsvデータを１行ずつ分割してoptionデータを抽出
    # 抽出したデータを指定されたjson形式に変換、対象のjsonファイルに書き込む

    csv_data = read_csv_mass_data(csv_path)
    for cmd in csv_data:
        analize_one_csv_data(cmd)
    # pass

def write_new_json(write_json_path, write_json_data):
    with open(write_json_path, 'w', encoding='utf-8-sig') as f:
        json.dump(write_json_data, f,ensure_ascii=False, indent=4)


def read_csv_mass_data(file_path):
    #encodingを指定している理由は、BOMありutf-8を普通のutf-8として読み込むと不可視文字'\ufeff'が混じってしまうからである
    return open(file_path, 'r', encoding='utf-8-sig')

def analize_one_csv_data(cmd_line):
    #csvとjsonの必要な情報を読み出して、write_params_to_jsonに投げる
    params_list = cmd_line.split(',')
    # print(params_list)
    cmd_file_name = params_list.pop(0)

    json_path = json_hierarchy + cmd_file_name + '.json'
    cmd_json_data = read_json(json_path)

    write_json_path = new_json_hierarchy + cmd_file_name + '.json'
    created_params_list = []
    created_params_list.extend(create_params_for_json(params_list, []))
    cmd_json_data['params'].clear()
    cmd_json_data['params'] = created_params_list

    write_new_json(write_json_path, cmd_json_data)


def read_json(json_path):
    f = open(json_path, 'r', encoding='utf-8-sig')
    return json.load(f)

def create_params_for_json(params_list, created_params_list):
    #m=はi=とハイフンでつながっていたことを考慮（邪魔なのでcsvから消した、今は [~, m=,~] の形にしてある）
    # print(params_list)
    for opt in params_list:
        opt = opt.replace('\n', '')
        if '|' in opt:
            if opt.startswith('[') and opt.endswith(']'):
                # print(opt)
                opt = opt.replace('|', '],[')
                choice_opt_list = opt.split(',')
                # print(choice_opt_list)
                # print('ads')
            else:
                choice_opt_list = opt.split('|')
            create_params_for_json(choice_opt_list, created_params_list)
            continue

        #次はここから、分解ののちに、dictを作成していく
        else:
            keys = ['name', 'type', 'label']
            if opt.endswith('='):
                opt = opt.replace('=', '').replace('-', '').replace('[', '').replace(']', '')
                values = [opt, 'string', '']
            elif opt.startswith('-'):
                opt = opt.replace('=', '').replace('-', '').replace('[', '').replace(']', '')
                values = [opt, 'boolean', '']
            elif opt.startswith('[-'):
                opt = opt.replace('=', '').replace('-', '').replace('[', '').replace(']', '')
                keys.append('optional')
                values = [opt, 'boolean', '', 'true']
            elif opt.endswith('=]'):
                opt = opt.replace('=', '').replace('-', '').replace('[', '').replace(']', '')
                keys.append('optional')
                values = [opt, 'string', '', 'true']
            else:
                raise Exception
            made_param = dict(zip(keys, values))
            if made_param not in created_params_list:
                print(created_params_list)
                created_params_list.append(made_param)
    # print('end')
    return  created_params_list

add_params_to_json()

#実行時のコマンドは
# $ python add_option_to_json/opt_to_json.py
#であり、実行時の階層はこのファイルがある、その一つ上の階層で実行するべきと思われる
