/**
 * Created by yianni on 25/05/17.
 */
module.exports.App = App;

var httpPort = process.argv[3];
var db_module = require('./db_multiple_tables');
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
  var resetLock = require('locks').createMutex();

  this.handleFileConnection = function (request, response) {
    var frontend = __dirname;
    frontend = frontend.substring(0, frontend.length - 14);
    if (request.originalUrl === "/") {
      response.sendFile(frontend + 'frontend/index.html');
    } else if (request.originalUrl === "/ResetTable") {
      resetLock.lock(function () {
        db.deleteProject(0, function (successful) {
          db.newProject("Kanban", function (newPid) {
            if (newPid === 0) {
              db.newColumn(newPid, "To Do", 0, function (res1) {
                db.newColumn(newPid, "In Progess", 1, function (res2) {
                  db.newColumn(newPid, "Done", 2, function (res3) {
                    resetLock.unlock();
                    console.log("Finished Setup");
                    response.sendFile(frontend + 'frontend/index.html');
                  });
                });
              });
            } else {
              resetLock.unlock();
              console.error("Wrong pid!");
            }
          });
        });
      });
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
      _this.handleUpdate(JSON.parse(data), function (response, success) {
        if (success) {
          socket.emit('updatereply', JSON.stringify(response));
          socket.broadcast.emit('updatereply', JSON.stringify(response));
          console.log('Replied to update');
        }
      });
    });

    socket.on('remove', function (data) {
      console.log('Received Remove');
      _this.handleRemove(JSON.parse(data), function (response) {
        socket.emit('removereply', JSON.stringify(response));
        socket.broadcast.emit('removereply', JSON.stringify(response));
        console.log('Replied to delete');
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
      case 'user_projects':
        db.getUsersProjects(request["username"], function (projects) {
          callback({type:'user_projects', object:projects});
        });
        break;
      case 'new_user_project':
        db.addUserToProject(request["username"], request["pid"], function(success) {
          callback({type:'new_user_project'});
        });
        break;
      case 'add_user_to_ticket':
        db.addUserToTicket(request["username"], request["tid"], request["pid"], function(success) {
          callback({type:'add_user_to_project'});
        });
        break;
      case 'user_tickets':
        db.getUserTickets(request["username"], request["pid"], function (tickets) {
          callback({type:'user_tickets', object:tickets});
        });
        break;
      case 'ticket_users':
        db.getTicketUsers(request["pid"], request["tid"], function (users) {
          callback({type:'user_tickets', object:users});
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
        db.newTicket(store['pid'], store['column_id'], function () {
          //TODO: Copied from getTickets - return all tickets
          db.getTickets(store['pid'], function(tickets) {
            callback({type:'tickets', object:tickets});
          });
        });
        break;
      case 'project_new':
        db.newProject(store["project_name"], function (pid) {
          callback();
        });
        break;
      case 'column_new':
        db.newColumn(store["pid"], store["column_name"], store["position"], function (cid) {
          callback();
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
        db.moveTicket(update['pid'], update['ticket'], update['to'], update['from'], function (success) {
          if (success) {
            callback({
              type: 'ticket_moved',
              to_col: update.to,
              from_col: update.from,
              ticket_id: update.ticket.ticket_id
            }, success);
          } else {
            callback({}, success);
          }
        });
        break;

      case 'ticket_info':
        db.updateTicketDesc(update['pid'], update['ticket'], update['new_description'], function (info) {
          callback({type:'ticket_info', ticket_id:update.ticket.ticket_id, desc:update.new_description, col:update.ticket.col} ,
          true);
        });
        break;

      case 'ticket_deadline':
        db.updateTicketDeadline(update['pid'], update['ticket'], update['deadline'], function (info) {
          callback({type:'ticket_deadline', ticket_id:update.ticket.ticket_id, deadline:deadline, col:update.ticket.col} ,
              true);
        });
        break;

      default:
        //TODO: Handle unknown update.
        break;
    }
  };

  this.handleRemove = function (remove, callback) {
    //TODO: Handle correct delete data - not blow up
    //TODO: catch errors and report to client
    switch (remove['type']) {
      case 'ticket_remove':
        db.deleteTicket(remove.pid, remove.ticket_id, function (success) {
              callback({type: 'ticket_remove', pid: remove.pid, ticket_id: remove.ticket_id});
            }
        );
        break;
      case 'column_remove':
        db.deleteColumn(remove.pid, remove.column_id, function (success) {
              callback({type: 'column_remove', pid: remove.pid, column_id: remove.column_id});
            }
        );
        break;
      case 'project_remove':
        db.deleteProject(remove.pid, function (success) {
              callback({type: 'project_remove', pid: remove.pid});
            }
        );
        break;
      default:
        //TODO: Handle unknown update.
        break;
    }
  };

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




