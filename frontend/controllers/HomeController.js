var users;
var userpics;


app.controller('HomeController', function($scope, $location, socket) {


  socket.on('requestreply', function(reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "tickets") {

      $scope.projects[reply.object.pid].tickets = reply.object.tickets;

      $scope.showDeadlines($scope.projects[reply.object.pid]);
    } else if (reply.type === "project_users") {

      console.log("catching project users");
      console.log("reply is " + JSON.stringify(reply));

      let project = $scope.projects[reply.object.pid];

      project.members = reply.object.users;
      if (!('users' in project)) {
        project.users = {};
      }

      for (var memberid in project.members) {
        let member = project.members[memberid];

        console.log("member is " + member);

        if (users[member] === undefined) {

          console.log("adding new user");

          let profilepic = userpics[member];
          console.log("profilepic is " + profilepic);

          users[member] = new User(member, profilepic);
          users[member].addProject(reply.object.pid);
          project.users[users[member].username] = users[member];

          console.log("project users now is " + JSON.stringify(project.users));
          console.log("users is " + JSON.stringify(users));


        } else {
          //add project to that of the users?
        }

      }
    }
  });


  $scope.showDeadlines = function(project) {

    project.upcomingDeadlines = [];

    for (tickethash in project.tickets) {
      let ticket = project.tickets[tickethash];

      if (ticket.datetime != null) {
        ticket.deadlineActive = true;
      }

      if (ticket.deadlineActive) {
        project.upcomingDeadlines.push(ticket);
      }
    }
  };

  if (get_kanban_scope().username === undefined) {
    $location.path('/login');
  } else {
    $scope.username = get_kanban_scope().username;
    users = {};
    userpics = {"yianni": "yianni.jpg","thomas": "tom.jpg"};
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

app.controller('DropdownCtrl', function($uibModal, $log, $document) {
  var $ctrl = this;
  $ctrl.animationsEnabled = true;

  $ctrl.openAddUsers = function(size, project) {
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

  $ctrl.openDeleteProject = function(size, project) {
    var modalInstance = $uibModal.open({
      animation: $ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'DeleteProjectModal.html',
      controller: 'DeleteProjectInstanceCtrl',
      controllerAs: '$ctrl',
      size: size,
      resolve: {
        items: function() {
          return project;
        }
      }
    });
  };

  $ctrl.openEditURL = function(size, project) {
    var modalInstance = $uibModal.open({
      animation: $ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'EditURLModal.html',
      controller: 'EditURLInstanceCtrl',
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

app.controller('DeleteProjectInstanceCtrl', function($uibModalInstance, items, socket) {
  var $ctrl = this;
  $ctrl.title = items.title;

  $ctrl.ok = function() {
    removeProject(socket, items.project_id);
    $uibModalInstance.close();
  };

  $ctrl.cancel = function() {
    $uibModalInstance.close();
  };
});

app.controller('EditURLInstanceCtrl', function($uibModalInstance, items, socket) {
  var $ctrl = this;
  $ctrl.title = items.title;
  if ('gh_url' in items) {
    $ctrl.url = items.gh_url;
  } else {
    $ctrl.url = null;
  }

  $ctrl.ok = function(url) {
    sendUpdateGHURL(socket, items.project_id, url);
    $uibModalInstance.close();
  };

  $ctrl.cancel = function() {
    $uibModalInstance.close();
  };
});

