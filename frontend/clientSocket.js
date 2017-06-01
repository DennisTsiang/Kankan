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

    socket.on('updatereply', function(reply){
        updateHandler(JSON.parse(reply));
    });

    printSocketStatus();
    if (isSocketConnected()) {
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

function sendTicketsRequest(pid) {
    var ticketObj = {type : "tickets", pid : pid};
    socket.emit("request", JSON.stringify(ticketObj));
}

function sendTicketUpdateMoved(ticket, pid, to, from) {
    var jsonString = {ticket: ticket, pid : pid,
                        to : to, from : from};
    socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateInfo(ticket, pid, desc) {
    var jsonString = {ticket: ticket, pid : pid, new_description : desc};
    socket.emit("update", JSON.stringify(jsonString));
}

function requestHandler(reply) {
    var type = reply.type;
    switch (type) {
        case "tickets" : {
            generateTickets(reply.object);
            break;
        }
        case "kanban" : {

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