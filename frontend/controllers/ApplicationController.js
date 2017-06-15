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
  });
});
