FROM ubuntu:16.04

RUN apt-get update && apt-get install -y docker.io python3.5 python3-pip nodejs

#mongo installation
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6

RUN echo "deb [ arch=amd64 ] http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.4.list
RUN apt-get update
RUN apt-get install -y mongodb-org
RUN apt-get install -y nodejs npm



EXPOSE 27017

WORKDIR /home
ENV INGINIOUS_HOME /home/INGInious

COPY . ./INGInious
RUN pip3 install --upgrade pip

WORKDIR /home/INGInious

RUN pip3 install .

RUN mkdir tasks
RUN mkdir backup

#RUN npm install
#RUN npm run build

CMD ["./inginious-webapp --host 0.0.0.0"]
