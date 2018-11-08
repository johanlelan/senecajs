process.env.LOG_LEVEL = 'debug';

require('should');
const uuid = require('uuid');
const request = require('request');

let server;
describe('items endpoint', function() {
  const itemsList = [];
  const testingTransport = function test(options) {
    this.add('role: items, cmd: create', (msg, cbk) => {
      msg.data.id = uuid.v4();
      itemsList.push(msg.data);
      cbk(null, msg.data);
    });
    this.add('role: search, cmd: getById', (msg, callback) => {
      this.log.info({ notice: 'microservice receive the message' });
      var item = itemsList.find(item => {
        return item.id ==  msg.id;
      });
  
      callback(null, item);
    });
  
    this.add('role: search, cmd: query', (args, callback) => {
      var pattern = new RegExp(args.query);
      var results = itemsList.filter(prod => {
        return (pattern.test(prod.title) || pattern.test(prod.description));
      });
  
      callback(null, results);
    });
    return { name: 'test'};
  }

  before(done => {
    // define testing options for transport
    const testingOptions = {
      port: '3000',
      logger: console.log,
      cache: {
        put: (key, value) => {},
        get: (key) => (undefined),
      },
      transport: {
        command: {
          plugin: testingTransport,
          client: {
            pin: 'role: items',
          },
        },
        query: {
          plugin: testingTransport,
          client: {
            pin: 'role: search',
          },
        },
      },
    };
    server = require('./app').run(testingOptions, done);
  });

	it('should create an item', function(done) {
    console.log({ test: 'mocha test is started', when: Date.now()});
    const json = { title: 'test' };
		request({
      method: 'POST',
      url: 'http://localhost:3000/items',
      json: true,
      body: json,
    }, function(error, response, body) {
      should.not.exists(error);
      response.statusCode.should.equal(201);
      body.should.have.property('title', json.title);
			done();
		});
  });

  it('should get a created item', function(done) {
    const item = { title: 'test' };
		request({
      method: 'POST',
      url: 'http://localhost:3000/items',
      json: item,
    }, function(errorPost, responsePost, bodyPost) {
      hrstart = process.hrtime();
			should.not.exists(errorPost);
			responsePost.statusCode.should.equal(201);
      bodyPost.should.have.property('title', item.title);
      responsePost
      const locationHeader = responsePost.headers.location;
			request({
        method: 'GET',
        url: `http://localhost:3000${locationHeader}`,
        json: true,
      }, function(error, response, body) {
        should.not.exists(error);
        response.statusCode.should.equal(200);
        body.should.have.property('title', item.title);
        done();
      });
		});
  });
  
  it('should return a 404 on unknown item', function(done) {
    request({
      method: 'GET',
      url: 'http://localhost:3000/items/unknown',
      json: true,
    }, function(error, response, body) {
      should.not.exists(error);
      response.statusCode.should.equal(404);
      done();
    });
	});

  it('should search into created items', function(done) {
    const query = {};
    request({
      method: 'POST',
      url: 'http://localhost:3000/items/_search',
      json: query,
    }, function(error, response, body) {
      should.not.exists(error);
      response.statusCode.should.equal(200);
      body.should.be.instanceOf(Array);
      done();
		});
  });
  
  after(done => {
    server.close(done)
  });
});