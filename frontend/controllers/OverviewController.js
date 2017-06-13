app.controller('OverviewController', function($scope, $location){

  if (get_kanban_scope().username === undefined) {
    $location.path('/login');
  } else {
    $scope.username = get_kanban_scope().username;
  }

  $scope.goHome = function () {
    $location.path('/home');
  };

});
