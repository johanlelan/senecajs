const assert = require('assert');
const Seneca = require('seneca');
const SenecaWeb = require('seneca-web');
const Express = require('express');
const bodyParser = require('body-parser');

const express = Express();
const routesMap = require('./route.map');

express.use(bodyParser.json());

let server;

const run = (options, callback) => {
  assert.ok(options.port, 'app should be called with options.port');
  const seneca = Seneca({
      tag: 'gateway',
      legacy: { logging: false },
      'pino-logger': {instance: options.logger},
    })
    .use('pino');
  // configure kafka stream
  return seneca.use(SenecaWeb, { 
    context: express, 
    routes: routesMap,
    adapter: require('seneca-web-adapter-express'),
    options: {
      parseBody: false,
    },
  })
  .use('./items-logic', options)
  .ready(() => {
    const app = seneca.export('web/context')();
    server = app.listen(options.port, (err) => {
      seneca.log.info({ notice: 'REST get item from cache. search engine is not up-to-date.' });
      callback(err, server);
    });
  });
};

// export express server for testing purpose
module.exports = {
  run,
};