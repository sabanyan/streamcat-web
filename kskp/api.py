import json
import uuid
from pathlib import Path

from flask import Blueprint, request, session, jsonify, send_from_directory
from .auth import login_required_api
from .navigation import (
    update_navigation_user,
    update_navigation_project,
    update_navigation_flow
)
from .model import (
    start_project,
    get_projects_by_user_id,
    delete_project_by_uuid,
    get_project_id_by_uuid,
    create_flow,
    delete_flow_by_uuid,
    fetch_flow_by_uuid,
    fetch_flows_by_project_uuid,
    update_flow_by_uuid,
    get_flow_path_by_uuid,
    get_user_by_id
)
from .activity import (
    make_unfinished_history,
    make_finished_history
)
from datetime import datetime, timezone, timedelta

api = Blueprint('api', __name__)

DATAFRAME_DIR_PATH = api.root_path / Path('data/frames')
JOBS_DIR_PATH = api.root_path / Path('data/jobs')
FLOWS_DIR_PATH = api.root_path / Path('data/flows')

@api.route('/projects', methods=['POST'])
@login_required_api
def new_project():
    """
    新しいプロジェクトを作成するAPI
    """

    params = request.json
    start_project(params['name'], session)

    # 正常終了
    return jsonify({'success': True})

@api.route('/projects')
@login_required_api
@update_navigation_user
def get_projects():
    """
    現在ログイン中のユーザが閲覧できるプロジェクト一覧を返却するAPI
    """

    projects = []
    for p in get_projects_by_user_id(session['user_id']):
        proj = {}
        proj['uuid'] = p['uuid']
        proj['name'] = p['name']
        proj['creator_id'] = p['creator_id']
        proj['creator_name'] = p['creator_name']
        proj['created_at'] = p['created_at']
        projects.append(proj)

    return jsonify({'success': True, 'data': projects})


@api.route('/projects/<project_uuid>', methods=['DELETE'])
@login_required_api
def delete_project(project_uuid):
    """
    指定したプロジェクトを削除する
    """

    delete_project_by_uuid(project_uuid)

    return jsonify({'success': True})


@api.route('/flows', methods=['POST'])
@login_required_api
def new_flow():
    """
    新しいフローを作成する
    TODO: JSONに必要な項目があるかどうかのValidationを追加したい
    """

    j = request.json
    project_id = get_project_id_by_uuid(j['project_uuid'])

    # 指定されたUUIDを持つプロジェクトが存在しない場合はエラー
    if project_id is None:
        return jsonify({'success': False, 'message': 'invalid project uuid: (%s)' % j['project_uuid']})

    new_flow = create_flow(project_id, j['name'])

    return jsonify({'success': True, 'data': new_flow})

@api.route('/flows', methods=['GET'])
@login_required_api
@update_navigation_project
def fecth_flows():
    """
    パラメータで指定されたプロジェクトが持つフローの一覧を取得する
    """
    return jsonify({'success': True, 'data': fetch_flows_by_project_uuid(request.args.get('project'))})


@api.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@update_navigation_flow
def fetch_flow(flow_uuid):
    """
    指定されたフローを取得する
    """
    return jsonify({'success': True, 'data': fetch_flow_by_uuid(flow_uuid)})


@api.route('/flows/<flow_uuid>', methods=['PUT'])
@login_required_api
def update_flow(flow_uuid):
    """
    指定されたフローを更新する
    """
    result = update_flow_by_uuid(flow_uuid, request.json)
    return jsonify({'success': True, 'data': result})


@api.route('/flows/<flow_uuid>', methods=['DELETE'])
@login_required_api
def delete_flow(flow_uuid):
    """
    指定されたフローを削除する
    """

    delete_flow_by_uuid(flow_uuid)

    return jsonify({'success': True})


