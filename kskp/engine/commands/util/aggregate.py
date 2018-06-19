import subprocess

def execute(context={}, parameters={}):
    """
    # 各列について、平均、分散、最大、最小、レンジを求める
    mavg i=$iFile f=${j}:${j}_avg |
    mcut f=Time,${j}_avg o=xxx1.csv
    mstats i=$iFile c=sd f=${j}:${j}_sd |
    mcut f=Time,${j}_sd o=xxx2.csv
    mstats i=$iFile c=max f=${j}:${j}_max |
    mcut f=Time,${j}_max o=xxx3.csv
    mstats i=$iFile c=min f=${j}:${j}_min |
    mcut f=Time,${j}_min o=xxx4.csv
    mjoin k=Time i=xxx1.csv m=xxx2.csv |
    mjoin k=Time m=xxx3.csv |
    mjoin k=Time m=xxx4.csv o=$oDir/xxx5_${j}.csv
    """

    # stdinが指定されていれば取得
    stdin = context['stdin'] if 'stdin' in context else None
    stdout = context['stdout'] if 'stdout' in context else None
    f = parameters['f']
    a_dir = '/kskp/data/frame/aggregate_'

    # subprocess.Popen(['mtee', 'o=%sxxx.csv' % a_dir], stdin=stdin)
    open('%sxxx.csv' % a_dir, 'wb').write(stdin.read())
    # 1 2 3 4 5 6
    popen1 = subprocess.Popen(['mavg', 'f=%s:%s_avg' % (f, f), 'i=%sxxx.csv' % a_dir], stdout=subprocess.PIPE)
    subprocess.Popen(['mcut', 'f=Time,%s_avg' % f, 'o=%sxxx1.csv' % a_dir], stdin=popen1.stdout)

    popen2 = subprocess.Popen(['mstats', 'c=sd', 'f=%s:%s_sd' % (f, f), 'i=%sxxx.csv' % a_dir], stdout=subprocess.PIPE)
    subprocess.Popen(['mcut', 'f=Time,%s_sd' % f, 'o=%sxxx2.csv' % a_dir], stdin=popen2.stdout)

    popen3 = subprocess.Popen(['mstats', 'c=max', 'f=%s:%s_max' % (f, f), 'i=%sxxx.csv' % a_dir], stdout=subprocess.PIPE)
    subprocess.Popen(['mcut', 'f=Time,%s_max' % f, 'o=%sxxx3.csv' % a_dir], stdin=popen3.stdout)

    popen4 = subprocess.Popen(['mstats', 'c=min', 'f=%s:%s_min' % (f, f), 'i=%sxxx.csv' % a_dir], stdin=stdin, stdout=subprocess.PIPE)
    subprocess.Popen(['mcut', 'f=Time,%s_min' % f, 'o=%sxxx4.csv' % a_dir], stdin=popen4.stdout)

    popen_mjoin1 = subprocess.Popen(['mjoin', 'k=Time', 'i=%sxxx1.csv' % a_dir, 'm=%sxxx2.csv' % a_dir], stdout=subprocess.PIPE)
    popen_mjoin2 = subprocess.Popen(['mjoin', 'k=Time', 'm=%sxxx3.csv' % a_dir], stdin=popen_mjoin1.stdout, stdout=subprocess.PIPE)
    return subprocess.Popen(['mjoin', 'k=Time', 'm=%sxxx4.csv' % a_dir], stdin=popen_mjoin2.stdout, stdout=stdout)
