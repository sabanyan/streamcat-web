# 主に履歴に関わる処理を行うモジュール
import json
import functools
from datetime import datetime, timedelta, timezone
from pathlib import Path
from flask import session
from .model import (
    get_flow_path_by_uuid,
    get_user_by_id,
    get_flow_nodes_by_uuid
    )

def make_unfinished_history(now, session):
    """
    libraryで閲覧できる実行履歴(jobs)を作成する
    指定した時間とユーザ名を実行時情報とする
    """
    def _deco(func):
        @functools.wraps(func)
        def deco(*args):

            # 直書き…とりあえずの実装
            history_json = {
                'executedAt': '',
                'executor': {
                    'name': ''
                },
                'inputs': {},
                'params': {},
                'flow': {
                    'uuid':  '',
                    'label': ''
                },
                'projectId': '',
                'data': {},
                'errors': {}
            }

            JST = timezone(timedelta(hours=+9), 'JST')
            history_json['executedAt'] = datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S')
            history_json['executor']['name'] = get_user_by_id(session['user_id'])['name']
            history_json['flow']['uuid'] = args[0]
            history_json['state'] = '実行中'
            data = json.loads(get_flow_path_by_uuid(args[0]).read_text(encoding='utf-8'))
            history_json['projectId'] = data['projectId']

            # ファイル書き込み
            file_name = '{0:%Y%m%d%H%M%S%f}'.format(now)
            path = Path(__file__).parent.joinpath('data/jobs/%s.json' % file_name)
            with path.open('w') as f:
                json.dump(history_json, f, indent = '\t', ensure_ascii=False)

            return func(*args)
        return deco
    return _deco

def make_finished_history(now):
    '''
    指定したファイルパスの実行履歴ファイルをresultを使って更新する
    ファイル名が実行時の時間となっているので、同じファイル名で違うflowを読み込むといけないので
    念のためflowのuuidも使って判別しているが、そこまでする必要ある・・・？
    '''
    def _deco(func):
        @functools.wraps(func)
        def deco(*args):
            result = func(*args)
            file_path = Path(__file__).parent.joinpath('data/jobs/%s.json' % '{0:%Y%m%d%H%M%S%f}'.format(now))
            json_data = json.loads(file_path.read_text(encoding='utf-8'))
            if json_data['flow']['uuid'] == args[0]:
                nodes_dict = get_flow_nodes_by_uuid(args[0])
                for key, val in result.items():
                    # 現在はresultから結果データを取ってきており、データのクラス名を'type'に入れているので
                    # クラス名と'type'に入れたい型が一致しているのが前提になっている（例・frame）
                    json_data['data'][key] = {'type': type(val).__name__.lower(), 'uuid': val.uuid, 'label': nodes_dict.get(key).get('label')}
                json_data['state'] = '実行完了'
                with file_path.open('w') as f:
                    json.dump(json_data, f, indent = '\t', ensure_ascii=False)

            return result
        return deco
    return _deco
