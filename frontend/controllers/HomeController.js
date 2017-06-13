app.controller('HomeController', function($scope, $location, socket) {
  if (get_kanban_scope().username === undefined) {
    $location.path('/login');
  } else {
    $scope.username = get_kanban_scope().username;

    getUserProjects(socket, $scope.username);
    $scope.a_k = get_kanban_scope();

    $scope.chooseProject = function(proj_id) {
      get_kanban_scope().pid = proj_id;
      $location.path('/kanban');
    };

    $scope.deleteProject = function(proj_id) {
      removeProject(socket, proj_id)
    };

    $scope.logOut = function() {
      $location.path('/login');
      //$scope.a_k = get_kanban_scope();
    }
  }
});

app.controller('NewProjectPopoverCtrl', function($scope, $sce, socket) {
  $scope.dynamicPopover = {
    templateUrl: 'NewProjectPopover.html'
  };
  $scope.newProject = function(project_name, url) {
    $scope.isOpen = false;
    sendStoreProject(socket, project_name, url);
  }
});

app.controller('ProjectDropdownCtrl', function ($scope, $sce) {

});

app.controller('AddUsersCtrl', function ($uibModal, $log, $document) {
  var $ctrl = this;
  $ctrl.animationsEnabled = true;

  $ctrl.open = function (size, project) {
    var modalInstance = $uibModal.open({
      animation: $ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'AddUsersModal.html',
      controller: 'AddUsersInstanceCtrl',
      controllerAs: '$ctrl',
      size: size,
      resolve: {
        items: function () {
          return project;
        }
      }
    });
  };
});

app.controller('AddUsersInstanceCtrl', function ($uibModalInstance, items, socket) {
  var $ctrl = this;
  $ctrl.title = items.title;

  $ctrl.ok = function () {
    $uibModalInstance.close();
  };

  $ctrl.addUser = function (username) {
    addUserToProject(socket, username, items.project_id);
  }
});

