FROM node:alpine

RUN apk add --no-cache make gcc g++ python git

ADD package.json /
ADD items-logic.js .
ADD kafka.lib.js .
ADD kafka.options.js .
ADD route.map.js .
ADD server.js .
ADD app.js .

RUN npm install

CMD ["node", "server.js"]