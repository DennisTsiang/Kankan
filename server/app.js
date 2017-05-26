/**
 * Created by yianni on 25/05/17.
 */

var await = require('asyncawait/await');
var async = require('asyncawait/async');

var database = require('./db_one_table');
var ticket = require('./ticket');

var handleConnection = async(function(request, response) {
    var method = request.method;
    var url = request.url;
    if (url === '/') {
        //send client code
        sendClientCode(response);
        var d = require('./db_one_table');
        var d = new d.Database(require('./db'));
        d.getTickets(0);
    } else if (url === '/app' && method === 'POST') {
        //handle request
        response.end();
    } else {
        //error
    }
});

var clientCodePath = 'Client.html';
fs = require('fs');
function sendClientCode(response) {
    fs.readFile(clientCodePath, 'utf8', function(err, data) {
        if (err) {
            response.write("There was an error completing your request.\n");
        } else {
            response.write(data);
        }

        response.end();
    });
}


var httpPort = 8000; //test port
var http = require('http');
var httpServer = http.createServer(handleConnection);

httpServer.listen(httpPort);
console.log("HTTP server listening on port " + httpPort + " at localhost.");
