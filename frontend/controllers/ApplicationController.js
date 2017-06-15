app.controller('ApplicationCtrl', function($scope, $location, socket) {
  $scope.projects = [];

  socket.on('connect', function () {
    setOnEvents();
    function setOnEvents() {
      socket.on('disconnect', function () {
        alert("Disconnected");
      });

      socket.on('requestreply', function (reply) {
        requestHandler(socket, JSON.parse(reply));
      });

      socket.on('updatereply', function (reply) {
        updateHandler(socket, JSON.parse(reply));
      });

      socket.on('storereply', function (reply) {
        storeHandler(socket, JSON.parse(reply));
      });

      socket.on('removereply', function (reply) {
        removeHandler(socket, JSON.parse(reply));
      });

      printSocketStatus();
    }

    function printSocketStatus() {
      if (isSocketConnected()) {
        console.log("Client has successfully connected");
      } else {
        console.log("Not connected");
      }
    }

    //check socket status
    function isSocketConnected() {
      return socket.connected;
    }

    function requestHandler(socket, reply) {
      var type = reply.type;

      switch (type) {
        case "user_new" : {
          if (reply.success) {
            $location.path('/home');
          } else {
            $location.path('/login');
          }
          break;
        }
        case "user_check" : {
          if (reply.result) {
            $location.path('/home');
          } else {
            $location.path('/login');
          }
          break;
        }
      }
    }

    function removeHandler(socket, reply) {
      let type = reply.type;
      switch (type) {
        case "project_remove" : {
          //Kick out of kanban view, take back to home page?
          var pid = reply.pid;
          var currentpath = get_kanban_scope().l.path();
          if (currentpath === '/kanban' && get_kanban_scope().pid === pid) {
            get_kanban_scope().l.path('/home');
          }
          delete get_kanban_scope().projects[pid];
          break;
        }
        case "column_remove" : {
          generate_kanban(reply.object);

          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          break;
        }
        case "ticket_remove": {
          let ticket_id = reply.ticket_id;
          let project_id = reply.pid;
          if (project_id == get_kanban_scope().pid) {
            delete_ticket(ticket_id);
          } else {
            console.error("Getting deletion info for different project.")
          }
          break;
        }
        case "user_remove" : {

          break;
        }
        case "userOfTicket_remove" : {
          //remove a user from a ticket
          generate_kanban(reply.object);

          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          break;
        }
        case "userOfProject_remove" : {
          break;
        }
      }
    }

    function updateHandler(socket, reply) {

      let scope = get_kanban_scope();
      let type = reply.type;
      switch (type) {
        case "ticket_moved" : {
          if (reply.ticket_id !== "Maxticketlimitreached") {
            move_tickets(reply.to_col, reply.from_col, reply.ticket_id);
          } else {
            console.log("Max ticket limit reached for this column ");
            alert("Cannot move ticket. Ticket limit reached.")
          }
          break;
        }
        case "ticket_info" : {
          let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
          ticket.setDesc(reply.desc);
          break;
        }
        case "ticket_deadline" : {
          let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
          ticket.setDeadline(reply.deadline);
          break;
        }
        case "column_moved" : {
          generate_kanban(reply.object);

          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          break;
        }
        case "column_title" : {
          let pid = reply.pid;
          let cid = reply.cid;
          let title = reply.title;
          get_kanban_scope().project.columns[cid].title = title;
          break;
        }
        case "column_limit" : {
          let cid = reply.cid;
          let pid = reply.pid;
          let limit = reply.limit;
          let column = get_kanban_scope().project.columns[cid];
          column.limit = limit;
          break;
        }
        case "gh_url" : {
          let pid = reply.pid;
          let url = reply.url;
          break;
        }
      }

    }

    function storeHandler(socket, reply) {
      let type = reply.type;
      switch (type) {
        case "ticket_new" : {
          let ticket_info = reply.object;
          if (ticket_info.tid !== "Maxticketlimitreached") {
            addTicket(ticket_info.column_id, ticket_info.tid, ticket_info.desc, null, {});
          } else {
            console.log("Max ticket limit reached for this column ");
          }
          break;
        }

        case "column_new": {
          let col_info = reply.object;
          addColumn(col_info.column_name, col_info.position, col_info.cid);
          function addColumn(title, position, id) {
            let scope = get_kanban_scope();
            let column = new Column(id, title, position);
            scope.project.columns[id] = column;
            scope.project.column_order[position] = id;
          }


          break;
        }

        case "project_new": {
          var pid = reply.object;
          addUserToProject(socket, get_kanban_scope().username, pid);
          break;
        }
        case "new_user_project": {
          getUserProjects(socket, get_kanban_scope().username);
          break;
        }

      }
    }
  });
});
