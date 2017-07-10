# DOCKER-VERSION 1.1.0
FROM    centos

ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8

# Install python, needed for scripts used in INGInious
RUN     yum clean metadata && \
        yum -y install https://centos7.iuscommunity.org/ius-release.rpm && \
        yum -y install python python35u-pip python35u zip unzip tar sed openssh-server openssl bind-utils iproute file && \
        pip3.5 install msgpack-python pyzmq && ln -s /usr/bin/python3.5 /usr/bin/python3 && \
        yum clean all

# Allow to run commands
ADD     . /INGInious
RUN     chmod -R 755 /INGInious/bin && \
        chmod 700 /INGInious/bin/INGInious && \
        mv /INGInious/bin/* /bin

# Install everything needed to allow INGInious' python libs to be loaded
# Install the container package in inginious_c and add an alias to inginious
# This is to avoid namespace collision between INGInious and the container lib in your favorite IDE :-)
RUN     chmod -R 644 /INGInious/inginious_c && \
        mkdir -p /usr/lib/python3.5/site-packages/inginious_c && \
        cp -R /INGInious/inginious_c/*.py  /usr/lib/python3.5/site-packages/inginious_c && \
        echo "inginious" > /usr/lib/python3.5/site-packages/inginious.pth && \
        echo "inginious_c" >> /usr/lib/python3.5/site-packages/inginious.pth && \
        ln -s /usr/lib/python3.5/site-packages/inginious_c /usr/lib/python3.5/site-packages/inginious

# Delete unneeded folders
RUN     rm -R /INGInious

# Create worker user
RUN     groupadd --gid 4242 worker && \
        useradd --uid 4242 --gid 4242 worker --home-dir /task

# Set locale params for SSH debug
RUN     echo -e "export LANG=en_US.UTF-8\nexport LANGUAGE=en_US:en\nexport LC_ALL=en_US.UTF-8\n" > /etc/profile
RUN     sed -i.bak '/^AcceptEnv/ d' /etc/ssh/sshd_config

CMD ["INGInious"]
