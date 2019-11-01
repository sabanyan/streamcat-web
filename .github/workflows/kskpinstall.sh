yum -y install git docker
git clone git://github.com/nodenv/nodenv.git ~/.nodenv
git clone git://github.com/nodenv/node-build.git ~/.nodenv/plugins/node-build
echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> ~/.bash_profile
echo 'eval "$(nodenv init -)"' >> ~/.bash_profile
source ~/.bash_profile
nodenv install 8.12.0
nodenv global 8.12.0
mkdir kskp
cd kskp
git clone https://df86786e5c82ad6f92312b83afb0107529f7ea68:x-oauth-basic@github.com/ksk-anl/kskp-flow-engine.git
git clone https://df86786e5c82ad6f92312b83afb0107529f7ea68:x-oauth-basic@github.com/ksk-anl/kskp-data-store.git
git clone https://df86786e5c82ad6f92312b83afb0107529f7ea68:x-oauth-basic@github.com/ksk-anl/kskp-web.git
cd kskp-web/kskp
npm install
npm run dll
npm run build
cd ..
docker build -f docker/Dockerfile -t kskp .
docker run --name postgres-kskp -e POSTGRES_DB=kskp -p 5432:5432 -d postgres
cd ..
docker run --privileged -e FLASK_ENV=development -e FLASK_DEBUG=1 -e "TZ=Asia/Tokyo" -p 5000:5000 -v "$(pwd)"/:/home/kskp/ --link postgres-kskp:db --name kskp kskp