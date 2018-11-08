require('should');
const Seneca = require('seneca');
const events = require('events');

const eventEmitter = new events.EventEmitter();

// Construct a Seneca instance suitable for unit testing
function test_seneca (fin) {
  return Seneca({log: 'test'})

  // activate unit test mode. Errors provide additional stack tracing context.
  // The fin callback is called when an error occurs anywhere.
    .test(fin)

  // Load the microservice business logic.
    .use('./business-logic', {
      eventEmitter,
    });
};

// A suite of unit tests for this microservice.
describe('search', function () {
  // A unit test (the test callback is named 'fin' to distinguish it from others).
  it('search-insert', function (fin) {
    // Create a Seneca instance for testing.
    var seneca = test_seneca(fin);
    // Gate the execution of actions for this instance. Gated actions are executed
    // in sequence and each action waits for the previous one to complete. Gating
    // is not required, but avoids excessive callbacks in the unit test code.
    seneca
      .gate()
      // Send an action, and validate the response.
      .act({
        role: 'search',
        cmd: 'insert',
        id: ''+Math.random(),
        when: Date.now(),
        user: 'u0',
        text: 'consectetur adipiscing elit,'
      }, function (ignore, result) {
        result.should.be.instanceOf(Object);
        result.should.have.property('indexed', true);
      })
      // Once all the tests are complete, invoke the test callback
      .ready(fin)
  });
  it('search-query', function (fin) {

    // Create a Seneca instance for testing.
    var seneca = test_seneca(fin);

    // Gate the execution of actions for this instance. Gated actions are executed
    // in sequence and each action waits for the previous one to complete. Gating
    // is not required, but avoids excessive callbacks in the unit test code.
    seneca
      .gate()
      // Send an action, and validate the response.
      .act({
        role: 'search',
        cmd: 'insert',
        id: ''+Math.random(),
        when: Date.now(),
        user: 'u0',
        data: {text: 'lorem ipsum dolor sit amet'}
      }, function (ignore, result) {
        result.should.be.instanceOf(Object);
        result.should.have.property('indexed', true);
      })
      // Send an action, and validate the response.
      .act({
        role: 'search',
        cmd: 'query',
        query: 'ipsum',
        // Because test mode is active, it is not necessary to handle
        // callback errors. These are passed directly to the 'fin' callback.
      }, function (ignore, list) {
        list.should.be.instanceOf(Array);
        list.length.should.equal(1);
        list[0].text.should.equal('lorem ipsum dolor sit amet');
      })
      // Once all the tests are complete, invoke the test callback
      .ready(fin)
  });
});