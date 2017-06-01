var URL = "http://kankan.uk";
var socket = null;

function initiateSocket() {
    socket = io();

    //Set listener events
    socket.on('connect', function(){
        console.log("Connect event started");
    });
    socket.on('event', function(data){});

    socket.on('disconnect', function(){
        alert("Disconnected from " + URL);
    });

    socket.on('requestreply', function(obj) {
        alert(obj);
    });
}

//check socket status
function isSocketConnected() {
    if (!socket.connected) {
        console.log("Not connected");
        return false;
    } else {
        console.log("Client has successfully connected");
        return true;
    }
}

function sendTestMessage() {
    var ticketObj = {type : "tickets", pid : "0"};
    socket.emit("request", JSON.stringify(ticketObj));
}
