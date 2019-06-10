1. toNewPortsについて

    入力されたflow.jsonのPortsの構造を変換してくれるスクリプトです。

2. 実行のため必要なもの
    python3.4以上
    toNewPorts.py
    PortsMapping.json
    FLOW_UUID.json

3. 実行手順
    1. 以下ファイルを同じ場所に置いておきます
            toNewPorts.py
            PortsMapping.json
            FLOW_UUID.json
    2. 以下のコマンドを実行します
        python toNewPorts -f FLOW_UUID


    ※ ファイル自体を修正しますので、重要なFlowファイルはバックアップが必要です