import json
import uuid
from pathlib import Path
from .engine.data3 import *
from flask import Blueprint, request, session, jsonify, send_from_directory
from .auth import login_required_api
from .navigation import update_navigation
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
    get_user_by_id,
    fetch_subflows_all_projects,
    get_flow_nodes_by_uuid,
    update_user_by_id,
    write_data_to_json,
    make_flow_path
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
@update_navigation
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
    # getで取ってくるとキーが存在しないときはNoneが返ってきて、project_idがNoneになるので
    # これでvalidationできていると言える？
    # 今の所project_uuid以外は必須ではない
    project_id = get_project_id_by_uuid(j.get('project_uuid'))

    # 指定されたUUIDを持つプロジェクトが存在しない場合はエラー
    if project_id is None:
        return jsonify({'success': False, 'message': 'invalid project uuid: (%s)' % j['project_uuid']})

    # frontendからcreate_flowに渡すものが増えてきたので、request.jsonを直接渡す。
    new_flow = create_flow(j, session['user_id'])

    return jsonify({'success': True, 'data': new_flow})

@api.route('/flows', methods=['GET'])
@login_required_api
@update_navigation
def fecth_flows():
    """
    パラメータで指定されたプロジェクトが持つフローの一覧を取得する
    """
    return jsonify({'success': True, 'data': fetch_flows_by_project_uuid(request.args.get('project'))})


@api.route('/flows/<flow_uuid>', methods=['GET'])
@login_required_api
@update_navigation
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

@api.route('/subflows', methods=['GET'])
@login_required_api
def fetch_subflows():
    """
    サブフロー一覧を取得する。
    """
    return jsonify({'success': True, 'data': fetch_subflows_all_projects(request.args)})

@api.route('/executableflows', methods=['POST'])
@login_required_api
def make_executable_flow():
    """
    サブフローとフレームを取得し、実行可能なフローを新規に作成する。
    とりあえず新規APIで作成したが、
    新しいフローが作成されるので、flowsのPOSTなのかなとは思う。
    このままでもいいが流石にexecutableflowsはダサいので、なんか考える。
    """

    def replace_inputs_frame_uuid(request):
        """
        サブフローのインプットを置き換える
        frame_uuid指定
        """
        flow_json = fetch_flow_by_uuid(request.get('flow_uuid'))

        # portsから外部入力になっているフレームを取得
        for input in flow_json['ports'][0]:
            frame = None
            for node in flow_json['nodes']:
                if node['id'] == input['name']:
                    frame = node
                    break
            # フレームを置き換える
            frame['uuid'] = request.get(input['name'])

        # portsの中のものを削除する
        flow_json['ports'][0].clear()
        new_flow_uuid = str(uuid.uuid4())

        # フローを返す
        return flow_json, new_flow_uuid

    def replace_inputs_upload_csv(request):
        """
        サブフローのインプットを置き換える
        ファイルアップロード
        """
        # 新フロー作成元のサブフロー取得
        flow_json = fetch_flow_by_uuid(request.form.get('flow_uuid'))
        key_value = json.loads(request.form.get('key_value'))

        for file_name, file in request.files.items():
            # ファイルアップロード
            f = file
            file_name = file_name
            frame_uuid = str(uuid.uuid4())

            from werkzeug.utils import secure_filename
            file_path = DATAFRAME_DIR_PATH / Path(secure_filename(frame_uuid + '.csv'))
            f.save(file_path.as_posix())
            f.close()

            for key, value in key_value.items():
                if value == file_name:
                    key_value[key] = frame_uuid

        # portsから外部入力になっているフレームを取得
        for input in flow_json['ports'][0]:
            frame = None
            for node in flow_json['nodes']:
                if node['id'] == input['name']:
                    frame = node
                    break
            # フレームを置き換える
            frame['uuid'] = key_value[input['name']]

        # portsの中のものを削除する
        flow_json['ports'][0].clear()
        new_flow_uuid = str(uuid.uuid4())

        # フローを返す
        return flow_json, new_flow_uuid

    if request.headers['Content_type'] == 'application/json':
        subflow_and_frames = request.json
        executable_flow, new_flow_uuid = replace_inputs_frame_uuid(subflow_and_frames)
    else:
        subflow_and_csv = request
        executable_flow, new_flow_uuid = replace_inputs_upload_csv(subflow_and_csv)

    # 本当に作成するのか？今の所実jsonファイルを作成しないと、実行できないため作成するが…
    write_data_to_json(make_flow_path(new_flow_uuid), executable_flow)

    return jsonify({'success': True, 'flow_uuid': new_flow_uuid})

