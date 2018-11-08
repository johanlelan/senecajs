const port = process.env.PORT || '3001';

var Pino = require('pino');

var pino = Pino();

// configure kafka stream
require('./kafka.lib')({
  logger: pino,
}).then(({eventEmitter}) => {
  require('seneca')({
    tag: 'items',
    legacy: { logging: false },
    'pino-logger': {instance: pino},
  })
    .use('pino')
    .use('business-logic', {
      eventEmitter,
    })
    .add('info:entry', function(msg,done){
      delete msg.info;
      this.act('items:create',msg,done);
    })
    .listen({type: 'tcp', port, pin: 'role: items'})
    .ready(function(){
      this.log.info({ notice: `microservice items ${this.id} is listening on tcp:${port}` });
      this.log.info({ notice: 'microservice items will manage role:items messages' });
    });
});