@api.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """

    path = api.root_path / Path('data/commands')

    commands = []
    for command_path in path.iterdir():
        command_json = command_path.read_text(encoding='utf-8')
        command_data = json.loads(command_json)
        commands.append(command_data)

    return jsonify({'success': True, 'data': commands})


@api.route('/frames', methods=['GET', 'POST'])
def make_new_frame():
    """
    新しいframeを作成する
    方法は様々
    """

    if 'file' in request.files:
        # ファイルがPOSTで送信されてきたらアップロードだとみなす
        upload_frame(request)
        return jsonify({'success': True})
    elif 'from' in request.args:
        if '.' in request.args['from']:
            # ドットで区切って、具体的に一つだけstepを指定することができる
            # TODO: 後々この部分は文法を拡張していく予定
            froms = request.args['from'].split('.')
            flow_uuid = froms[0]
            step_id = froms[1]
        else:
            flow_uuid = request.args['from']
            step_id = None
        return execute_flow(flow_uuid, step_paths=step_id)
    else:
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'invalid json'
                        })

@api.route('/frames/<frame_uuid>')
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """

    file_path = DATAFRAME_DIR_PATH / Path('%s.csv' % frame_uuid)
    result = load_as_data_frame(file_path.read_text(encoding='utf-8'))

    return jsonify({'success': True, 'data': result})


@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})


def upload_frame(req):
    """
    CSVをアップロードする
    TODO: テスト未実施
    """
    f = req.files['file']
    file_name = req.form['file_name']

    from werkzeug.utils import secure_filename
    file_path = DATAFRAME_DIR_PATH / Path(secure_filename(file_name))
    f.save(file_path.as_posix())
    f.close()


@api.route('/files')
def download_frame():
    type = request.args.get('type')
    frame_uuid = request.args.get('uuid')
    ext = request.args.get('ext')

    # タイムゾーンの設定
    JST = timezone(timedelta(hours=+9), 'JST')
    date = datetime.now(JST)

    # ダウンロードファイルの名前
    downloadFileName = 'KSKP' + date.strftime("%Y%m%d%H%M") + '.' + ext
    # ダウンロード対象のファイルの名前
    downloadFile = frame_uuid + '.' + ext

    return send_from_directory(DATAFRAME_DIR_PATH, downloadFile, as_attachment = True,
                               attachment_filename = downloadFileName, mimetype = 'text/csv')

def execute_flow(flow_uuid, step_paths):

    # 指定されたIDのフローが存在するかどうかをチェックする
    # まずは、フローファイル一覧を取得する
    target_flow_file_path = get_flow_path_by_uuid(flow_uuid)

    if not target_flow_file_path:
        # ファイルが存在しないときはここを通る
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'flow does not exist'
                        })
    else:
        result_data = execute_flow_internal(flow_uuid, step_paths)
        if not result_data:
            return jsonify({
                                'success': False,
                                'code': -1,
                                'message': 'result is empty.'
                            })
        else:
            return jsonify({'success': True, 'name': result_data})


@api.route('/jobs', methods=['GET'])
def jobs():
    """
    指定されたフローの実行結果を返す
    """
    flow_uuid = ''
    count = 0

    if 'flow' in request.args:
        flow_uuid = request.args['flow']

    if 'count' in request.args:
        count = int(request.args['count'])

    execute_histories = []
    for job_path in Path(JOBS_DIR_PATH).iterdir():
        data = json.loads(job_path.read_text(encoding='utf-8'))
        if data['flow']['uuid'] == flow_uuid:
            execute_histories.append(data)

    results = sorted(execute_histories, key = lambda x:x['executedAt'])

    # 条件分岐が雑なので修正予定
    if 0 < count and count <= len(results):
        result = []
        result.append(results[count - 1])
        return jsonify({'success': True, 'data': result})
    elif len(results) < count:
        return jsonify({'success': False})

    return jsonify({'success': True, 'data': results})


import nysol.mcmd as nm

frames_path = Path('kskp/data/frames')

def execute_by_sensor(sensor, i):
    state1 = nm.mavg(i=i, f=f'{sensor}:{sensor}_avg')
    state1 <<= nm.mcut(f=f'Time,{sensor}_avg')

    state2 = nm.mstats(i=i, c='sd', f=f'{sensor}:{sensor}_sd')
    state2 <<= nm.mcut(f=f'Time,{sensor}_sd')

    state3 = nm.mstats(i=i, c='max', f=f'{sensor}:{sensor}_max')
    state3 <<= nm.mcut(f=f'Time,{sensor}_max')

    state4 = nm.mstats(i=i, c='min', f=f'{sensor}:{sensor}_min')
    state4 <<= nm.mcut(f=f'Time,{sensor}_min')

    last = nm.mjoin(k='Time', i=state1, m=state2)
    last <<= nm.mjoin(k='Time', m=state3)
    last <<= nm.mjoin(k='Time', m=state4)

    return last

