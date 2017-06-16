var editcodescope;

app.controller('ApplicationCtrl', function($scope, $location, socket) {
  $scope.projects = [];
  $scope.project = undefined;
  $scope.pid = undefined;
  $scope.l = $location;

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

      socket.on('requestreply', function(reply_string) {
        let reply = JSON.parse(reply_string);
        if (reply.type === 'file_methods') {
          editcodescope.server_response['methodnames'] = reply.object;
        }
      });

      socket.on('requestreply', function(reply_string) {
        let reply = JSON.parse(reply_string);
        if (reply.type === 'project_files') {
          editcodescope.server_response['filenames'] = reply.object;
        }
      });

      socket.on('storereply', function(reply_string) {
        let reply = JSON.parse(reply_string);

        if (reply.type === 'add_ticket_method') {
          let tid = reply.ticket_id;
          let filename = reply.filename;
          let methodname = reply.methodname;
          let endline = reply.endline;
          let startline = reply.startline;

          let methodObject = {methodname: methodname, startline: startline, endline:endline};

          if (filename in editcodescope.getTicket(tid).codeData) {
            editcodescope.getTicket(tid).codeData[filename]['methods'].push(methodObject);
          } else {
            let url = reply.fileurl;
            editcodescope.getTicket(tid).codeData[filename] = {};
            editcodescope.getTicket(tid).codeData[filename]['methods'] = [methodObject];
            editcodescope.getTicket(tid).codeData[filename]['download_url'] = url;
          }
        }
      });

      socket.on('removereply', function(reply_string) {
        let reply = JSON.parse(reply_string);

        if (reply.type === 'remove_ticket_method') {
          let tid = reply.ticket_id;
          let filename = reply.filename;
          let methodname = reply.methodname;

          if (filename in editcodescope.getTicket(tid).codeData) {
            editcodescope.removeMethodT(editcodescope.getTicket(tid).codeData, filename, methodname);
          }
        }
      });

        printSocketStatus();
    }



    function sendKanbanRequest(pid) {
      socket.emit('leaveroom', get_kanban_scope().pid);
      socket.emit('joinroom', pid);
      sendKanbanRequestHelper(pid);
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
      var request_data = reply.object;

      switch (type) {
        case "tickets" : {
          if(get_kanban_scope().project !== undefined){
          generateTickets(request_data.tickets);
        }
          break;
        }
        case "kanban" : {
          console.log("kanban request handled");
          generate_kanban(request_data);
          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          generate_other_user_kanbans();
          getProjectUsers(socket, get_kanban_scope().pid);
          break;
        }
        case "user_projects" : {
          let projects = reply.object;
          //Generates/updates projects and other_projects variables.
          generate_user_kanbans(projects, socket);
          break;
        }
        case "user_tickets": {
          var tickets = reply.object.tickets;
          break;
        }
        case "ticket_users": {
          let users = reply.object.users;
          let tid = reply.object.tid;
          get_kanban_scope().project.tickets[tid].members = users;
          break;
        }
        case "add_user_to_ticket": {

          break;
        }
        case "user_new" : {
          if (reply.success) {
            get_kanban_scope().l.path('/home');
          } else {
            get_kanban_scope().l.path('/login');
          }
          break;
        }
        case "user_check" : {
          if (reply.result) {
            get_kanban_scope().l.path('/home');
          } else {
            get_kanban_scope().l.path('/login');
          }
          break;
        }
        case "project_users" : {
          let users = reply.object.users;
          if(get_kanban_scope().project !== undefined){
          get_kanban_scope().project.members = users;
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
