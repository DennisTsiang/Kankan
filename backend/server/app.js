/**
 * Created by yianni on 25/05/17.
 */
module.exports.App = App;

var httpPort = process.argv[3];
var db_module = require('./db_one_table');
var pool = require('./db');
var db = new db_module.Database(pool);
var app = new App(db);
var ticket = require('./ticket');
var express = require('express')();
var http = require('http').Server(express);
var io = require('socket.io')(http);

start_server(httpPort);

function App (db) {

  var _this = this;

  this.handleFileConnection = function (request, response) {
    var frontend = __dirname;
    frontend = frontend.substring(0, frontend.length - 14);
    if (request.originalUrl === "/") {
      response.sendFile(frontend + 'frontend/index.html');
    } else {
      response.sendFile(frontend + 'frontend' + request.originalUrl);
    }
  };

  this.handleConnection = function (socket) {
    socket.on('request', function (data) {
      console.log('Received request');
      _this.handleRequest(JSON.parse(data), function (response) {
        socket.emit('requestreply', JSON.stringify(response));
        console.log('Replied to request');
      });
    });

    socket.on('store', function (data) {
      console.log('Received Store');
      _this.handleStore(JSON.parse(data), function (response) {
        socket.emit('storereply', JSON.stringify(response));
        socket.broadcast.emit('storereply', JSON.stringify(response));
        console.log('Replied to store');
      });
    });

    socket.on('update', function(data) {
      console.log('Received Update');
      _this.handleUpdate(JSON.parse(data), function (response) {
        socket.emit('updatereply', JSON.stringify(response));
        socket.broadcast.emit('updatereply', JSON.stringify(response));
        console.log('Replied to update');
      });
    });

  };

  this.handleRequest = function (request, callback) {
    //TODO: Check that request data is good and wont blow up.
    switch (request['type']) {
      case 'kanban':
        db.getKanban(request['pid'], function (kanban) {
          callback({type:'kanban', object:kanban});
        });
        break;

      case 'tickets':
        db.getTickets(request['pid'], function (tickets) {
          callback({type:'tickets', object:tickets});
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
        db.newTicket(store['pid'], store['ticket'], store['column_name'], function (new_ticket, position) {
          callback({type:'newticket', ticket_id:new_ticket.ticket_id, desc:new_ticket.desc, position:position});
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
          callback({type:'ticket_moved', to_col:update.to, from_col:update.from, ticket_id:update.ticket.ticket_id});
        });
        break;

      case 'ticket_info':
        db.updateTicketDesc(update['pid'], update['ticket'], update['new_description'], function (info) {
          callback({type:'ticket_info', ticket_id:update.ticket.ticket_id, desc:update.new_description, col:update.ticket.col});
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
}

module.exports.start_server = start_server;
module.exports.stop_server = stop_server;

function start_server (port) {

  express.get('/\*', app.handleFileConnection);

  io.on('connection', app.handleConnection);

  if (!module.parent) {
    http.listen(port);
    console.log("HTTP server listening on port " + port + " at localhost.");
  }
}

function stop_server() {
  io.close();
  console.log('Server was closed');
}




