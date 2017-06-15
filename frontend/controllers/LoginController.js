app.controller('LoginController', function($scope, $location, socket) {
  $scope.a_k = get_kanban_scope();

  $scope.login = function(name) {
    get_kanban_scope().username = name;
    sendUsernameCheck(socket, name);
  };

  $scope.newUser = function(username) {
    get_kanban_scope().username = username;
    storeNewUser(socket, username);
  };

  socket.on('storereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if(reply.type === "new_user_project") {
    getUserProjects(socket, get_kanban_scope().username);
    }
  });
});

