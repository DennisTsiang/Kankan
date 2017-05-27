/**
 * Created by yianni on 25/05/17.
 */

var await = require('asyncawait/await');
var async = require('asyncawait/async');

var database = require('./db_one_table');
var ticket = require('./ticket');
var db = new database.Database(require('./db'));

var handleConnection = async(function (request, response) {
  var method = request.method;
  var url = request.url;

  if (url === '/') {
    //send client code
    sendClientCode(response);

  } else if (url === '/app' && method === 'POST') {
    //handle request

    var body = [];
    var bodyString = "";
    request.on('data', function(chunk) {
      body.push(chunk);
    }).on('end', function() {
      bodyString = Buffer.concat(body).toString();
    });

    var jsonInput = JSON.parse(bodyString);
    handleCommunication(jsonInput, function(result) {
      response.write(result);
      response.end();
    });

  } else {
    //error
  }
});

function handleRequest(request, callback) {
  switch (request['type']) {
    case 'kanban':
      //TODO: Handle request kanban.
      break;

    case 'tickets':
      //TODO: Handle request tickets.
      break;

    default:
      //TODO: Handle unknown request.
      break;
  }

}

function handleUpdate(update, callback) {
  switch (update['type']) {
    case 'ticket_moved':
      //TODO: Handle ticket moved.
      break;

    case 'ticket_info':
      //TODO: Handle updte ticket info.
      break;

    default:
      //TODO: Handle unknown update.
      break;
  }
}

function handleStore(store, callback) {
  switch (store['type']) {
    case 'ticket_new':
      //TODO: Handle new ticket.
      break;

    default:
      //TODO: Handle unknown store.
      break;
  }
}

function handleCommunication(jsonInput, callback) {
  if ('request' in jsonInput) {
    var request = jsonInput['request'];
    handleRequest(request, callback);

  } else if ('store' in jsonInput) {
    var store = jsonInput['store'];
    handleStore(store, callback);

  } else if ('update' in jsonInput) {
    var update = jsonInput['update'];
    handleUpdate(update, callback);
  }
}

var clientCodePath = 'Client.html';
fs = require('fs');
function sendClientCode(response) {
  fs.readFile(clientCodePath, 'utf8', function (err, data) {
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
