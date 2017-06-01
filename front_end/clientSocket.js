var URL = "http:/kankan.uk";
var socket = null;

function initiateSocket() {
    socket = io(URL);

    //Set listener events
    socket.on('connect', function(){
        alert("Successfully connected");
    });
    socket.on('event', function(data){});

    socket.on('disconnect', function(){
        alert("Disconnected from " + URL);
    });
    
    socket.on('requestreply', function(obj) {
        alert(obj);
    });
}

function socketConnect() {
    socket.connect(URL, 80);
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
