app.controller('LoginController', function($scope, $location, socket) {
  $scope.a_k = get_kanban_scope();

  $scope.login = function(name) {
    get_kanban_scope().username = name;
    sendUsernameCheck(socket, name);
  };

  $scope.newUser = function(username) {
    get_kanban_scope().username = username;
    storeNewUser(socket, username);
  }
});

