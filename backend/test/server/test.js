var expect = require('chai').expect;
var mocha = require('mocha');
var sinon = require('sinon');
var assert = require('assert');
var async = require('asyncawait/async');
var db = require('../../server/db_multiple_tables');
var app = require('../../server/app');
var io = require('socket.io');
var testdatabase = require('../test_db');

describe('Database', function () {
  describe('getKanban', function () {
    var test_db = new testdatabase.test_db();
    var mock_db = new db.Database(test_db);
    mock_db.getKanban(0, function (something) {});
    it('calls query once when calling', function () {
      assert(test_db.query.calledOnce);
    });
    it('Calls correct query', function () {
      var query = test_db.query.getCall(0).args[0];
      assert(query.includes(' FROM project_table '));
      assert(query.includes(' columns_0 '))
    });
  });

});

describe('App', function () {
  describe('Handle Request', function () {
    var adapter = require('../test_db_adapter');
    var db = new adapter.Database();
    var mock_app = new app.App(db);
    var test = {type:'tickets'};

    mock_app.handleRequest(test, function (something) {});

    it('Calls ticket once', function () {
      assert(db.getTickets.calledOnce)
    });
  });

  /*describe('Handle Socket Connection', function () {
    var adapter = require('../test_db_adapter');
    var db = new adapter.Database();
    var mock_app = new app.App(db);

    it('Doesnt crash', function () {
      app.start_server(8080);
      var socket = new io('localhost');
      socket.on('connection', function (socket) {
        var test_obj = {type:'kanban', pid:1};
        socket.emit('request', JSON.stringify(test_obj));
      });
      app.stop_server();
    });
  });*/
});



//TODO: Write server request tests
describe('Request', function() {
  describe('#handleRequest()', function() {

  });

  describe('#handleStore()', function () {

  });

  describe('#handleUpdate()', function () {

  });
});