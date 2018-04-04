FROM node

RUN mkdir -p /es-domoticz-notify
ADD package.json /es-domoticz-notify/

WORKDIR /es-domoticz-notify

RUN npm install

ADD . /es-domoticz-notify/ 

CMD ./run.sh
