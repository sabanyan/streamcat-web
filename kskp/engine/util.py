"""
ここにある関数は、
個々のOperator.executeから呼ばれるユーティリティである
"""

def execute_m_command(context, command, parameters):
    """
    MCMD用のコマンド文字列を作成して実行する
    """
    command_array = command.split()

    # 共通パラメータ
    if 'i' in parameters:
        command_array.append('i=%s' % parameters['i'])
        del parameters['i']

    # その他のパラメータを処理する
    for key, val in parameters.items():
        command_array.append('%s=%s' % (key, val))

    print(command_array)
    # パイプの状態を加味して実行
    return execute_with_context(context, command_array)


def execute_command(context, command, options, parameters):
    """
    （MCMDではない）通常のコマンドを実行する
    MCMDはオプション指定が通常のUNIXコマンド群と異なる
    """

    # まず、コマンド文字列を作る
    command_array = make_command_array(command, options, parameters)

    # パイプの状態を加味して実行
    return execute_with_context(context, command_array)


def make_command_array(command, options, parameters):
    '''
    パラメータ以外の（オプションなども加味した）コマンド文字列を作るメソッドが必要なはず
    ただ、その値はGUIで設定するはずなので、それを取得してくる必要がある
    '''
    res = [command]
    # self.paramtersはtupleのlist
    for opt in options:
        if isinstance(opt, str):
            res.append('-' + opt)

    for param in parameters:
        res.append(param)

    return res


def execute_with_context(context, command_array):
    """
    contextの内容を加味した上で、コマンドを実行する
    現在はstdinとstdoutがパイプかどうかを見ている
    パイプで繋いでいる途中だと、stdin/stdoutを使って実行後のパイプが渡されたり渡したりする
    """
    # stdinとstdoutが指定されていれば取得
    stdin = context['stdin'] if 'stdin' in context else None
    stdout = context['stdout'] if 'stdout' in context else None

    # 実行
    return subprocess.Popen(command_array, stdin=stdin, stdout=stdout)
