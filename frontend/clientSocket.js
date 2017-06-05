var socket = null;

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
  if (isSocketConnected()) {
    sendKanbanRequest(0/*pid*/);
  }
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

function sendKanbanRequest(pid) {
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

//TODO: Will change this and update handler to support deadline when backend has support
function sendTicketUpdateDesc(ticket, pid, desc) {
  var jsonString = {type: "ticket_info", ticket: ticket, pid : pid, new_description : desc};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateDeadline(ticket, pid, month, year, day, hour, minute) {
  var deadline = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":00";
  var jsonString = {type: "ticket_deadline", ticket: ticket, pid : pid, deadline : deadline};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendStoreColumn(pid, cid, title, position) {
  let jsonString = {type:'column_new', pid : pid, column_id: cid, title: title, pos: position};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreTicket(type, pid, col_id) {
  let jsonString = {type:type, pid : pid, column_id: col_id};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendNewTicket(pid, col_id) {
  var jsonString = {type:'ticket_new', pid : pid, column_id: col_id};
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

function removeColumn(pid, column_id) {
  var jsonString = {type:'column_remove', pid:pid, column_id:column_id};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeTicket(pid, ticket_id) {
  var jsonString = {type:'ticket_remove', pid:pid, ticket_id:ticket_id};
  socket.emit("remove", JSON.stringify(jsonString));
}

function getUserProjects(username) {
  var jsonString = {type:'user_projects', username : username};
  socket.emit("request", JSON.stringify(jsonString));
}

function addUserToProject(username, pid) {
  var jsonString = {type:'user_projects', username : username, pid : pid};
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
      var projects = reply.object;
      break;
    }
    case "new_user_project": {

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
  //TODO FINISH REMOVE HANDLER
  let type = reply.type;
  switch (type) {
    case "project_remove" : {
      break;
    }
    case "column_remove" : {
      break;
    }
    case "ticket_remove": {
      delete_ticket(reply.ticket_id);
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
      var deadline = reply.deadline;
      var year = deadline.substring(0, 4);
      var month =  deadline.substring(5, 7);
      var day = deadline.substring(8, 10);
      var hour = deadline.substring(11, 13);
      var minute = deadline.substring(14, 16);
      console.log(year + "-" + month + "-" + day + " " + hour + ":" + minute + ":00");
      let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
      ticket.setDeadline(year, month, day, hour, minute);
      scope.$apply();
      break;
    }
    case 'ticket_delete' : {
      let ticket_id = reply.ticket_id;
      let project_id = reply.project_id;
      if (project_id == scope.pid) {
        delete_ticket(ticket_id);
      } else {
        console.error("Getting deletion info for different project.")
      }
      break;
    }
  }

}

function storeHandler(reply) {
  let type = reply.type;
  switch (type) {
    case "tickets": {//"newticket" : {
      //TODO: Right when new ticket is created we request the server makes the ticket, and it sends all the tickets
      // in the project back, like the getTickets request (hence type="tickets"). We only want the ticket that's been
      // created to be sent back.
      requestHandler(reply);
      break;
    }
  }
}
