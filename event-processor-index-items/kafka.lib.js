const kafka = require('kafka-node');
const {KafkaStreams} = require("kafka-streams");

const kafkaStreamConfig = require('./kafka.options')();
const zkOptions = {
  sessionTimeout: 300,
  spinDelay: 100,
  retries: 2,
};

module.exports = ({logger, proxy}) => new Promise((resolve) => {
  const client = new kafka.Client(process.env.ZK_URL || 'localhost:2181', 'event-processor-index-items', zkOptions);
  client.once('connect', () => {
    logger.info({ notice: 'Kafka connection established' });
  });
  client.once('error', (err) => {
    logger.error({ notice: 'When connecting to kafka broker', err });
    // force crash
    process.exit(1);
  });
  client.createTopics(['items'], (err) => {
    if (err) {
      logger.error({ notice: 'When creating kafka topics', err });
      // force crash
      process.exit(1);
    }
    const kafkaStreams = new KafkaStreams(kafkaStreamConfig);
    const stream = kafkaStreams.getKStream(null);
    stream.from('items');
    stream.mapJSONConvenience();
    stream.filter(message => !Buffer.isBuffer(message.value));
    stream.forEach(event => {
      // need to index outgoing event into event-processor-index-items
      // TODO JLL: do not use act instead send to input kafka sream of search-service
      proxy.act({role: 'search', cmd: 'insert', data: event.value.data}, (err, result) => {
        if (err) {
          proxy.log.error({ notice: 'Could not index new event', err });
        }
        proxy.log.info({ notice: 'item have been indexed', result, event});
      });
    });
    stream.start().then(() => {
      logger.info({ notice: 'event-processor for indexing items into search engine is started' });
      resolve();
    });
  });
});