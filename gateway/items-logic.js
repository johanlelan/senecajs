const assert = require('assert');

module.exports = function items (options) {
  // verify required properties
  assert.ok(options.transport, 'items-logic should be called with options.transport');
  assert.ok(options.transport.command, 'items-logic should be called with options.transport.command');
  assert.ok(options.transport.query, 'items-logic should be called with options.transport.query');
  assert.ok(options.cache, 'items-logic should be called with a memory-cache property options.cache');

  const seneca = this;
  const commandProxy = options.transport.command.plugin ? seneca.use(options.transport.command.plugin): seneca;
  const queryProxy = options.transport.query.plugin ? seneca.use(options.transport.query.plugin): seneca;
  commandProxy.client(options.transport.command.client).ready(() => {
    seneca.log.info({notice: 'proxy command is ready'});
    queryProxy.client(options.transport.query.client).ready(() => {
      seneca.log.info({notice: 'proxy query is ready'});
    seneca.add('role: web, cmd: getById', (msg, callback) => {
      const itemId = msg.args.params.id;
      const fromCache = options.cache.get(itemId);
      seneca.log.info({ notice: 'REST get an item by id', itemId });
      // The query database have not been updated
      if (fromCache) {
        // so reponse with cache result
        seneca.log.info({ notice: 'REST get item from cache. search engine is not up-to-date.' });
        return callback(null, fromCache);
      }
      // get indexed item from query database
      queryProxy.act({role: 'search', cmd: 'getById', id: itemId}, (err, item) => {
        if (!item) msg.response$.statusCode = 404;
        else queryProxy.log.info({ notice: 'proxy found item', aggregateId: item.id });
        callback(err, item);
      });
    });
    seneca.add('role: web, cmd: search', (args, callback) => {
      seneca.log.info({ notice: 'REST find matching items' });
      var pattern = new RegExp(args.query);
      // find all matching items
      queryProxy.act({role: 'search', cmd: 'query', pattern: pattern}, callback);
    });
    seneca.add('role: web, cmd: create', (msg, callback) => {
      seneca.log.info({ notice: 'REST create a new item' });
      var body = msg.args.body;
      // append new item into items-store
      commandProxy.act({role: 'items', cmd: 'create', data: body}, (err, created) => {
        if (err) {
          msg.response$.statusCode = 500;
          return callback(err);
        }
        commandProxy.log.info({ notice: 'item-service have created the new item' });
        msg.response$.statusCode = 201;
        const location = `/items/${created.id}`;
        msg.response$.header('Location', location);
        // TRICK: put body into cache while query database have not been updated
        options.cache.put(created.id, body);
        commandProxy.log.info({ notice: 'item was saved into cache until search-service was up-to-date', aggregateId: created.id });
        callback(err, body);
      });
    });
    })
  });

  return { name: 'items'};
};