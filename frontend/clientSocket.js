let socket = null;

function initiateConnection() {
  //Set listener events
  socket = io();
  socket.on('connect', function () {
    setOnEvents()
  });
}

function setOnEvents() {
  socket.on('disconnect', function(){
    alert("Disconnected");
  });

  socket.on('requestreply', function(reply) {
    requestHandler(JSON.parse(reply));
  });

  socket.on('updatereply', function(reply){
    updateHandler(JSON.parse(reply));
  });

  socket.on('storereply', function(reply){
    storeHandler(JSON.parse(reply));
  });

  socket.on('removereply', function(reply) {
    removeHandler(JSON.parse(reply));
  });

  printSocketStatus();
}

function sendKanbanRequest(pid) {
  socket.emit('leaveroom', get_kanban_scope().pid);
  socket.emit('joinroom', pid);
  sendKanbanRequestHelper(pid);
}


function printSocketStatus(){
  if (!socket.connected) {
    console.log("Not connected");
  } else {
    console.log("Client has successfully connected");
  }
}

//check socket status
function isSocketConnected() {
  return socket.connected;
}

function sendKanbanRequestHelper(pid) {
  var ticketObj = {type : "kanban", pid : pid};
  socket.emit("request", JSON.stringify(ticketObj));
}

function sendTicketsRequest(pid) {
  var ticketObj = {type : "tickets", pid : pid};
  socket.emit("request", JSON.stringify(ticketObj));
}

