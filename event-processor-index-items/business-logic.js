const assert = require('assert');

module.exports = function search (options) {
  assert.ok(options.logger, 'business-logic should be called with options.logger');
  assert.ok(options.transport, 'business-logic should be called with options.transport');
  assert.ok(options.transport.client, 'business-logic should be called with options.transport.client config');
  var seneca = this;

  const proxy = seneca
    .use('pino')
    .client(options.transport.client)
    .ready(() => {
      this.log.info({notice: 'proxy client is ready'});
      // init items saga
      require('./kafka.lib')({
        logger: this.log,
        proxy,
      }).then(() => {
        proxy.log.info({ notice: 'event-processor-index-items has been initialize' });
      });
    });

  function init (msg, done) {
    seneca.log.info({ notice: 'initialize event-processor-index-items processor' });
    done();
  }

  seneca.add('init:event-processor-index-items', init);

  return { name: 'event-processor-index-items'};
}