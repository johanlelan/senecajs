const assert = require('assert');
const kafka = require('kafka-node');
const extract = require('lodash.get');
const {KafkaStreams} = require("kafka-streams");

const kafkaStreamConfig = require('./kafka.options')();
const zkOptions = {
  sessionTimeout: 300,
  spinDelay: 100,
  retries: 2,
};

module.exports = ({logger, cache}) => new Promise((resolve) => {
  // verify required properties
  assert.ok(logger, 'kafka-lib should be called with a logger property');
  assert.ok(cache, 'kafka-lib should be called with a cache property (memory-cache)');
  
  const client = new kafka.Client(process.env.ZK_URL || 'localhost:2181', 'gateway', zkOptions);
  client.once('connect', () => {
    logger.debug('Connection established');
  });
  client.once('error', (err) => {
    logger.error('When connecting to kafka broker', err);
    // force crash
    process.exit(1);
  });
  client.createTopics(['search'], (err) => {
    if (err) {
      logger.error('When creating topics', err);
      // force crash
      process.exit(1);
    }
    const kafkaStreams = new KafkaStreams(kafkaStreamConfig);
    const stream = kafkaStreams.getKStream(null);
    stream.from('search');
    stream.mapJSONConvenience();
    stream.filter(message => !Buffer.isBuffer(message.value));
    stream.forEach(event => {
      const data = extract(event,'value.data');
      // need to clean cache entry when item is indexed
      cache.del(data.id);
      logger.info({ notice: 'item have been removed from cache because search-service is up-to-date', aggregateId: data.id });
    });
    stream.start().then(() => {
      logger.debug('search-event stream is consumed');
      resolve();
    });
  });
});