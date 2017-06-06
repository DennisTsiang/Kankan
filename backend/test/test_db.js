/**
 * Created by yianni on 25/05/17.
 */
var sinon = require('sinon');


//export the query method for passing queries to the pool
function test_db() {
  this.query = sinon.spy();
}

module.exports.test_db = test_db;
