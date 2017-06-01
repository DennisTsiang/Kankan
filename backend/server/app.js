/**
 * Created by yianni on 25/05/17.
 */
module.exports.App = App;

var httpPort = process.argv[3];
var app = new App(require('./db_one_table'));
var ticket = require('./ticket');
var express = require('express')();
var http = require('http').Server(express);
var io = require('socket.io')(http);

express.get('/\*', app.handleFileConnection);

io.on('connection', app.handleConnection);

if (!module.parent) {
  http.listen(httpPort);
  console.log("HTTP server listening on port " + httpPort + " at localhost.");
}




function App (db) {

  this.handleFileConnection = function (request, response) {
    if (request.pathname === "/") {
      response.sendFile('../../frontend/index.html');
    } else {
      response.sendFile('../../frontend' + request.pathname);
    }
  };

  this.handleConnection = function (socket) {
    socket.on('request', function (data) {
      super.handleRequest(JSON.parse(data), function (response) {
        socket.emit('requestreply', response);
      });
    })

    /*var jsonInput = JSON.parse(bodyString);
    this.handleCommunication(jsonInput, function (result) {
      response.write(result);
      response.end();
    });*/

  };

  this.handleRequest = function (request, callback) {
    //TODO: Check that request data is good and wont blow up.
    switch (request['type']) {
      case 'kanban':
        db.getKanban(request['pid'], function (kanban) {
          callback(JSON.stringify(kanban));
        });
        break;

      case 'tickets':
        db.getTickets(request['pid'], function (ticket) {
          callback(JSON.stringify(ticket));
        });
        break;

      default:
        //TODO: Handle unknown request.
        break;
    }
  };

  this.handleStore = function (store, callback) {
    //TODO: Handle correct store data - not blow up
    //TODO: catch errors and report to client
    switch (store['type']) {
      case 'ticket_new':
        db.newTicket(update['pid'], update['ticket'], update['column_name'], function (new_ticket) {
          callback(JSON.stringify({'response': 'ok'}));
        });
        break;

      default:
        //TODO: Handle unknown store.
        break;
    }
  };

  this.handleUpdate = function (update, callback) {
    //TODO: Handle correct update data - not blow up
    //TODO: catch errors and report to client
    switch (update['type']) {
      case 'ticket_moved':
        db.moveTicket(update['pid'], update['ticket'], update['to'], update['from'], function (move) {
          callback(JSON.stringify({'response': 'ok'}));
        });
        break;

      case 'ticket_info':
        db.updateTicketDesc(update['pid'], update['ticket'], update['new_description'], function (info) {
          callback(JSON.stringify({'response': 'ok'}));
        });
        break;

      default:
        //TODO: Handle unknown update.
        break;
    }
  };

  /*this.handleCommunication = function (jsonInput, callback) {
    if ('request' in jsonInput) {
      var request = jsonInput['request'];
      this.handleRequest(request, callback);

    } else if ('store' in jsonInput) {
      var store = jsonInput['store'];
      this.handleStore(store, callback);

    } else if ('update' in jsonInput) {
      var update = jsonInput['update'];
      this.handleUpdate(update, callback);
    }
  };*/

  var clientCodePath = 'Client.html';
  fs = require('fs');
  this.sendClientCode = function (response) {
    fs.readFile(clientCodePath, 'utf8', function (err, data) {
      if (err) {
        response.write("There was an error completing your request.\n");
      } else {
        response.write(data);
      }

      response.end();
    });
  };
};



