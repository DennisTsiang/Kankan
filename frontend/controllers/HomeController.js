app.controller('HomeController', function($scope, $location, socket) {


  $scope.showDeadlines = function(project) {

    project.upcomingDeadlines = [];
    console.log("project is " + project.project_id);
    console.log("tickets is " + JSON.stringify(project.tickets));


    for(tickethash in project.tickets){
      let ticket = project.tickets[tickethash];

      console.log("pushing " + ticket.desc + " for " + ticket.datetime);
      if(ticket.datetime != null){
        ticket.deadlineActive = true;

      }


      if(ticket.deadlineActive){
        project.upcomingDeadlines.push(ticket);
      }


    }




  }


  socket.on('requestreply', function(reply_string) {
    let reply = JSON.parse(reply_string);
    console.log("got reply");
    if (reply.type === "tickets") {
      console.log("set");

      $scope.projects[reply.object.pid].tickets = reply.object.tickets;

      $scope.showDeadlines($scope.projects[reply.object.pid]);


    }
  });

  if (get_kanban_scope().username === undefined) {
    $location.path('/login');
  } else {
    $scope.username = get_kanban_scope().username;

    getUserProjects(socket, $scope.username);
    $scope.a_k = get_kanban_scope();

  }

  //sendAllProjectUserRequest()
  //Do this because the other one is dependend on get kanban scope


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

app.controller('ProjectDropdownCtrl', function($scope, $sce) {

});

app.controller('AddUsersCtrl', function($uibModal, $log, $document) {
  var $ctrl = this;
  $ctrl.animationsEnabled = true;

  $ctrl.open = function(size, project) {
    var modalInstance = $uibModal.open({
      animation: $ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'AddUsersModal.html',
      controller: 'AddUsersInstanceCtrl',
      controllerAs: '$ctrl',
      size: size,
      resolve: {
        items: function() {
          return project;
        }
      }
    });
  };
});

app.controller('AddUsersInstanceCtrl', function($uibModalInstance, items, socket) {
  var $ctrl = this;
  $ctrl.title = items.title;

  $ctrl.ok = function() {
    $uibModalInstance.close();
  };

  $ctrl.addUser = function(username) {
    addUserToProject(socket, username, items.project_id);
  }
});