def execute_by_state(i, o=None):
    """ 状態ごとの処理 """

    # 全体の統計量
    s1 = execute_by_sensor('3H', i)
    s2 = execute_by_sensor('3V', i)
    s3 = execute_by_sensor('4H', i)
    s4 = execute_by_sensor('4V', i)

    last = nm.mjoin(k='Time', i=s1, m=s2)
    last <<= nm.mjoin(k='Time', m=s3)
    if o is None:
        last <<= nm.mjoin(k='Time', m=s4)
    else:
        last <<= nm.mjoin(k='Time', m=s4, o=o)

    return last

def execute_all_and_section(i, f, o1, o2):
    temp = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
    state = nm.mcut(i=i, x=True, f=f, o=temp.as_posix())
    state.run()

    new_i = temp.as_posix()

    temp2 = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
    sections = nm.mbucket(i=new_i, f='Time:Section', n=10, rng=True, o=temp2.as_posix())
    sections.run()
    temp_secs = []
    secs = []
    for x in range(10):
        temp_sec = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
        sec1 = nm.mselstr(i=temp2.as_posix(), f='Section', v=x+1, o=temp_sec.as_posix())
        sec1.run()

        sec2 = execute_by_state(temp_sec.as_posix())
        temp_sec2 = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
        sec2 <<= nm.msetstr(a='Section', v=x+1, o=temp_sec2.as_posix())
        temp_secs.append(temp_sec2.as_posix())
        secs.append(sec2)
        sec2.run()

    return execute_by_state(new_i, o1), nm.mcat(i=','.join(temp_secs), o=o2), temp

import time

@api.route('/execute-direct')
def execute_direct():
    t1 = time.time()
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()

    o1 = frames_path.joinpath('result_all1.csv')
    o2 = frames_path.joinpath('result_all2.csv')
    o3 = frames_path.joinpath('result_all3.csv')
    o4 = frames_path.joinpath('result_all4.csv')
    o5 = frames_path.joinpath('result_all5.csv')
    o1_sec = frames_path.joinpath('result_sec1.csv')
    o2_sec = frames_path.joinpath('result_sec2.csv')
    o3_sec = frames_path.joinpath('result_sec3.csv')
    o4_sec = frames_path.joinpath('result_sec4.csv')
    o5_sec = frames_path.joinpath('result_sec5.csv')

    state1, state_sec1, temp1 = execute_all_and_section(i, '0,1,2,3,4', o1.as_posix(), o1_sec.as_posix())
    state2, state_sec2, temp2 = execute_all_and_section(i, '0,5,6,7,8', o2.as_posix(), o2_sec.as_posix())
    state3, state_sec3, temp3 = execute_all_and_section(i, '0,9,10,11,12', o3.as_posix(), o3_sec.as_posix())
    state4, state_sec4, temp4 = execute_all_and_section(i, '0,13,14,15,16', o4.as_posix(), o4_sec.as_posix())
    state5, state_sec5, temp5 = execute_all_and_section(i, '0,17,18,19,20', o5.as_posix(), o5_sec.as_posix())

    o_all = frames_path.joinpath('last_all.csv').as_posix()
    i_s = [state1, state2, state3, state4, state5]
    last_all = nm.mcat(i=i_s, o=o_all)
    last_all.run()

    o_section = frames_path.joinpath('last_section.csv').as_posix()
    # i_s_sec = [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]
    for state_sec in [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]:
        state_sec.run()
    i_s_sec = ','.join([o1_sec.as_posix(), o2_sec.as_posix(), o3_sec.as_posix(), o4_sec.as_posix(), o5_sec.as_posix()])
    last_section = nm.mcat(i=i_s_sec, o=o_section)
    last_section.run()

    for o in [o1, o2, o3, o4, o5]:
        o.unlink()
    for o in [o1_sec, o2_sec, o3_sec, o4_sec, o5_sec]:
        o.unlink()

    for o in [temp1, temp2, temp3, temp4, temp5]:
        o.unlink()

    t2 = time.time()

    return jsonify({'success': True, 'speed': repr(t2 - t1)})

