var socket = null;

function initiateSocket($scope, s_socket) {
  //Set listener events
  socket = s_socket;
  setOnEvents($scope)
}

function setOnEvents($scope) {
  console.log("Connected");

  socket.on('disconnect', function(){
    alert("Disconnected");
  });

  socket.on('requestreply', function(reply) {
    requestHandler($scope, JSON.parse(reply));
  });

  socket.on('updatereply', function(reply){
    updateHandler($scope, JSON.parse(reply));
  });

  socket.on('storereply', function(reply){
    storeHandler($scope, reply);
  });

  printSocketStatus($scope);
  if (isSocketConnected($scope)) {
    //move in here line below
  }
  sendTicketsRequest($scope, 0);
}

function printSocketStatus($scope){
  if (!socket.connected) {
    console.log("Not connected");
  } else {
    console.log("Client has successfully connected");
  }
}

//check socket status
function isSocketConnected($scope) {
  return socket.connected;
}

function sendTicketsRequest($scope, pid) {
  var ticketObj = {type : "tickets", pid : pid};
  socket.emit("request", JSON.stringify(ticketObj));
}

function sendTicketUpdateMoved(ticket, pid, to, from) {
  console.log(to);
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

function requestHandler($scope, reply) {
  var type = reply.type;
  var request_data = reply.object;
  switch (type) {
    case "tickets" : {
      generateTickets($scope, request_data);
      break;
    }
    case "kanban" : {
      generate_kanban($scope, request_data);
      break;
    }
  }
}

function updateHandler($scope, reply) {
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

function storeHandler($scope, reply) {
  let type = reply.type;
  switch (type) {
    case "newticket" : {
      break;
    }
  }
}