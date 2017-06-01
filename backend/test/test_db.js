/**
 * Created by yianni on 25/05/17.
 */
var sinon = require('sinon');


//export the query method for passing queries to the pool
module.exports.query = sinon.spy();
