app.controller('ApplicationCtrl', function($scope, $location, socket) {
  $scope.projects = [];

  socket.on('connect', function () {
    setOnEvents();
    function setOnEvents() {
      socket.on('disconnect', function () {
        alert("Disconnected");
      });

      socket.on('requestreply', function (reply) {
        requestHandler(socket, JSON.parse(reply));
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

    function requestHandler(socket, reply) {
      var type = reply.type;

      switch (type) {
        case "user_new" : {
          if (reply.success) {
            $location.path('/home');
          } else {
            $location.path('/login');
          }
          break;
        }
        case "user_check" : {
          if (reply.result) {
            $location.path('/home');
          } else {
            $location.path('/login');
          }
          break;
        }
      }
    }
  });
});
