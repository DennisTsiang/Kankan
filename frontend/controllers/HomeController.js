var users = {};
var userpics = {
  "yianni": "yianni.jpg",
  "thomas": "tom_derp.jpg",
  "Dennis": "Dennis.jpg",
  "harry": "harry.jpg"
};

app.controller('HomeController', function($scope, $location, socket, currentProject, user) {

  if (user.get() === null) {
    $location.path('/login');
  } else {
    users = {};
    userpics = {"yianni": "yianni.jpg","thomas": "tom.jpg"};
    getUserProjects(socket, user.get().username);
  }

  socket.on('requestreply', function(reply_string) {
    let reply = JSON.parse(reply_string);
    /*if (reply.type === "tickets") {

      let title = $scope.projects[reply.object.pid].title;
      let gh_url = $scope.projects[reply.object.pid].gh_url;
      let project = new Project(reply.object.pid);
      project.tickets = reply.object.tickets;
      project.title = title;
      project.gh_url = gh_url;
      $scope.projects[reply.object.pid] = project;
      $scope.showDeadlines(project);
    } else  if (reply.type === "project_users") {

      let project = $scope.projects[reply.object.pid];

      project.members = reply.object.users;
      if (!('users' in project)) {
        project.users = {};
      }

      for (var memberid in project.members) {
        let member = project.members[memberid];

        if (users[member] === {} || users[member] === undefined) {

          let profilepic = userpics[member];

          users[member] = new User(member, profilepic);
          users[member].addProject(reply.object.pid);


        } else {
          //add project to that of the users?
        }

        if(project.users[member] === undefined){
          project.users[users[member].username] = users[member];
        }
      }
    }  else */ if(reply.type === "kanban") {
      var request_data = reply.object;
      console.log("kanban request handled");
      currentProject.set(generate_kanban(request_data));
      //Send for tickets, once received kanban.
      sendTicketsRequest(socket, currentProject.get().project_id);
      generate_other_user_kanbans();
      getProjectUsers(socket, currentProject.get().project_id);
    } else if (reply.type === "user_projects") {
      let projects = reply.object;
      generate_user_kanbans(projects, socket);
    } else if (reply.type === "tickets") {
      console.log("Received Ticket request");
      if(currentProject.get() !== null){
        generateTickets(reply.object.tickets, currentProject);
        $location.path('/kanban');
      }
    } /*else if (reply.type === "project_users") {
       let users = reply.object.users;
       if (project !== undefined) {
       project.members = users;
       }
    }*/
  });

  socket.on('updatereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "gh_url") {
      let pid = reply.pid;
      let url = reply.url;
      $scope.projects[pid].gh_url = url;
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

  function generate_other_user_kanbans() {
    let other_projects = {};

    for (let proj in $scope.projects) {
      other_projects[$scope.projects[proj].project_id] = $scope.projects[proj];
    }
    delete other_projects[currentProject.get().project_id];

    $scope.other_projects = other_projects;
  }

  function generate_user_kanbans(projects, socket) {
    let projectsH = {};

    for (let proj in projects) {
      projectsH[projects[proj].project_id] = projects[proj];
      //sendTicketsRequest(socket, projects[proj].project_id);
      //getProjectUsers(socket, projects[proj].project_id);

    }

    $scope.projects = projectsH;
  }

  //sendAllProjectUserRequest()
  //Do this because the other one is dependend on get kanban scope


  $scope.chooseProject = function(proj_id) {
    console.log("Hit choose project");
    socket.emit('joinroom', proj_id);
    sendKanbanRequest(socket, proj_id, null);
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
      if (currentpath === '/kanban' && currentProject.get().project_id === pid) {
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

app.controller('NewProjectPopoverCtrl', function($scope, $sce, socket, user) {
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
      addUserToProject(socket, user.get().username, pid);
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
  console.log(items);
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
  $ctrl.url = items.gh_url;

  $ctrl.ok = function(url) {
    sendUpdateGHURL(socket, items.project_id, url);
    $uibModalInstance.close();
  };

  $ctrl.cancel = function() {
    $uibModalInstance.close();
  };
});