@api.route('/commands')
def fetch_commands():
    """
    コマンド定義の一覧を返す
    """

    path = api.root_path / Path('data/commands')

    commands = []
    for command_path in path.iterdir():
        if not command_path.suffix == '.json':
            continue
        command_json = command_path.read_text(encoding='utf-8')
        command_data = json.loads(command_json)
        commands.append(command_data)

    return jsonify({'success': True, 'data': commands})

import time

@api.route('/frames', methods=['GET', 'POST'])
def make_new_frame():
    """
    新しいframeを作成する
    方法は様々
    """
    # デフォルトはFalse
    no_contents = False

    if 'file' in request.files:
        # ファイルがPOSTで送信されてきたらアップロードだとみなす
        frame = upload_frame(request)
        return jsonify({'success': True, "data": frame})
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

        if request.args.get('no_contents'):
            no_contents = True

        return execute_flow(flow_uuid, step_paths=step_id, no_contents=no_contents)
    else:
        return jsonify({
                            'success': False,
                            'code': -1,
                            'message': 'invalid json'
                        })

import os
import time

@api.route('/frames/<frame_uuid>')
def fetch_frame(frame_uuid):
    """
    指定したframeを直接UUIDで指定して取得する
    """
    # オフセットのデフォルトは最初から（なので０）
    offset = int(request.args.get('offset')) if request.args.get('offset') is not None else 0
    # リミットのデフォルトは全行なのでNoneにしておく（０の場合は０行取得だから０は使えない）
    limit = int(request.args.get('limit')) if request.args.get('limit') is not None else None

    file_path = DATAFRAME_DIR_PATH / Path('%s.csv' % frame_uuid)
    return jsonify({'success': True, 'data': csv_to_frame(file_path, offset=offset, limit=limit)})

def csv_to_frame(file_path, no_contents=False, offset=0, limit=None):
    """
    指定されたCSVファイルを読み込んで、
    詳細情報なども含んだframeを表すdictを返す
    """
    result = {}
    contents, number_of_lines = load_as_data_frame(file_path.read_text(encoding='utf-8'), offset, limit)
    if not no_contents:
        result['contents'] = contents
    result['numberOfLines'] = number_of_lines
    result['fileSize'] = os.path.getsize(file_path)
    result['lastModifiedAt'] = format_time(file_path)

    return result

def format_time(file_path):
    """
    指定されたファイルの最終更新時間をyyyy/MM/dd HH:MMで返却する
    """
    wk = time.localtime(os.path.getmtime(file_path))
    return time.strftime('%Y/%m/%d %H:%M', wk)

def upload_frame(req):
    """
    CSVをアップロードする
    TODO: テスト未実施
    """
    f = req.files['file']
    file_name = req.form['file_name']
    frame_uuid = str(uuid.uuid4())

    from werkzeug.utils import secure_filename
    file_path = DATAFRAME_DIR_PATH / Path(secure_filename(frame_uuid + '.csv'))
    f.save(file_path.as_posix())
    f.close()

    return {"uuid": frame_uuid, "label": file_name}

@api.route('/files')
def download_frame():
    # 現在typeは未使用
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

def execute_flow(flow_uuid, step_paths, no_contents):

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
        try:
            result_data = execute_flow_internal(flow_uuid, step_paths, no_contents)
            if not result_data:
                return jsonify({
                                    'success': False,
                                    'code': -1,
                                    'message': 'result is empty.'
                                })
            else:
                return jsonify({'success': True, 'name': result_data})
        except Exception as e:
            return jsonify({
                                'success': False,
                                'code': -1,
                                'message': repr(e)
                            })

@api.route('/jobs', methods=['GET'])
@update_navigation
def jobs():
    """
    指定されたフローの実行結果を返す
    """
    count = 0
    execute_histories = []

    # jobsリストの作成
    for job_path in Path(JOBS_DIR_PATH).iterdir():
        data = json.loads(job_path.read_text(encoding='utf-8'))
        if 'flow' in request.args:
            if data['flow']['uuid'] == request.args['flow']:
                execute_histories.append(data)
        elif 'project' in request.args:
            if data['projectId'] == get_project_id_by_uuid(request.args['project']):
                execute_histories.append(data)
        else:
            execute_histories.append(data)

    # 並び順変更
    results = sorted(execute_histories, key = lambda x:x['executedAt'], reverse=True)

    # count処理
    if 'count' in request.args:
        count = int(request.args['count'])
        # countの値がおかしい場合、falseを返す
        if len(results) < count or count <= 0:
            return jsonify({'success': False})

        return jsonify({'success': True, 'data': results[count - 1 : count]})
    else:
        return jsonify({'success': True, 'data': results})

