var users = {};
var userpics = {
  "yianni": "yianni.jpg",
  "thomas": "tom_derp.jpg",
  "Dennis": "Dennis.jpg",
  "harry": "harry.jpg"
};

app.controller('HomeController', function($scope, $location, socket, currentProject, user) {

  $scope.projects = {};

  if (user.get() === null) {
    $location.path('/login');
  } else {
    users = {};
    //userpics = {"yianni": "yianni.jpg","thomas": "tom.jpg"};
    getUserProjects(socket, user.get().username);
  }

  socket.on('requestreply', function (reply_string) {
      let reply = JSON.parse(reply_string);

      if (reply.type === "kanban") {

        var request_data = reply.object;
        console.log("kanban request handled");
        currentProject.set(generate_kanban(request_data));
        //Send for tickets, once received kanban.
        sendTicketsRequest(socket, currentProject.get().project_id);
        generate_other_user_kanbans();
        getProjectUsers(socket, currentProject.get().project_id);

      } else if (reply.type === "project_users") {

        console.log("project users reply");

        console.log("reply for project users was " + JSON.stringify(reply));

        let users = reply.object.users;
        let pid = reply.object.pid;
        $scope.projects[pid].users = {};

        for(user in users){
          let username = users[user];

          console.log("user is " + username);

          $scope.projects[pid].users[username] = new User(username);
          $scope.projects[pid].users[username].image = userpics[username];


        }

        console.log("projects users is " + $scope.projects[pid].users);


      } else if (reply.type === "user_projects") {

        console.log("reply was user projects");

        let projects = reply.object;
        generate_user_kanbans(projects, socket);

      } else if (reply.type === "tickets") {

        console.log("Received Ticket request");

        if (currentProject.get() !== null) {
          console.log("current project not null");

          generateTickets(reply.object.tickets, currentProject);
          $location.path('/kanban');

        }else{
          console.log("sort upcoing");
          console.log("tickets is " + JSON.stringify(reply.object.tickets));
          $scope.projects[reply.object.pid].tickets = reply.object.tickets;
          $scope.showDeadlines($scope.projects[reply.object.pid]);

        }
      }
      /*else if (reply.type === "project_users") {
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
      //projectsH[projects[proj].project_id] = projects[proj];
      //sendTicketsRequest(socket, projects[proj].project_id);
      //getProjectUsers(socket, projects[proj].project_id);

      //$scope.projects[projects[proj].project_id] = new Project(projects[proj].project_id);
      $scope.projects[projects[proj].project_id] = projects[proj];
      getProjectUsers(socket, projects[proj].project_id);
      //sendTicketsRequest(socket, projects[proj].project_id);


    }

    //$scope.projects = projectsH;

    console.log("scope projects is " + JSON.stringify($scope.projects));
  }

  //sendAllProjectUserRequest()
  //Do this because the other one is dependend on get kanban scope


  $scope.chooseProject = function(proj_id) {
    console.log("Hit choose project");
    socket.emit('joinroom', proj_id);
    sendKanbanRequest(socket, proj_id);
  };

  $scope.deleteProject = function(proj_id) {
    removeProject(socket, proj_id)
  };

  $scope.logOut = function() {
    $location.path('/login');
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
    getProjectUsers(socket, items.project_id);
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
