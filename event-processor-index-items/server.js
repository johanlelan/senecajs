const port = process.env.PORT || '3003';
const queryHost = process.env.QUERY_HOST || 'localhost';
const queryPort = process.env.QUERY_PORT || '3002';

var Pino = require('pino');

var pino = Pino();

require('seneca')({
  tag: 'event-processor-index-items',
  legacy: { logging: false },
  'pino-logger': {instance: pino},
})
  .use('pino')
  .use('business-logic', {
    logger: pino,
    transport: {
      client: {
        type: 'tcp',
        host: queryHost,
        port: queryPort,
        pin: 'role: search',
      }
    }
  })
  .add('info:entry', function(msg,done){
    delete msg.info;
    this.act('event-processor-index-items:propagate',msg,done);
  })
  .listen({type: 'tcp', port, pin: 'role: event-processor-index-items'})
  .ready(function(){
    this.log.info({ notice: `microservice event-processor-index-items ${this.id} is listening on tcp:${port}`});
  });