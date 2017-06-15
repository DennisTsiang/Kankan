app.controller('LoginController', function($scope, $location, socket, user) {

  $scope.login = function(name) {
    user.set(new User(name));
    sendUsernameCheck(socket, name);
  };

  $scope.newUser = function(username) {
    user.set(new User(username));
    storeNewUser(socket, username);
  };

  socket.removeAllListeners('requestreply');
  socket.removeAllListeners('storereply');
  socket.removeAllListeners('updatereply');
  socket.removeAllListeners('removereply');

    socket.on('storereply', function (reply_string) {
      let reply = JSON.parse(reply_string);
      if (reply.type === "new_user_project") {
        getUserProjects(socket, user.get().username);
      }
    });

    socket.on('requestreply', function (reply_string) {
      let reply = JSON.parse(reply_string);

      if (reply.type === "user_new") {
        if (reply.success) {
          $location.path('/home');
        } else {
          $location.path('/login');
        }
      } else if (reply.type === "user_check") {
        if (reply.result) {
          $location.path('/home');
        } else {
          $location.path('/login');
        }
      }
    });
});

