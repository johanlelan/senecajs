const port = process.env.PORT || '3002';

var Pino = require('pino');

var pino = Pino();

// configure kafka stream
require('./kafka.lib')({
  logger: pino,
}).then(({eventEmitter}) => {
  require('seneca')({
    tag: 'search',
    legacy: { logging: false },
    'pino-logger': {instance: pino},
  })
  .use('pino')
  .use('business-logic', {
    eventEmitter,
  })
  .add('info:entry', function(msg,done){
    delete msg.info;
    this.act('search:insert',msg,done);
  })
  .listen({type: 'tcp', port, pin: 'role: search'})
  .ready(function(){
    this.log.info({ notice: `microservice search ${this.id} is listening on tcp:${port}`});
  });
});