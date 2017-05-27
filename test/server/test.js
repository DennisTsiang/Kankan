/**
 * Created by yianni on 25/05/17.
 */

var expect = require('chai').expect;
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
  var mock_db = new db.Database(require('../test_db'));
  describe('Concurrency', function () {
    it("Works with multiple async calls", function () {
      mock_db.getTickets();
    });
  });
});


//TODO: Write server request tests
describe('Request', function() {
  describe('#handleRequest()', function() {

  });

  describe('#handleStore()'), function () {

  };

  describe('#handleUpdate()'), function () {

  };
});