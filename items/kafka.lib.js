const kafka = require('kafka-node');
const {KafkaStreams} = require("kafka-streams");

const events = require('events');
const eventEmitter = new events.EventEmitter();

const kafkaStreamConfig = require('./kafka.options')();
const zkOptions = {
  sessionTimeout: 300,
  spinDelay: 100,
  retries: 2,
};

module.exports = ({logger}) => new Promise((resolve) => {
  const client = new kafka.Client(process.env.ZK_URL || 'localhost:2181', 'items-service', zkOptions);
  client.once('connect', () => {
    logger.info({ notice: 'Kafka connection established' });
  });
  client.createTopics(['items'], (err) => {
    if (err) {
      logger.error('When creating topics', err);
      // force crash
      process.exit(1);
    }
    const kafkaStreams = new KafkaStreams(kafkaStreamConfig);
    const stream = kafkaStreams.getKStream(null);
    stream.to('items');
    stream.start().then(() => {
      eventEmitter.on('ItemCreated', (event) => {
        // write to event stream
        logger.info({notice: 'save ItemCreated event to events-stream', event});
        stream.writeToStream(JSON.stringify(event));
      });
      resolve({
        eventEmitter,
      });
    });
  });
});