@api.route('/profile/<user_id>', methods=['GET'])
@login_required_api
@update_navigation
def fetch_profile(user_id):
    """
    プロフィール情報を返却する
    今のところ、
    ・ユーザ情報
    ・Grafana情報
    の2つ（どっちもusersテーブルにある）
    """
    user = get_user_by_id(user_id)
    profile = {}
    profile['name'] = user['name']
    profile['email'] = user['email']
    # profile['grafana_url'] = user['grafana_url']
    # profile['grafana_id'] = user['grafana_id']
    # profile['grafana_password'] = user['grafana_password']

    # --仮実装（Usersテーブルにgarafana列を追加するまでの間）--
    path = DATAFRAME_DIR_PATH.parent / Path('profile_update.json')
    profile_json = json.loads(path.read_text())
    profile['grafana_url'] = profile_json.get('url')
    profile['grafana_id'] = profile_json.get('id')
    profile['grafana_password'] = profile_json.get('password')
    # ----

    return jsonify({'success': True, 'data': profile})

@api.route('/profile/<user_id>', methods=['PUT'])
@login_required_api
def update_profile(user_id):
    """
    プロフィール情報を更新する
    今のところ、
    ・ユーザ情報
    ・Grafana情報
    の2つ（どっちもusersテーブルにある）
    """
    profile = request.json
    # update_user_by_id(user_id, profile)

    # --仮実装（Usersテーブルにgarafana列を追加するまでの間）--
    path = DATAFRAME_DIR_PATH.parent / Path('profile_update.json')
    profile_json = json.loads(path.read_text())

    # 条件分岐はmodel側に移行してもいいかも
    if profile.get('profile') is not None:
        update_user_by_id(user_id, profile.get('profile'))
    else:
        for key, value in profile.get('extension_tools').get('grafana').items():
            profile_json[key] = value
        path.write_text(json.dumps(profile_json, ensure_ascii=False, indent=2), encoding='utf-8')
    # ----

    return jsonify({'success': True})

import nysol.mcmd as nm

frames_path = Path('kskp/data/frames')

def execute_by_sensor(sensor, i):
    from nysol.mcmd import mavg, mstats

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
    sensors = ['3H', '3V', '4H', '4V']
    temp_uuid = str(uuid.uuid4())
    i_s = [f'state{s}_{temp_uuid}.csv' for s in sensors]
    i <<= nm.m2tee(o=','.join(i_s))

    # 全体の統計量
    s1 = execute_by_sensor('3H', i_s[0])
    s2 = execute_by_sensor('3V', i_s[1])
    s3 = execute_by_sensor('4H', i_s[2])
    s4 = execute_by_sensor('4V', i_s[3])

    last = nm.mjoin(k='Time', i=s1, m=s2)
    last <<= nm.mjoin(k='Time', m=s3)
    if o is None:
        last <<= nm.mjoin(k='Time', m=s4)
    else:
        last <<= nm.mjoin(k='Time', m=s4, o=o)

    return last

def execute_all_and_section(i, f, o1, o2):
    temp_uuid = str(uuid.uuid4())
    temp = frames_path.joinpath('all_and_section_' + temp_uuid + '.csv')
    state = nm.mcut(i=i, x=True, f=f)
    state <<= nm.m2tee(o=temp.as_posix())
    # state = nm.mcut(i=i, x=True, f=f)
    # state.run()

    # new_i = temp.as_posix()

    # temp2 = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
    # from nysol.mcmd import mbucket
    # sections = state.mbucket(f='Time:Section', n=10, rng=True, o=temp2.as_posix())
    # sections.run()
    o_sections = [f'{temp_uuid}_section_{x}.csv' for x in range(10)]
    sections = nm.mbucket(i=temp.as_posix(), f='Time:Section', n=10, rng=True, o=','.join(o_sections))

    # temp_secs = []
    secs = []
    for x in range(10):
        # temp_sec = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
        # sec1 = nm.mselstr(i=temp2.as_posix(), f='Section', v=x+1, o=temp_sec.as_posix())]
        # from nysol.mcmd import mselstr
        sec1 = nm.mselstr(i=o_sections[x], f='Section', v=x+1)
        # sec1.run()

        # sec2 = execute_by_state(temp_sec.as_posix())
        sec2 = execute_by_state(sec1)
        # temp_sec2 = frames_path.joinpath(str(uuid.uuid4()) + '.csv')
        # sec2 <<= nm.msetstr(a='Section', v=x+1, o=temp_sec2.as_posix())
        sec2 <<= nm.msetstr(a='Section', v=x+1)
        # temp_secs.append(temp_sec2.as_posix())
        secs.append(sec2)
        # sec2.run()

    # return execute_by_state(new_i, o1), nm.mcat(i=','.join(temp_secs), o=o2), temp
    # return execute_by_state(state, o1), nm.mcat(i=secs, o=o2), temp
    return execute_by_state(state, o1), nm.mcat(stdin=True, i=secs), temp

