#!/bin/bash

# Docker 
KSKP_DOCKER_CONTAINER_NAME="kskp-beta-trial"

root=kskp-beta
if [ -e ${root} ]; then
    cd ${root}
else 
    echo ${root}を見つかりませんでした。
    exit 
fi

while getopts r OPT
do
  case ${OPT} in
    "r" ) 
      echo "[Info] node_modulesを再インストールします。";
      rm -rf node_modules ;
      npm install ;
  esac
done

# KSKPフロントエンドのビルド
#（自分がkskp-betaフォルダの直下にいることが前提）
echo "[Info] KSKPフロントエンドのビルドを行います。"
npm run dll
npm run build

# KSKP用Dockerコンテナの停止
# KSKP用Dockerコンテナの開始（2回目以降）
if [ ! ${KSKP_DOCKER_CONTAINER_NAME} ]; then
  echo "[WARN] 環境変数「KSKP_DOCKER_CONTAINER」にDockerContainer情報が設定されてません。"
  echo "[WARN] デフォルト名(kskp-beta)のcontainerを実行します。"
  docker stop kskp-beta
  docker start kskp-beta
else
  docker stop ${KSKP_DOCKER_CONTAINER_NAME}
  docker start ${KSKP_DOCKER_CONTAINER_NAME}
fi


