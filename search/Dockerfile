FROM node:alpine

RUN apk add --no-cache make gcc g++ python git

ADD package.json /
ADD business-logic.js .
ADD kafka.lib.js .
ADD kafka.options.js .
ADD server.js .

RUN npm install

CMD ["node", "server.js"]