function sendTicketUpdateMoved(ticket, pid, to, from) {
  var jsonString = {type: 'ticket_moved', ticket: ticket, pid : pid,
    to : to, from : from};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendColumnUpdateMoved(pid, cid, to, from) {
  var jsonString = {type: 'column_moved', pid : pid, cid: cid,
    to : to, from : from};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendColumnUpdateLimit(pid, cid, newlimit) {
  var jsonString = {type: 'column_limit', pid : pid, cid: cid,
    limit : newlimit};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateDesc(ticket, pid, desc) {
  var jsonString = {type: "ticket_info", ticket: ticket, pid : pid, new_description : desc};
  socket.emit("update", JSON.stringify(jsonString));
}

function updateColumnTitle(cid, pid, title) {
  var jsonString = {type: "column_title", cid:cid, pid:pid, new_title:title};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateDeadline(ticket, pid, deadline) {
  var jsonString = {type: "ticket_deadline", ticket: ticket, pid : pid, deadline : deadline};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendStoreTicket(pid, col_id) {
  let jsonString = {type:'ticket_new', pid : pid, column_id: col_id};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreProject(project_name, url) {
  var jsonString = {type:'project_new', project_name:project_name, project_url: url};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreColumn(pid, column_name, position) {
  var jsonString = {type:'column_new', pid:pid, column_name:column_name, position:position};
  socket.emit("store", JSON.stringify(jsonString));
}

function storeNewUser(username) {
  var jsonString = {type: 'user_new', username:username};
  socket.emit("request", JSON.stringify(jsonString));
}

function removeProject(pid) {
  var jsonString = {type:'project_remove', pid:pid};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeColumn(pid, column_id, column_position) {
  var jsonString = {type:'column_remove', pid:pid, column_id:column_id, column_position: column_position};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeTicket(pid, ticket_id) {
  var jsonString = {type:'ticket_remove', pid:pid, ticket_id:ticket_id};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeUser(pid, username) {
  var jsonString = {type : 'user_remove', pid:pid, username:username};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeUserFromProject(pid, username) {
  var jsonString = {type : 'userOfProject_remove', pid:pid, username:username};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeUserFromTicket(pid, username, tid) {
  var jsonString = {type : 'userOfTicket_remove', pid:pid, username:username, tid:tid};
  socket.emit("remove", JSON.stringify(jsonString));
}

function getUserProjects(username, pid) {
  var jsonString = {type:'user_projects', username : username, pid : pid};
  socket.emit("request", JSON.stringify(jsonString));
}

function addUserToProject(username, pid) {
  var jsonString = {type:'new_user_project', username : username, pid : pid};
  socket.emit("store", JSON.stringify(jsonString));
}

function addUserToTicket(username, pid, tid) {
  var jsonString = {type:'add_user_to_ticket', username : username, pid : pid, tid : tid};
  socket.emit("request", JSON.stringify(jsonString));
}

function getTicketUsers(pid, tid) {
  var jsonString = {type:'ticket_users', pid : pid, tid : tid};
  socket.emit("request", JSON.stringify(jsonString));
}

function getUserTickets(username, pid) {
  var jsonString = {type:'user_tickets', pid : pid, username : username};
  socket.emit("request", JSON.stringify(jsonString));
}

function sendUsernameCheck(username) {
  var jsonString = {type: 'user_check', username : username};
  socket.emit("request", JSON.stringify(jsonString));
}

function getProjectUsers(pid) {
  var jsonString = {type : 'project_users', pid:pid};
  socket.emit("request", JSON.stringify(jsonString));
}

function requestHandler(reply) {
  var type = reply.type;
  var request_data = reply.object;
  switch (type) {
    case "tickets" : {
      generateTickets(request_data);
      break;
    }
    case "kanban" : {
      generate_kanban(request_data);
      //Send for tickets, once received kanban.
      sendTicketsRequest(get_kanban_scope().pid);
      generate_other_user_kanbans();
      getProjectUsers(get_kanban_scope().pid);
      break;
    }
    case "user_projects" : {
      let projects = reply.object;
      //Generates/updates projects and other_projects variables.
      generate_user_kanbans(projects);
      break;
    }
    case "user_tickets": {
      var tickets = reply.object;
      break;
    }
    case "ticket_users": {
      let users = reply.object.users;
      let tid = reply.object.tid;
      get_kanban_scope().project.tickets[tid].members = users;
      get_kanban_scope().$apply();
      break;
    }
    case "add_user_to_ticket": {

      break;
    }
    case "user_new" : {
      if (reply.success) {
        get_kanban_scope().l.path('/home');
        get_kanban_scope().$apply();
      } else {
        get_kanban_scope().l.path('/login');
      }
      break;
    }
    case "user_check" : {
      if (reply.result) {
        get_kanban_scope().l.path('/home');
        get_kanban_scope().$apply();
      } else {
        get_kanban_scope().l.path('/login');
      }
      break;
    }
    case "project_users" : {
      let users = reply.object;
      get_kanban_scope().project.members = users;
      get_kanban_scope().$apply();
      break;
    }
  }
}

function removeHandler(reply) {
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
      get_kanban_scope().$apply();
      break;
    }
    case "column_remove" : {
      generate_kanban(reply.object);

      //Send for tickets, once received kanban.
      sendTicketsRequest(get_kanban_scope().pid);
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
      break;
    }
    case "userOfProject_remove" : {
      break;
    }
  }
}

function updateHandler(reply) {

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
      scope.$apply();
      break;
    }
    case "ticket_deadline" : {
      let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
      ticket.setDeadline(reply.deadline);
      scope.$apply();
      break;
    }
    case "column_moved" : {
      generate_kanban(reply.object);

      //Send for tickets, once received kanban.
      sendTicketsRequest(get_kanban_scope().pid);
      break;
    }
    case "column_title" : {
      let pid = reply.pid;
      let cid = reply.cid;
      let title = reply.title;
      get_kanban_scope().project.columns[cid].title = title;
      get_kanban_scope().$apply();
    }
    case "column_limit" : {
      let cid = reply.cid;
      let pid = reply.pid;
      let limit = reply.limit;
      let column = get_kanban_scope().project.columns[cid];
      column.limit = limit;
      get_kanban_scope().$apply();
    }
  }

}

function storeHandler(reply) {
  let type = reply.type;
  switch (type) {
    case "ticket_new" : {
      let ticket_info = reply.object;
      if (ticket_info.tid !== "Maxticketlimitreached") {
        addTicket(ticket_info.column_id, ticket_info.tid, reply.desc);
      } else {
        console.log("Max ticket limit reached for this column ");
      }
      break;
    }

    case "column_new": {
      let col_info = reply.object;
      addColumn(col_info.column_name, col_info.position, col_info.cid);
      break;
    }

    case "project_new": {
      var pid = reply.object;
      addUserToProject(get_kanban_scope().username, pid);
      break;
    }
    case "new_user_project": {
      getUserProjects(get_kanban_scope().username);
      break;
    }

  }
}
