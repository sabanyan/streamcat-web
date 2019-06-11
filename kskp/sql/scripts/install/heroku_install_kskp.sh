#!bin/bash

FLAG_INSTALL_NODE_MODULES="false"
HEROKU_CONTAINER="kskp-deploy-test"

while getopts r OPT
do
  case ${OPT} in
    "r" ) 
      FLAG_INSTALL_NODE_MODULES="true"
  esac
done

# KSKP直下に移動
cd './kskp-beta'

if [ ${FLAG_INSTALL_NODE_MODULES} = "true" ]; then
  echo "[Info] node_modulesを再インストールします。";
  rm -rf node_modules ;
  npm install ;
fi 

# KSKPフロントエンドのビルド
#（自分がkskp-betaフォルダの直下にいることが前提）

#echo "[Info] KSKPフロントエンドのビルドを行います。"
#npm run dll
#npm run build


# herokuがインストールされてない場合、インストールします。
if [[ -n $(which heroku) ]]; then
    echo "[info] herokuインストール済み"
else
    echo "[info] herokuをインストールします。"
    brew install heroku/brew/heroku
fi

# herokuログイン

# dockerfileをコーピする。
echo "Dockerfileをコーピします。"
cp ./docker/Dockerfile-small-1-3 ./Dockerfile

# コンテナログイン
heroku container:login

# push & release
heroku container:push --app ${HEROKU_CONTAINER} web
heroku container:release --app ${HEROKU_CONTAINER} web