@api.route('/execute-fifo')
def execute_fifo():
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
    # for state_sec in [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]:
    #     state_sec.run()
    # i_s_sec = ','.join([o1_sec.as_posix(), o2_sec.as_posix(), o3_sec.as_posix(), o4_sec.as_posix(), o5_sec.as_posix()])
    i_s_sec = [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]
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
    i_s_sec = [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]
    # for state_sec in [state_sec1, state_sec2, state_sec3, state_sec4, state_sec5]:
    #     state_sec.run()
    # i_s_sec = ','.join([o1_sec.as_posix(), o2_sec.as_posix(), o3_sec.as_posix(), o4_sec.as_posix(), o5_sec.as_posix()])
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

def execute_flow_internal(flow_uuid, step_paths=None, no_contents=False):
    """
    指定されたファイル名を元にフローファイルを取得して、
    その結果をパースしてDataFrameの形にして返す
    """

    now = datetime.now()

    @make_unfinished_history(now, session)
    @make_finished_history(now)
    def execute_flow_by_uuid(flow_uuid):
        from . import engine as e
        with open(f'/kskp/data/flows/{flow_uuid}.json', 'r') as f:
            return e.execute(flow_uuid, f.read(), step_paths=step_paths, frames_path='/kskp/data/frames', flows_path='/kskp/data/flows')

    result = execute_flow_by_uuid(flow_uuid)
    nodes_dict = get_flow_nodes_by_uuid(flow_uuid)

    if no_contents:
        result_list = [{'id':key, 'uuid':value.uuid, 'label':nodes_dict.get(key).get('label')} for key, value in result.items()]
    else:
        result_list = [{'id':key, 'uuid':value.uuid, 'label':nodes_dict.get(key).get('label'), 'contents':value.contents} for key, value in result.items()]
    return result_list


def load_as_data_frame(result_text, offset, limit):
    """
    CSVの文字列を受け取り、
    いわゆるデータフレームの形式にして返す
    """
    result_list = [x for x in result_text.split('\n') if x != '']
    result_len = len(result_list) - 1
    result_data = {}

    if not result_list:
        return result_data, 0

    # 重複文字があればインデックスをつける
    column_list = replace_column_name(result_list[0].split(','))

    for column_name in column_list:
        result_data[column_name] = []

    # offset+1の1はヘッダを飛ばすため
    start = 1 + offset
    end = start + (limit if limit is not None else result_len)
    for record in result_list[start:end]:
        for idx, column_data in enumerate(record.split(',')):
            # print(column_list[idx])
            result_data[column_list[idx]].append(column_data)

    # 行数も返すように変更
    return result_data, result_len

def replace_column_name(column_list):
    """
    受け取ったカラム名リストに重複している列名があれば
    連番をつける
    """

    def check_column_overlap(column_list):
        """
        受け取ったカラム名リストを走査する
        """
        index_dict = {}
        column_name_overlap = False

        for index, column_name in enumerate(column_list):
            if not column_name in index_dict:
                index_dict[column_name] = []
            else:
                column_name_overlap = True
            index_dict[column_name].append((index, len(index_dict[column_name])))

        return index_dict, column_name_overlap

    index_dict, column_name_overlap = check_column_overlap(column_list)

    if not column_name_overlap:
        return column_list

    for column_name, tuple_list in index_dict.items():
        if len(tuple_list) < 2:
            continue

        for tuple in tuple_list:
            # tuple[0]　インデックス（column_listの）
            # tuple[1]　連番
            if tuple[1] > 0:
                column_list[tuple[0]] = column_name + '.' + str(tuple[1])

    return column_list

@api.errorhandler(400)
def handle_bad_request(error):
    """
    Bad Requestが起きた時にもJSONを返却するように
    （request bodyのJSONが不正な場合を想定している）
    """

    # 返却するメッセージそのものは、ひとまずFlaskが標準で返しているものをそのまま返す
    message = 'The browser (or proxy) sent a request that this server could not understand.'
    return jsonify({'success': False, 'message': str(error)})
