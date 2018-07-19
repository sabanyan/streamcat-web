import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

def make_unfinished_histroy(flow_uuid, user_name):
    """
    libraryで閲覧できる実行履歴jsonを作成する
    指定した時間とユーザ名を実行時情報とする
    """
    now = datetime.now()

    # 直書き…とりあえずの実装
    history_json = {'executedAt':'', 'executor':{'name':''}, 'inputs':{}, 'params':{}, 'flow':{'uuid':''}, 'data':{}, 'errors':{}}

    # nowはミリ秒まで入るのでnowを使ってdatetimeを作り直してからisoformat()を行っている
    history_json['executedAt'] = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second,
                                          tzinfo=timezone(timedelta(hours=+9))).isoformat()
    history_json['executor']['name'] = user_name
    history_json['flow']['uuid'] = flow_uuid
    history_json['state'] = '実行中'

    # ファイル書き込み
    file_name = '{0:%Y%m%d%H%M%S%f}'.format(now)
    path = Path(__file__).parent.as_posix() / Path('data/jobs/%s.json' % file_name)
    with open(path.as_posix(), 'w') as f:
        json.dump(history_json, f, indent = '\t', ensure_ascii=False)

    return path

def make_finished_histroy(flow_uuid, file_path, result):
    '''
    指定したファイルパスの実行履歴ファイルをresultを使って更新する
    ファイル名が実行時の時間となっているので、同じファイル名で違うflowを読み込むといけないので
    念のためflowのuuidも使って判別しているが、そこまでする必要ある・・・？
    '''

    json_data = json.loads(file_path.read_text(encoding='utf-8'))
    if json_data['flow']['uuid'] == flow_uuid:
        for key, val in result.items():
            # 現在はresultから結果データを取ってきており、データのクラス名を'type'に入れているので
            # クラス名と'type'に入れたい型が一致しているのが前提になっている（例・frame）
            json_data['data'][key] = {'type':type(val).__name__.lower(), 'uuid':val.uuid}
        json_data['state'] = '実行完了'
        with open(file_path.as_posix(), 'w') as f:
            json.dump(json_data, f, indent = '\t', ensure_ascii=False)

        # 使うかわからないけどとりあえずBoolean返してる
        return True
    return False
