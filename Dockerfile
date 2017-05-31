FROM node:4.2.6

RUN mkdir -p /usr/src/app/

WORKDIR /usr/src/app/

COPY . /usr/src/app

WORKDIR /usr/src/app/backend/

RUN npm install

ARG published_port=8080

#EXPOSE $published_port
EXPOSE 8080

#CMD SERVER_PORT=$published_port node server/app.js
CMD ["SERVER_PORT=8080", "node", "server/app.js"]
