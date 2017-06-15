var users = {};
var userpics = {
  "yianni": "yianni.jpg",
  "thomas": "tom_derp.jpg",
  "Dennis": "Dennis.jpg",
  "harry": "harry.jpg"
};

app.controller('HomeController', function($scope, $location, socket) {

  console.log("start projects is " + JSON.stringify($scope.projects));


  socket.on('requestreply', function(reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "tickets") {
      console.log("ticket reply");

      let title = $scope.projects[reply.object.pid].title;
      let gh_url = $scope.projects[reply.object.pid].gh_url;
      let project = new Project(reply.object.pid);
      project.tickets = reply.object.tickets;
      project.title = title;
      project.gh_url = gh_url;
      $scope.projects[reply.object.pid] = project;
      $scope.showDeadlines(project);

    } else if (reply.type === "project_users") {
      console.log("made new " + reply.object.pid);
    }
  });
  socket.on('requestreply', function(reply_string) {

    let reply = JSON.parse(reply_string);

    if (reply.type === "project_users") {

      console.log("catching project users");
      console.log("project users reply is " + JSON.stringify(reply));

      let project = $scope.projects[reply.object.pid];

      project.members = reply.object.users;
      if (!('users' in project)) {
        project.users = {};
      }

      for (var memberid in project.members) {
        let member = project.members[memberid];

        console.log("users member is " + JSON.stringify(users[member]));

        if (users[member] === {} || users[member] === undefined) {
          console.log("adding " + member);

          let profilepic = userpics[member];

          users[member] = new User(member, profilepic);
          users[member].addProject(reply.object.pid);
          //project.users[users[member].username] = users[member];


        } else {
          //add project to that of the users?
        }

        if(project.users[member] === undefined){
          project.addUser(users[member]);
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

  socket.on('requestreply', function (reply_string) {
    var reply = JSON.parse(reply_string);
    if (reply.type === "user_projects") {
      let projects = reply.object;
      generate_user_kanbans(projects, socket);
    } else if (reply.type === "tickets") {
      if(project !== undefined){
        generateTickets(reply.object.tickets);
      }
    } else if (reply.type === "project_users") {
      let users = reply.object.users;
      if (project !== undefined) {
        project.members = users;
      }
    }
  });



  function generate_user_kanbans(projects, socket) {
    let projectsH = {};

    for (let proj in projects) {
      projectsH[projects[proj].project_id] = projects[proj];
      sendTicketsRequest(socket, projects[proj].project_id);
      getProjectUsers(socket, projects[proj].project_id);

    }

    projects = projectsH;
  }

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

  socket.on('removereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "project_remove") {
      //Kick out of kanban view, take back to home page?
      var pid = reply.pid;
      var currentpath = $location.path();
      if (currentpath === '/kanban' && get_kanban_scope().pid === pid) {
        $location.path('/home');
      }
      delete $scope.projects[pid];
    }
  });

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
  };

  socket.on('storereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "project_new") {
      let pid = reply.object;
      addUserToProject(socket, $scope.username, pid);
    }
  });
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

