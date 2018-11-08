const assert = require('assert');
const uuid = require('uuid');

const index = [];

module.exports = function search (options) {
  // verify required properties
  assert.ok(options.eventEmitter, 'business-logic should be called with an event emitter (options.eventEmitter)');
  var seneca = this;
  
  function search_query (msg, done) {
    this.log.debug('invoke search query');
    done(null, index.filter((indexed) => {
      if (!indexed) return false;
      if (!indexed.text) return false;
      return indexed.text.indexOf(msg.query) > -1;
    }));
  }

  function search_insert (msg, done) {
    this.log.debug('invoke index command');
    index.push(msg.data);
    // emit domain events
    options.eventEmitter.emit('ItemIndexed', {
      id: uuid.v4(),
      aggregateId: msg.data && msg.data.aggregateId,
      type: 'ItemIndexed',
      timestamp: Date.now(),
      data: msg.data,
    });
    done(null, { indexed: true });
  }

  function getById (msg, done) {
    this.log.debug('invoke getById');
    const item = index.find((indexed) => indexed.id === msg.id);
    done(null, item);
  }

  function init (msg, done) {
    this.log.info({ notice: 'initialize search engine' });
    done();
  }

  seneca.add({role: 'search', cmd: 'query'}, search_query);
  seneca.add({role: 'search', cmd: 'insert'}, search_insert);
  seneca.add({role: 'search', cmd: 'getById'}, getById);
  seneca.add('init:search', init);

  return { name: 'search'};
}