install_kskp.shについて

    機能
        GitHubから最新のKSKPソースコードのダウンロード、Nodeのインストール、Docker Image作成、初回KSKPの起動までのコマンドを自動化

    必要なもの
        ・インタネット接続できる環境
        ・GIT
        ・Docker
        ・install_kskp.py
    
    実行手順
        １．KSKPをインストールするディレクトリにinstall_kskp.pyを置く。
        ２．メモ帳などでinstall_kskp.shを開いて、Git Username・Passwordを入力する。
        ３．install_kskp.shを実行する。

    実行オプション
        -r : すでにkskp-betaフォルダーがある場合、インストールする前kskp-betaフォルダを削除します。
        -n : node,npmをインストールする処理を追加します。（brew必要）
             kskp用のnode,npmがインストールされてる場合は必要ありません。

heroku_install_kskp.shについて

    機能
        KSKP用のherokuにKSKPをPush

    必要なもの
        .heroku 
        .GIT
        .KSKP_BETAフォルダー
        .heroku_install_kskp.sh

    実行手順
        １．herokuにログイン
        ２．kskp_betaと同じフォルダーにheroku_install_kskp.shを置く
           （heroku_install_kskpは直下のkskp_betaをherokuにPushします）
        ３．heroku_install_kskp実行
    
restart_kskp.shについて

    機能
        KSKPのインストール後、フロントエンドのビルド、DockerContainerの再実行

    必要なもの
        .KSKP_BETAフォルダー（install_kskp.sh実行後）
        .restart_kskp.sh

    実行手順
        １．herokuにログイン
        ２．kskp_betaと同じフォルダーにrestart_kskp.shを置く
            （heroku_install_kskpは直下のkskp_betaをherokuにPushします）
        ３．restart_kskp.sh実行

    実行オプション
        -r : node_moudlesを削除後、再インストールします。