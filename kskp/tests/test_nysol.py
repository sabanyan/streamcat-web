from pathlib import Path

import nysol.mcmd as nm

frames_path = Path('kskp/data/frames')

def main(i):
    # csv = nm.mtab2csv(i=i)
    fs = ['1,2,3,4', '5,6,7,8', '9,10,11,12', '13,14,15,16', '17,18,19,20']
    pas = [nm.mcut(i=i, x=True, f=f'0,{f}') for f in fs]

    # all
    pes = [stats_by_state(pa) for pa in pas]
    pe = nm.m2cat(i=pes, o=fpath('pe'))
    pe.run()

    # section
    popos = [stats_by_section(pa) for pa in pas]

    # 以下2行を実行した場合はエラーになる(Killed)
    popo = nm.m2cat(i=popos, o=fpath('popo'))
    popo.run()

    # 以下3行を実行した場合はエラーにならない
    # popo = popos[0]
    # popo <<= nm.m2tee(o=fpath('popo'))
    # popo.run()

def stats_by_section(i):
    po = nm.mbucket(i=i, rng=True, f='Time:Section', n=10)

    pooos = []
    for v in range(10):
        poo = nm.mselstr(i=po, f='Section', v=v + 1)
        pooo = stats_by_state(poo)

        pooos.append(pooo)

    popo = nm.m2cat(i=pooos)
    
    return popo

def stats_by_state(i):
    state1 = stats_by_sensor(i, '3H')
    state2 = stats_by_sensor(i, '3V')
    state3 = stats_by_sensor(i, '4H')
    state4 = stats_by_sensor(i, '4V')

    states = nm.mjoin(k='Time', i=state1, m=state2)
    states <<= nm.mjoin(k='Time', m=state3)
    states <<= nm.mjoin(k='Time', m=state4)

    return states

def stats_by_sensor(i, sensor):
    stat1 = nm.mavg(i=i, f=f'{sensor}:{sensor}_avg')
    stat1 <<= nm.mcut(f=f'Time,{sensor}_avg')

    stat2 = nm.mstats(i=i, c='sd', f=f'{sensor}:{sensor}_sd')
    stat2 <<= nm.mcut(f=f'Time,{sensor}_sd')

    stat3 = nm.mstats(i=i, c='max', f=f'{sensor}:{sensor}_max')
    stat3 <<= nm.mcut(f=f'Time,{sensor}_max')

    stat4 = nm.mstats(i=i, c='min', f=f'{sensor}:{sensor}_min')
    stat4 <<= nm.mcut(f=f'Time,{sensor}_min')

    stats = nm.mjoin(k='Time', i=stat1, m=stat2)
    stats <<= nm.mjoin(k='Time', m=stat3)
    stats <<= nm.mjoin(k='Time', m=stat4)

    return stats

def fpath(name):
    return frames_path.joinpath(f'{name}.csv').as_posix()

if __name__ == '__main__':
    i = fpath('2C72275F-2019-49AE-B36D-A29D1507F8DD')
    # i = '/Users/okzk/GoogleDrive/KSKP/サンプルプロジェクト/日本NI/ni_motor_5sec_2okzk/orgData/180127_1535_4sensor_5sec_2.csv'
    # i = '/Users/okzk/Desktop/data/stage1/sensor_data.csv'
    main(i)