@api.route('/execute-direct2')
def execute_direct2():
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()
    state = nm.mcut(i=i, x=True, f='0,1,2,3,4')
    allsection = frames_path.joinpath('allsection.csv').as_posix()
    state <<= nm.mbucket(rng=True, f='Time:Section', n=10, o=allsection)
    state.run()

    po1 = frames_path.joinpath('po1.csv').as_posix()
    state1 = nm.mselstr(i=allsection, f='Section', v=1, o=po1)
    state1.run()

    po2 = frames_path.joinpath('po2.csv').as_posix()
    state2 = nm.mselstr(i=allsection, f='Section', v=2, o=po2)
    state2.run()


    # 一回一回中間ファイルを吐くバージョン
    aq1 = frames_path.joinpath('aq1.csv').as_posix()
    new_state1 = execute_by_state(po1, o=aq1)
    new_state1.run()

    aq2 = frames_path.joinpath('aq2.csv').as_posix()
    new_state2 = execute_by_state(po2, o=aq2)
    new_state2.run()

    nm.mcat(i=f'{aq1},{aq2}', o=frames_path.joinpath('result.csv').as_posix()).run()

    # # できるだけ繋げるバージョン
    # new_state1 = execute_by_state(po1)
    # new_state2 = execute_by_state(po2)

    # nm.mcat(stdin=True, i=[new_state1, new_state2], o=frames_path.joinpath('result.csv').as_posix()).run()

    return jsonify({'success': True, 'data': 'execute-direct2'})

@api.route('/execute-direct3')
def execute_direct3():
    i = frames_path.joinpath('2C72275F-2019-49AE-B36D-A29D1507F8DD.csv').as_posix()
    o = frames_path.joinpath(str(uuid.uuid4()) + '.csv').as_posix()
    state = nm.mcut(i=i, x=True, f='0,1,2,3,4')
    state <<= nm.mbucket(rng=True, f='Time:Section', n=10)
    state <<= nm.mselstr(f='Section', v=1, o=o)
    state.run()

    return jsonify({'success': True, 'data': 'execute-direct3'})

def execute_flow_internal(flow_uuid, step_paths=None):
    """
    指定されたファイル名を元にフローファイルを取得して、
    その結果をパースしてDataFrameの形にして返す
    """

    # 実行履歴（実行中状態）の作成
    user_id = session['user_id']
    user_name = get_user_by_id(user_id)['name']
    history_file_path = make_unfinished_history(flow_uuid,  user_name)

    def execute_flow_by_uuid(flow_uuid):
        from . import engine as e
        with open(f'/kskp/data/flows/{flow_uuid}.json', 'r') as f:
            return e.execute(flow_uuid, f.read(), step_paths=step_paths, frames_path='/kskp/data/frames', flows_path='/kskp/data/flows')

    # try:
    #     result = execute_flow_by_uuid(flow_uuid)
    # except Exception as e:
    #     # とりあえずの例外処理
    #     # 何か例外が起こった時、実行中状態の履歴ファイルが無意味に残るのが嫌なので
    #     # history_file_path.unlink()
    #     print(e)
    #     result = {}

    result = execute_flow_by_uuid(flow_uuid)

    # 実行履歴（実行完了状態）の作成
    make_finished_history(flow_uuid, history_file_path, result)

    return list(result.keys())


def load_as_data_frame(result_text):
    """
    CSVの文字列を受け取り、
    いわゆるデータフレームの形式にして返す
    """
    result_list = [x for x in result_text.split('\n') if x != '']
    result_data = {}
    column_list = result_list[0].split(',')
    for column_name in column_list:
        result_data[column_name] = []

    for record in result_list[1:]:
        for idx, column_data in enumerate(record.split(',')):
            # print(column_list[idx])
            result_data[column_list[idx]].append(column_data)

    return result_data
