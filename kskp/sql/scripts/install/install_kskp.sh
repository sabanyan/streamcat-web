#!/bin/bash

######################### KSKP Install設定情報 #########################

# GIT
KSKP_GIT_ADDRESS="github.com/ksk-anl/kskp-beta"
KSKP_GIT_USERNAME=""  # 
KSKP_GIT_PASSWORD=""  #

# NODE
KSKP_NODE_VERSION="v8.12.0"

# Docker 
KSKP_DOCKER_FILE="docker/Dockerfile-small-1-3"
KSKP_DOCKER_IMAGE_NAME="kskp-beta-trial"
KSKP_DOCKER_CONTAINER_NAME="kskp-beta-trial"

# FLAG
FLAG_DELETE_KSKP="false"
FLAG_INSTALL_NODE="false"

#######################################################################

# インストル時、必要な環境変数が設定されてるか確認する
if [ ! ${KSKP_GIT_ADDRESS} ] ; then
    echo "[WARN] GITの設定情報が正しくありません。"
    echo "install.kskp.shの設定情報を確認してください。"
    exit
fi
if [ ! ${KSKP_NODE_VERSION} ]; then
    echo "[WARN] nodeバージョン情報が設定されてません。"
    echo "install.kskp.shの設定情報を確認してください。"
    exit
fi
if [ ! ${KSKP_DOCKER_FILE} ] || [ ! ${KSKP_DOCKER_IMAGE_NAME} ] || [ ! ${KSKP_DOCKER_CONTAINER_NAME} ]; then
    echo "[WARN] DOCKERの設定情報が正しくありません。"
    echo "install.kskp.shの設定情報を確認してください。"
    exit
fi

while getopts rn OPT
do
  case ${OPT} in
    r) FLAG_DELETE_KSKP="true" ;;
    n) FLAG_INSTALL_NODE="true" ;;
  esac
done

# r オプションが指定された場合、既存のKSKPを削除する
if [ ${FLAG_DELETE_KSKP} = "true" ]; then
  echo "[INFO]  KSKPを削除後、再インストールします。" ;
  rm -rf kskp-beta ;
fi

# 1. ソースコードをダウンロードする
#（認証が必要、githubアカウントを持っている必要がある）
#git clone https://github.com/ksk-anl/kskp-beta
echo "[INFO]  KSKPのソースコードをダウンロードします。"
git clone https://${KSKP_GIT_USERNAME}:${KSKP_GIT_PASSWORD}@${KSKP_GIT_ADDRESS}

# 2. ダウンロードした直下に移動
cd './kskp-beta'

#  n オプションが指定された場合
if [ ${FLAG_INSTALL_NODE} = "true" ]; then
  # 3. ndenvをインストールする(homebrew経由)
  echo "[INFO]  ndenvをインストールします。" ;
  brew update ;
  brew install ndenv ;
  echo 'export PATH=$HOME/.ndenv/bin:$PATH' >> ~/.bash_profile ;
  echo eval "$(ndenv init -)" >> ~/.bash_profile ;
  source ~/.bash_profile ;
  git clone https://github.com/riywo/node-build.git $(ndenv root)/plugins/node-build ;

  #4. 指定バージョンのnode.jsをインストール（現在はv8.12.0）
  echo "[INFO]  指定されたNodeをインストールします。（${KSKP_NODE_VERSION}）"
  ndenv install ${KSKP_NODE_VERSION}
  ndenv global ${KSKP_NODE_VERSION}
fi
  
#5. KSKPフロントエンドのビルド
#（自分がkskp-betaフォルダの直下にいることが前提）
echo "[INFO]  KSKPフロントエンドのビルドを行います。"
rm -rf node_modules
npm install
npm run dll
npm run build

#6. KSKP用Dockerイメージのビルド
#（マシンスペックやネットワーク環境によりますが20〜30分かかります）
docker build -f ${KSKP_DOCKER_FILE} -t ${KSKP_DOCKER_IMAGE_NAME} .

#7. KSKP用Dockerコンテナの立ち上げ（初回のみ）
docker run -e FLASK_ENV=development -p 5000:5000 -v $(pwd)/kskp:/home/kskp/kskp --name ${KSKP_DOCKER_IMAGE_NAME} ${KSKP_DOCKER_CONTAINER_NAME}