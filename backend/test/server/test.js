var expect = require('chai').expect;
var mocha = require('mocha');
var sinon = require('sinon');
var assert = require('assert');
var async = require('asyncawait/async');
var db = require('../../server/db_one_table');

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1, 2, 3].indexOf(4));
    });
  });
});

describe('Database', function () {
  var callback = sinon.spy();
  var mock_db = db.Database(callback);
  mock_db.getKanban(1, function(something) {});

  //assert(callback.calledOnce);

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