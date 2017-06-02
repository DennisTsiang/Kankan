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
    storeHandler(reply);
  });

  printSocketStatus();
  if (isSocketConnected()) {
    sendKanbanRequest(0);
    sendTicketsRequest(0);
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

function sendStoreTicket(type, pid, ticket, col) {
  var jsonString = {type:type, pid : pid, ticket : ticket, column_name : col};
  socket.emit("store", JSON.stringify(jsonString));
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

function updateHandler(reply) {
    let type = reply.type;
    switch (type) {
      case "ticket_moved" : {
        break;
      }
      case "ticket_info" : {
        break;
      }
    }
}

function storeHandler(reply) {
  let type = reply.type;
  switch (type) {
    case "newticket" : {
      break;
    }
  }
}