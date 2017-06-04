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
    sendTicketsRequest(0/*pid*/);
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

function sendTicketUpdateInfo(ticket, pid, desc) {
  var jsonString = {type: "ticket_info", ticket: ticket, pid : pid, new_description : desc};
  socket.emit("update", JSON.stringify(jsonString));
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
  var jsonString = {type:'project_remove', pid:pid, column_id:column_id};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeTicket(pid, ticket_id) {
  var jsonString = {type:'project_remove', pid:pid, ticket_id:ticket_id};
  socket.emit("remove", JSON.stringify(jsonString));
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
      break;
    }
  }
}

function removeHandler(reply) {
  //TODO FINISH REMOVE HANDLER
  let type = reply.type;
  switch (type) {
    case "project_remove" : {
      var scope = angular.element($("#kanban_table")).scope();
      break;
    }
    case "column_remove" : {
      var scope = angular.element($("#kanban_table")).scope();
      break;
    }
    case "ticket_remove": {
      var scope = angular.element($("#kanban_table")).scope();

      break;
    }
  }
}

function updateHandler(reply) {
    let type = reply.type;
    switch (type) {
      case "ticket_moved" : {
        var scope = angular.element($("#kanban_table")).scope();
        delete scope.project.columns[reply.from_col].tickets[reply.ticket_id];
        scope.project.columns[reply.to_col].tickets[reply.ticket_id]
          = scope.project.tickets[reply.ticket_id];
        scope.$apply();
        break;
      }
      case "ticket_info" : {
        var scope = angular.element($("#kanban_table")).scope();
        var ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
        ticket.setDesc(reply.desc);
        scope.$apply();
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
