FROM node:4.2.6

RUN mkdir -p /usr/src/app/

WORKDIR /usr/src/app/

COPY . /usr/src/app

WORKDIR /usr/src/app/backend/

RUN npm install

ARG published_port

EXPOSE $published_port
#EXPOSE 8080

#CMD node server/app.js --SERVER_PORT $published_port
CMD ["node", "server/app.js", "--SERVER_PORT", $published_port]
