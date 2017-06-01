var URL = "http://kankan.uk";
var socket = null;

function initiateSocket() {
  socket = io();

  //Set listener events
  socket.on('connect', setOnEvents);
}

function setOnEvents() {
  console.log("Connected");
  socket.on('event', function(data){});

  socket.on('disconnect', function(){
    alert("Disconnected from " + URL);
  });

  socket.on('requestreply', function(reply) {
    requestHandler(JSON.parse(reply));
  });

  printSocketStatus();
  if (isSocketConnected()) {
    sendTestMessage();
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

function sendTestMessage() {
  var ticketObj = {type : "tickets", pid : "0"};
  socket.emit("request", JSON.stringify(ticketObj));
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