module.exports.App = App;

var httpPort = process.argv[3];
var db_module = require('./db_multiple_tables');
var pool = require('./db');
var db = new db_module.Database(pool);
var app = new App(db);
var ticket = require('./ticket');
var express = require('express')();
var http = require('http').Server(express);
const code_server = 'http://146.169.45.29:8008';
var socket_code = require('socket.io-client')(code_server);
var io_client = require('socket.io')(http);
start_server(httpPort);

function App (db) {

  var _this = this;

  this.handleFileConnection = function (request, response) {
    var frontend = __dirname;
    frontend = frontend.substring(0, frontend.length - 14);
    if (request.originalUrl === "/") {
      response.sendFile(frontend + 'frontend/kankan.html');
    } else {
      response.sendFile(frontend + 'frontend' + request.originalUrl);
    }
  };

  this.handleConnection = function (socket) {
    socket.on('joinroom', function (room) {
      socket.join(room);
      console.log("Socket joined room " + room);
    });

    socket.on('leaveroom', function (room) {
      socket.leave(room);
      console.log("Socket left room " + room);
    });

    socket.on('request', function (data) {
      console.log('Received request');
      _this.handleRequest(JSON.parse(data), function (response) {
        socket.emit('requestreply', JSON.stringify(response));
        console.log('Replied to request');
      });
    });

    socket.on('store', function (data) {
      console.log('Received Store');
      _this.handleStore(JSON.parse(data), function (response, pid) {
        if (pid === null) {
          socket.emit('storereply', JSON.stringify(response));
        } else if (pid === 'all') {
          socket.emit('storereply', JSON.stringify(response));
          socket.broadcast.emit('storereply', JSON.stringify(response));
        } else {
          io_client.sockets.in(pid).emit('storereply', JSON.stringify(response));
        }
        console.log('Replied to store');
      });
    });

    socket.on('update', function(data) {
      console.log('Received Update');
      _this.handleUpdate(JSON.parse(data), function (response, success, pid) {
        if (success) {
          if (pid === null) {
            socket.emit('updatereply', JSON.stringify(response));
          } else {
            io_client.sockets.in(pid).emit('updatereply', JSON.stringify(response));
          }
          console.log('Replied to update');
        }
      });
    });

    socket.on('remove', function (data) {
      console.log('Received Remove');
      _this.handleRemove(JSON.parse(data), function (response, pid) {
        if (pid === null) {
          socket.emit('removereply', JSON.stringify(response));
          socket.broadcast.emit('removereply', JSON.stringify(response));
        } else {
          io_client.sockets.in(pid).emit('removereply', JSON.stringify(response));
        }
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
        db.getTickets(request['pid'], function (pid, tickets) {
          callback({type:'tickets', object:{pid:pid, tickets:tickets}});
        });
        break;
      case 'user_projects':
        db.getUsersProjects(request["username"], function (projects) {
          callback({type:'user_projects', object:projects});
        });
        break;
      case 'add_user_to_ticket':
        db.addUserToTicket(request["username"], request["tid"], request["pid"], function(success) {
          db.getTicketUsers(request['pid'], request['tid'], function(tid, users) {
            callback({type:'ticket_users', object:{tid: tid, users: users}});
          })
        });
        break;
      case 'user_tickets':
        db.getUserTickets(request["username"], request["pid"], function (tickets) {
          callback({type:'user_tickets', object:tickets});
        });
        break;
      case 'ticket_users':
        db.getTicketUsers(request["pid"], request["tid"], function (tid, users) {
          callback({type:'ticket_users', object:{tid: tid, users: users}});
        });
        break;
      case 'user_new' :
        db.addNewUser(request['username'], function (success) {
          callback( {type: 'user_new', success:success});
        });
        break;
      case 'user_check' :
        db.checkUserExists(request['username'], function(result){
          callback({type : 'user_check', result : result});
        });
        break;
      case 'project_users' :
        db.getProjectUsers(request['pid'], function (users) {
          callback({type: 'project_users', object:users});
        });
        break;
      case 'project_files' :
        db.getFilenames(request.pid, request.filename, function (filenames) {
          callback({type: 'project_files', object:filenames});
        });
        break;
      case 'file_methods' :
        db.getMethodNames(request.pid, request.filename, request.methodname, function (methodnames) {
          callback({type:'file_methods', object:methodnames});
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
        //Returns the new ticket id
        db.newTicket(store['pid'], store['column_id'], function (tid) {
          if (tid !== -1) {
            callback({type: 'ticket_new', object: {tid: tid, column_id: store['column_id'], pid: store['pid'], desc:'New Ticket'}},
                store["pid"]);
          } else {
            callback({type: 'ticket_new', object: {tid: "Maxticketlimitreached", column_id: store['column_id'], pid: store['pid']}},
                null);
          }
        });
        break;
      case 'project_new':
        db.newProject(store["project_name"], store["gh_url"], function (pid) {
          db.newColumn(pid, 'Analyze',0, function () {
            db.newColumn(pid, 'Development', 1, function () {
              db.newColumn(pid, 'Testing', 2, function () {
                db.newColumn(pid, 'Done', 3, function () {
                  set_gh_url(pid, store['gh_url']);
                  callback({type:'project_new', object:pid}, null);
                });
              });
            });
          });
        });
        break;
      case 'column_new':
        db.newColumn(store["pid"], store["column_name"], store["position"], function (cid, column_name, position) {
          callback({type:'column_new', object:{cid:cid, column_name:column_name, position:position}}, store['pid']);
        });
        break;
      case 'new_user_project':
        db.addUserToProject(store["username"], store["pid"], function(success) {
          callback({type:'new_user_project'}, 'all');
        });
        break;
      case 'add_ticket_method':
        db.addMethodToTicket(store.pid, store.filename, store.methodname, store.ticket_id, function (res) {
          callback({type:'add_ticket_method', ticket_id:store.ticket_id, filename:store.filename, methodname:store.methodname}, store.pid);
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
            }, success, update.pid);
          } else {
            callback({
              type: 'ticket_moved',
              ticket_id: "Maxticketlimitreached"
            }, true, null);
          }
        });
        break;

      case 'ticket_info':
        db.updateTicketDesc(update['pid'], update['ticket'], update['new_description'], function (info) {
          callback({type:'ticket_info', ticket_id:update.ticket.ticket_id, desc:update.new_description, col:update.ticket.col} ,
          true, update.pid);
        });
        break;

      case 'column_title':
        db.updateColumnTitle(update['cid'], update['pid'], update['new_title'], function (info) {
          callback({type:'column_title', cid:update.cid, pid:update.pid, title:update.new_title},
              true, update.pid);
        });
        break;

      case 'ticket_deadline':
        db.updateTicketDeadline(update['pid'], update['ticket'], update['deadline'], function (info) {
          callback({type:'ticket_deadline', ticket_id:update.ticket.ticket_id, deadline:update.deadline, col:update.ticket.col} ,
              true, update.pid);
        });
        break;
      case 'column_moved' :
        db.moveColumn(update['pid'], update['cid'], update['from'], update['to'], function (success) {
          db.getKanban(update['pid'], function (kanban) {
            callback({type:'column_moved', object:kanban}, success, update.pid);
          });
        });
        break;
      case 'column_limit' :
        db.updateColumnLimit(update['pid'], update['cid'], update['limit'], function (success) {
            callback({type: 'column_limit', pid: update['pid'], cid: update['cid'], limit: update['limit']},
                success, update.pid);
        });
        break;
      case 'gh_url' :
        //Sends it to code server
        set_gh_url(update.pid, update.gh_url);
        //Updates project_table
        db.updateGHURl(update.pid, update.gh_url, function (success) {
          callback({type : 'gh_url', pid : update.pid, url : update.gh_url}, success, update.pid);
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
              callback({type: 'ticket_remove', pid: remove.pid, ticket_id: remove.ticket_id}, remove.pid);
            }
        );
        break;
      case 'column_remove':
        db.deleteColumn(remove.pid, remove.column_id, remove.column_position, function (success) {
          console.log("Delete column success: " + success);
          db.getKanban(remove['pid'], function (kanban) {
            callback({type:'column_remove', object:kanban}, remove.pid);
          });
        });
        break;
      case 'project_remove':
        db.deleteProject(remove.pid, function (success) {
          callback({type:'project_remove', pid:remove.pid}, null);
        });
        break;
      case 'user_remove' :
        db.removeUser(remove.pid, remove.username, function(success) {
          db.getKanban(remove['pid'], function (kanban) {
            callback({type:'user_remove', object:kanban}, remove.pid);
          });
        });
        break;
      case "userOfProject_remove" :
        db.removeUserFromProject(remove.username, remove.pid, function (success) {
          db.getKanban(remove['pid'], function (kanban) {
            callback({type: 'userOfProject_remove', object: kanban}, remove.pid);
          });
        });
        break;
      case "userOfTicket_remove" :
        db.removeUserFromTicket(remove.username, remove.pid, remove.tid, function(success) {
          db.getKanban(remove['pid'], function (kanban) {
            callback({type:'userOfTicket_remove', object:kanban}, remove.pid);
          });
        });
        break;
      case 'remove_ticket_method':
        db.removeMethodFromTicket(remove.pid, remove.filename, remove.methodname, remove.ticket_id, function (res) {
          callback({type:'remove_ticket_method', ticket_id:remove.ticket_id,
            filename:remove.filename, methodname:remove.methodname}, remove.pid);
        });
        break;
      default:
        //TODO: Handle unknown update.
        break;
    }
  };

}

module.exports.start_server = start_server;
module.exports.stop_server = stop_server;

function start_server (port) {

  express.get('/\*', app.handleFileConnection);

  io_client.on('connection', app.handleConnection);
  socket_code.on('connect', function () {
    console.log("Connected to code server");

    socket_code.on('set_gh_url', function (reply) {
      io_client.sockets.in(reply.pid).emit('set_gh_url');
    });
  });
  if (!module.parent) {
    http.listen(port);
    console.log("HTTP server listening on port " + port + " at localhost.");
  }
}

function stop_server() {
  io_client.close();
  console.log('Server was closed');
}

function set_gh_url(pid, gh_url) {
  var requestobj = JSON.stringify({type:'set_gh_url', pid:pid, gh_url:gh_url});
  console.log("sent gh request " + requestobj);
  socket_code.emit('request', requestobj);
}
