const port = process.env.PORT || 3000;

const cache = require('memory-cache');
var Pino = require('pino');

var pino = Pino();
const app = require('./app');

require('./kafka.lib')({ logger: pino, cache, }).then(() => app.run({
  port,
  cache,
  logger: pino,
  transport: {
    command: {
      client: {
        type: 'tcp',
        host: process.env.COMMAND_HOST || 'localhost',
        port: process.env.COMMAND_PORT || '3001',
        pin: 'role: items',
      },
    },
    query: {
      client: {
        type: 'tcp',
        host: process.env.QUERY_HOST || 'localhost',
        port: process.env.QUERY_PORT || '3002',
        pin: 'role: search',
      },
    },
  }}, (err) => {
    if (err) throw (err);
    pino.info({ notice: `gateway server is listening on :${port}` });
}));