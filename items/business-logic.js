const uuid = require('uuid');
const items = [];
module.exports = function search (options) {
  var seneca = this;
  
  function create (msg, done) {
    const aggregateId = uuid.v4();
    msg.data.id = aggregateId;
    items.push(msg.data);
    seneca.log.info({notice: 'create a new item', item: msg.data});
    // emit domain events
    options.eventEmitter.emit('ItemCreated', {
      id: uuid.v4(),
      aggregateId,
      type: 'ItemCreated',
      timestamp: Date.now(),
      data: msg.data,
    });
    done(null, msg.data);
  }

  function init (msg, done) {
    seneca.log.info({notice: 'initialize items'});
    done();
  }

  seneca.add({role: 'items', cmd: 'create'}, create);
  seneca.add('init:items', init);

  return { name: 'items'};
}