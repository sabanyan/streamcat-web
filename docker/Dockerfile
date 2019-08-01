# for OMRON

FROM centos:7

# Set root password
RUN echo "kspasskp" | passwd --stdin root

RUN groupadd -g 1000 kskp
RUN useradd -rm -d /home/kskp -s /bin/bash -g kskp -u 1000 -p kspasskp kskp
USER kskp
WORKDIR /home/kskp

# import python3 from pyenv
USER root
RUN yum install -y git gcc bzip2 bzip2-devel openssl openssl-devel readline readline-devel
WORKDIR /usr/local/
RUN git clone git://github.com/yyuu/pyenv.git ./pyenv
RUN mkdir -p ./pyenv/versions ./pyenv/shims

ENV LANG en_US.utf8
ENV PYTHONIOENCODING utf-8

RUN yum install -y sqlite-*
RUN yum install -y postgresql-devel

ENV PYENV_ROOT /usr/local/pyenv
ENV PATH "${PYENV_ROOT}/shims:${PYENV_ROOT}/bin:${PATH}"

RUN pyenv install -v 3.6.0
RUN pyenv global 3.6.0

RUN pip install --upgrade pip

# mchkcsvなどnysol_pythonに存在しないmコマンドもあるためNYSOLも必要
COPY ./nysol-2.4-0.x86_64.rpm /home/kskp/nysol-2.4-0.x86_64.rpm
# for Nysol
RUN yum install -y sudo gem
RUN rpm -ih /home/kskp/nysol-2.4-0.x86_64.rpm

# Install samba packages
RUN yum install -y samba-client samba-winbind cifs-utils

# Install Go lang for goofys
RUN yum install -y epel-release
RUN yum install -y golang

# Install goofys, The AWS S3 mount packege
RUN yum install -y fuse
# 手動で、sudo chgrp kskp /dev/fuse しておいてね
# ⬇こんな事言われてしまいます、、、
# /usr/bin/chgrp: cannot access ‘/dev/fuse’: No such file or directory
RUN yum install -y git
RUN go get github.com/kahing/goofys
RUN go install github.com/kahing/goofys
RUN cp /root/go/bin/goofys /usr/local/bin

# AWS keys of kskp user
ENV AWS_ACCESS_KEY_ID AKIAY2HAWKVRAU3IKV4L
ENV AWS_SECRET_ACCESS_KEY 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
ENV AWS_DEFAULT_REGION ap-northeast-1

# Add privilage for mount command
RUN echo "kskp ALL=(ALL) NOPASSWD: /usr/bin/mount,/usr/sbin/mount.cifs,/usr/bin/umount,/usr/local/bin/goofys" >> /etc/sudoers

USER kskp
RUN mkdir /home/kskp/kskp-web

COPY ./kskp /home/kskp/kskp-web/kskp
COPY ./setup.py /home/kskp/kskp-web/setup.py

USER root

ENV FLASK_APP kskp/web/backend
RUN pip install -e /home/kskp/kskp-web

### COPY ./kskp/config/small.cfg /home/kskp/kskp/settings.cfg



RUN yum install -y libxml2 libxml2-devel
RUN yum install -y gcc-c++
RUN yum install -y boost boost-devel

RUN pip install nysol

# install nkf
RUN yum install -y epel-release
RUN yum install -y nkf --enablerepo=epel

USER kskp

RUN git clone -b develop_refactor https://71325e784a7a08c905b5a3425d70aa391dc50753:x-oauth-basic@github.com/ksk-anl/kskp-flow-engine.git /home/kskp/kskp-flow-engine
RUN git clone -b develop_refactor https://71325e784a7a08c905b5a3425d70aa391dc50753:x-oauth-basic@github.com/ksk-anl/kskp-data-store.git /home/kskp/kskp-data-store

USER root

RUN pip install -e /home/kskp/kskp-flow-engine
RUN pip install -e /home/kskp/kskp-data-store

USER kskp
WORKDIR /home/kskp/kskp-web

CMD flask run -h 0.0.0.0 -p ${PORT:-5000}
