require('should');
const Seneca = require('seneca');
// Construct a Seneca instance suitable for unit testing
function test_seneca (fin) {
  return Seneca({log: 'test'})
    .test(fin)

  // Load the microservice business logic.
    .use(require('./business-logic'), {
      eventEmitter: {
        emit: (type, event) => {
          type.should.equal('ItemCreated');
          event.should.have.property('id');
          event.should.have.property('aggregateId');
          event.should.have.property('type', 'ItemCreated');
          event.should.have.property('timestamp');
          event.should.have.property('data');
        },
      },
    });
};

// A suite of unit tests for this microservice.
describe('items', function () {
  // A unit test (the test callback is named 'fin' to distinguish it from others).
  it('create new one', function (fin) {
    // Create a Seneca instance for testing.
    var seneca = test_seneca(fin);
    // Gate the execution of actions for this instance. Gated actions are executed
    // in sequence and each action waits for the previous one to complete. Gating
    // is not required, but avoids excessive callbacks in the unit test code.
    seneca
      .gate()
      // Send an action, and validate the response.
      .act({
        role: 'items',
        cmd: 'create',
        id: ''+Math.random(),
        when: Date.now(),
        user: 'u0',
        data: { text: 'consectetur adipiscing elit,' },
      }, function (ignore, result) {
        result.should.be.instanceOf(Object);
        result.should.have.property('id');
      })
      // Once all the tests are complete, invoke the test callback
      .ready(fin)
  });
});