module.exports = () => ({
  kafkaHost: process.env.KAFKA_URL || 'localhost:9092',
  clientName: 'items-service',
  groupId: 'items',
  workerPerPartition: 1,
  options: {
    sessionTimeout: 8000,
    protocol: ['roundrobin'],
    fromOffset: 'earliest', // 'latest'
    fetchMaxBytes: 1024 * 100,
    fetchMinBytes: 1,
    fetchMaxWaitMs: 10,
    heartbeatInterval: 250,
    retryMinTimeout: 250,
    autoCommit: true,
    autoCommitIntervalMs: 1000,
    requireAcks: 0,
    // ackTimeoutMs: 100,
    // partitionerType: 3
  },
});