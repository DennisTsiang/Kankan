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

//TODO: Will change this and update handler to support deadline when backend has support
function sendTicketUpdateDesc(ticket, pid, desc) {
  var jsonString = {type: "ticket_info", ticket: ticket, pid : pid, new_description : desc};
  socket.emit("update", JSON.stringify(jsonString));
}

function updateColumnTitle(cid, pid, title) {
  var jsonString = {type: "column_title", cid:cid, pid:pid, new_title:title};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateDeadline(ticket, pid, month, year, day, hour, minute) {
  var deadline = year + " " + month + " " + day + " " + hour + " " + minute;
  var jsonString = {type: "ticket_deadline", ticket: ticket, pid : pid, deadline : deadline};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendStoreTicket(pid, col_id) {
  let jsonString = {type:'ticket_new', pid : pid, column_id: col_id};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreProject(project_name) {
  var jsonString = {type:'project_new', project_name:project_name};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreColumn(pid, column_name, position) {
  var jsonString = {type:'column_new', pid:pid, column_name:column_name, position:position};
  socket.emit("store", JSON.stringify(jsonString));
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

function getUserProjects(username, pid) {
  var jsonString = {type:'user_projects', username : username, pid : pid};
  socket.emit("request", JSON.stringify(jsonString));
}

function addUserToProject(username, pid) {
  var jsonString = {type:'new_user_project', username : username, pid : pid};
  socket.emit("request", JSON.stringify(jsonString));
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
      break;
    }
    case "user_projects" : {
      let projects = reply.object;
      //Generates/updates projects and other_projects variables.
      generate_user_kanbans(projects);

      break;
    }
    case "new_user_project": {
      getUserProjects(get_kanban_scope().username);
      break;
    }
    case "user_tickets": {
      var tickets = reply.object;
      break;
    }
    case "ticket_users": {
      var users = reply.object;

      break;
    }
    case "add_user_to_ticket": {

      break;
    }
  }
}

function removeHandler(reply) {
  let type = reply.type;
  switch (type) {
    case "project_remove" : {
      //TODO: Implement project deletion
      //Kick out of kanban view, take back to home page?
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
  }
}

function updateHandler(reply) {

  let scope = get_kanban_scope();
  let type = reply.type;
  switch (type) {
    case "ticket_moved" : {
      move_tickets(reply.to_col, reply.from_col, reply.ticket_id);
      break;
    }
    case "ticket_info" : {
      let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
      ticket.setDesc(reply.desc);
      scope.$apply();
      break;
    }
    case "ticket_deadline" : {
      console.log("reply now is " + JSON.stringify(reply));
      var deadline = reply.deadline.split(" ");
      console.log(reply.deadline);
      let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
      ticket.setDeadline(deadline[0], deadline[1], deadline[2], deadline[3], deadline[4]);
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
      var pid = reply.pid;
      var cid = reply.cid;
      var title = reply.title;
      get_kanban_scope().project.columns[cid].title = title;
      get_kanban_scope().$apply();
    }
  }

}

function storeHandler(reply) {
  let type = reply.type;
  switch (type) {
    case "ticket_new" : {
      let ticket_info = reply.object;
      addTicket(ticket_info.column_id, ticket_info.tid, reply.desc);
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
    }
  }
}
