/**
 * Created by yianni on 25/05/17.
 */

var await = require('asyncawait/await');
var async = require('asyncawait/async');

var database_implementation = require('./db_one_table');
var ticket = require('./ticket');
var db = new database_implementation.Database(require('./db'));

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
  //TODO: Check that request data is good and wont blow up.
  switch (request['type']) {
    case 'kanban':
      var kanban = await (db.getKanban(request['pid']));
      callback(JSON.stringify(kanban));
      break;

    case 'tickets':
      var tickets = await (db.getKanban(request['pid']));
      callback(JSON.stringify(kanban));
      break;

    default:
      //TODO: Handle unknown request.
      break;
  }
}

function handleStore(store, callback) {
  //TODO: Handle correct store data - not blow up
  //TODO: catch errors and report to client
  switch (store['type']) {
    case 'ticket_new':
      var new_ticket = await (db.newTicket(update['pid'], update['ticket'], update['column_name']));
      callback(JSON.stringify({'response':'ok'}));
      break;

    default:
      //TODO: Handle unknown store.
      break;
  }
}

function handleUpdate(update, callback) {
  //TODO: Handle correct update data - not blow up
  //TODO: catch errors and report to client
  switch (update['type']) {
    case 'ticket_moved':
      var move = await (db.moveTicket(update['pid'], update['ticket'], update['to'], update['from']));
      callback(JSON.stringify({'response':'ok'}));
      break;

    case 'ticket_info':
      var info = await (db.updateTicketDesc(update['pid'], update['ticket'], update['new_description']));
      callback(JSON.stringify({'response':'ok'}));
      break;

    default:
      //TODO: Handle unknown update.
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


var httpPort = process.env.SERVER_PORT;
var http = require('http');
var httpServer = http.createServer(handleConnection);

httpServer.listen(httpPort);
console.log("HTTP server listening on port " + httpPort + " at localhost.");
