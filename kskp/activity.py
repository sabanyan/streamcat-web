# 主に履歴に関わる処理を行うモジュール
import json
import functools
from . import model
from datetime import datetime, timedelta, timezone
from pathlib import Path
from .model import get_flow_path_by_uuid
from flask import (
    Blueprint, session, render_template, url_for, jsonify, request, redirect, flash
)

def make_unfinished_history(now):
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
                    'uuid': ''
                },
                'projectId': '',
                'data': {},
                'errors': {}
            }

            # nowはミリ秒まで入るのでnowを使ってdatetimeを作り直してからisoformat()を行っている
            history_json['executedAt'] = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second,
                                                  tzinfo=timezone(timedelta(hours=+9))).isoformat()
            history_json['executor']['name'] = model.get_user_by_id(session['user_id'])['name']
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
                for key, val in result.items():
                    # 現在はresultから結果データを取ってきており、データのクラス名を'type'に入れているので
                    # クラス名と'type'に入れたい型が一致しているのが前提になっている（例・frame）
                    json_data['data'][key] = {'type': type(val).__name__.lower(), 'uuid': val.uuid}
                json_data['state'] = '実行完了'
                with file_path.open('w') as f:
                    json.dump(json_data, f, indent = '\t', ensure_ascii=False)

                # 使うかわからないけどとりあえずBoolean返してる
            return result
        return deco
    return _deco

def add_activity_for_flow(id):
    '''
    フローに作成時に作成履歴をつけるためのデコレータ
    '''
    def _deco(func):
        @functools.wraps(func)
        def deco():
            data = func()
            now = datetime.now()

            # 一回別の変数に入れなければいけないみたい・・・
            user_id = id
            if user_id is None:
                user_id = session['user_id']

            data['creator'] = model.get_user_by_id(user_id)['name']
            data['createdAt'] = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second,
                                        tzinfo=timezone(timedelta(hours=+9))).isoformat()
            return data
        return deco
    return _deco
