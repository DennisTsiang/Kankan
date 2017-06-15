app.controller('ApplicationCtrl', function($scope, $location, socket) {
  $scope.projects = [];

  socket.on('connect', function () {
    setOnEvents();
    function setOnEvents() {
      socket.on('disconnect', function () {
        alert("Disconnected");
      });

      printSocketStatus();
    }

    function printSocketStatus() {
      if (isSocketConnected()) {
        console.log("Client has successfully connected");
      } else {
        console.log("Not connected");
      }
    }

    //check socket status
    function isSocketConnected() {
      return socket.connected;
    }
  });
});
