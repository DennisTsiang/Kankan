/**
 * Created by yianni on 06/06/17.
 */

let app = angular.module('Kankan', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable', 'ui.select', "ngRoute"]);

app.config(function($routeProvider) {
  $routeProvider
    .when('/login', {
      templateUrl: 'login.html',
      controller: 'LoginController'
    })
    .when('/kanban', {
      templateUrl: 'kanban.html',
    })
    .when('/home', {
      templateUrl: 'home.html',
      controller: 'HomeController'
    })
    .when('/overview', {
      templateUrl: 'overview.html',
      controller: 'OverviewController'
    })
    .otherwise({
      redirectTo: '/login'
    });
});

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

app.controller('ApplicationCtrl', function($scope, $location, socket) {
  $scope.projects = [];
  $scope.project = undefined;
  $scope.pid = undefined;

  $scope.l = $location;

  socket.on('connect', function () {
    setOnEvents();
    function setOnEvents() {
      socket.on('disconnect', function () {
        alert("Disconnected");
      });

      socket.on('requestreply', function (reply) {
        requestHandler(socket, JSON.parse(reply));
      });

      socket.on('updatereply', function (reply) {
        updateHandler(socket, JSON.parse(reply));
      });

      socket.on('storereply', function (reply) {
        storeHandler(socket, JSON.parse(reply));
      });

      socket.on('removereply', function (reply) {
        removeHandler(socket, JSON.parse(reply));
      });

      printSocketStatus();
    }

    function sendKanbanRequest(pid) {
      socket.emit('leaveroom', get_kanban_scope().pid);
      socket.emit('joinroom', pid);
      sendKanbanRequestHelper(pid);
    }


    function printSocketStatus() {
      if (isSocketConnected()) {
        console.log("Client has successfully connected");
      } else {
        console.log("Not connected");
      }
    }

    //check socket status
    function isSocketConnected() {
      return socket.connected;
    }

    function requestHandler(socket, reply) {
      var type = reply.type;
      var request_data = reply.object;
      switch (type) {
        case "tickets" : {
          generateTickets(request_data);
          break;
        }
        case "kanban" : {
          generate_kanban(request_data);
          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          generate_other_user_kanbans();
          getProjectUsers(socket, get_kanban_scope().pid);
          break;
        }
        case "user_projects" : {
          let projects = reply.object;
          //Generates/updates projects and other_projects variables.
          generate_user_kanbans(projects);
          break;
        }
        case "user_tickets": {
          var tickets = reply.object;
          break;
        }
        case "ticket_users": {
          let users = reply.object.users;
          let tid = reply.object.tid;
          get_kanban_scope().project.tickets[tid].members = users;
          break;
        }
        case "add_user_to_ticket": {

          break;
        }
        case "user_new" : {
          if (reply.success) {
            get_kanban_scope().l.path('/home');
          } else {
            get_kanban_scope().l.path('/login');
          }
          break;
        }
        case "user_check" : {
          if (reply.result) {
            get_kanban_scope().l.path('/home');
          } else {
            get_kanban_scope().l.path('/login');
          }
          break;
        }
        case "project_users" : {
          let users = reply.object;
          get_kanban_scope().project.members = users;
          break;
        }
      }
    }

    function removeHandler(socket, reply) {
      let type = reply.type;
      switch (type) {
        case "project_remove" : {
          //Kick out of kanban view, take back to home page?
          var pid = reply.pid;
          var currentpath = get_kanban_scope().l.path();
          if (currentpath === '/kanban' && get_kanban_scope().pid === pid) {
            get_kanban_scope().l.path('/home');
          }
          delete get_kanban_scope().projects[pid];
          break;
        }
        case "column_remove" : {
          generate_kanban(reply.object);

          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          break;
        }
        case "ticket_remove": {
          let ticket_id = reply.ticket_id;
          let project_id = reply.pid;
          if (project_id == get_kanban_scope().pid) {
            delete_ticket(ticket_id);
          } else {
            console.error("Getting deletion info for different project.")
          }
          break;
        }
        case "user_remove" : {

          break;
        }
        case "userOfTicket_remove" : {
          //remove a user from a ticket
          break;
        }
        case "userOfProject_remove" : {
          break;
        }
      }
    }

    function updateHandler(socket, reply) {

      let scope = get_kanban_scope();
      let type = reply.type;
      switch (type) {
        case "ticket_moved" : {
          if (reply.ticket_id !== "Maxticketlimitreached") {
            move_tickets(reply.to_col, reply.from_col, reply.ticket_id);
          } else {
            console.log("Max ticket limit reached for this column ");
            alert("Cannot move ticket. Ticket limit reached.")
          }
          break;
        }
        case "ticket_info" : {
          let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
          ticket.setDesc(reply.desc);
          break;
        }
        case "ticket_deadline" : {
          let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
          ticket.setDeadline(reply.deadline);
          break;
        }
        case "column_moved" : {
          generate_kanban(reply.object);

          //Send for tickets, once received kanban.
          sendTicketsRequest(socket, get_kanban_scope().pid);
          break;
        }
        case "column_title" : {
          let pid = reply.pid;
          let cid = reply.cid;
          let title = reply.title;
          get_kanban_scope().project.columns[cid].title = title;
        }
        case "column_limit" : {
          let cid = reply.cid;
          let pid = reply.pid;
          let limit = reply.limit;
          let column = get_kanban_scope().project.columns[cid];
          column.limit = limit;
        }
      }

    }

    function storeHandler(socket, reply) {
      let type = reply.type;
      switch (type) {
        case "ticket_new" : {
          let ticket_info = reply.object;
          if (ticket_info.tid !== "Maxticketlimitreached") {
            addTicket(ticket_info.column_id, ticket_info.tid, reply.desc);
          } else {
            console.log("Max ticket limit reached for this column ");
          }
          break;
        }

        case "column_new": {
          let col_info = reply.object;
          addColumn(col_info.column_name, col_info.position, col_info.cid);
          function addColumn(title, position, id) {
            let scope = get_kanban_scope();
            let column = new Column(id, title, position);
            scope.project.columns[id] = column;
            scope.project.column_order[position] = id;
          }


          break;
        }

        case "project_new": {
          var pid = reply.object;
          addUserToProject(socket, get_kanban_scope().username, pid);
          break;
        }
        case "new_user_project": {
          getUserProjects(socket, get_kanban_scope().username);
          break;
        }

      }
    }
  });
});


app.factory('socket', function ($rootScope) {
  let socket = io();

  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    },
    connected: function () {
      return socket.connected;
    }
  };
});

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

app.controller('KanbanCtrl', function($scope, $location, socket) {
  if (get_kanban_scope().pid === undefined) {
    $location.path('/login');
  } else {

    //Enable popovers
    $('[data-toggle="popover"]').popover();

    sendKanbanRequest(socket, get_kanban_scope().pid);

    $scope.sendKanbanRequest = function(pid) {
      sendKanbanRequest(socket, pid);
    };
  }

  $scope.goHome = function () {
    $location.path('/home');
  };

  $scope.goOverview = function(){
    $location.path('/overview');

  };

  $scope.getBorderColour = function(timeLeft, deadlineActive) {
    let css;

    if (deadlineActive) {
      if (timeLeft > 5) {
        css = {
          'border': '2px solid #26292e'

        };
      } else if(timeLeft > 2) {
        css = {
          'border': '2px solid #0000ff'
        };

      }else if(timeLeft > 1){
        css = {
          'border': '2px solid #ff9902'
        };

      }else if(timeLeft > 0.5){
        css = {
          'border': '2px solid #ff3300'
        };

      }else if(timeLeft > 0){
        css = {
          'border': '2px solid #ff0000'
        };
      }else{
        css = {
          'border': '2px solid #26292e'

        };

      }
    } else {
      css = {
        'border': '2px solid #26292e'

      };
    }
    return css;

  };

  let id = null;
  let dragSrcEl = null;
  $scope.handleTicketDragStart = function (e) {
    dragSrcEl = e.srcElement;
    e.effectAllowed = 'move';
    id = e.srcElement.id;
    e.dataTransfer.setData('text/plain', e.target.innerHTML);
  };

  $scope.handleTicketDragLeave = function (e) {
    e.toElement.style.border = "";
    $(e.toElement).closest('.ticket-column')[0].style.border = ""
  };

  $scope.handleTicketDragOver = function (e) {
    e.preventDefault();
    $(e.toElement).closest('.ticket-column')[0].style.border = "thick solid #0000FF"
  };

  $scope.handleTicketDrop = function (e) {
    e.preventDefault();

    let scope = get_kanban_scope();
    let start_col_id = scope.project.tickets[id].col;

    let cell = $(e.toElement).closest('td');
    let end_col_id = cell[0].getAttribute('cid');

    sendTicketUpdateMoved(socket, scope.project.tickets[id], get_kanban_scope().pid, end_col_id, start_col_id);

    $(e.toElement).closest('.ticket-column')[0].style.border = "";
    e.srcElement.style.border = "";
    e.toElement.style.border = "";
  };

  $scope.addBTN = function () {
    let k_scope = get_kanban_scope();

    //Get column in position 0
    sendStoreTicket(socket, k_scope.pid, k_scope.project.column_order[0]);
  };

});

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  let ctrl = this;

  ctrl.animationsEnabled = true;
  $scope.tid = -1;
  ctrl.open_ticket_editor = function(tid) {
    $scope.tid = tid;
    let modalInstance = $uibModal.open({
      animation: ctrl.animationsEnabled,
      ariaLabelledBy: 'ticket-info-title',
      ariaDescribedBy: 'ticket-info-modal-body',
      templateUrl: 'ticket-popup',
      controller: 'ModalInstanceCtrl',
      controllerAs: '$ctrl',
      windowClass: 'code-navigator-modal',
      size: 'lg',
      resolve: {

      }
    });
  };

  ctrl.open_edit_column = function() {
    let modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'edit-column-popup',
      controller: 'ModalInstanceCtrl',
      controllerAs: '$ctrl',
      size: 'lg',
      windowClass: 'edit-columns-popup',
      resolve: {

      }
    });
  };

});

var popupInstance = this;
angular.module('Kankan').controller('ModalInstanceCtrl', function($uibModalInstance) {
  let $ctrl = this;
  $ctrl.close = function() {
    $uibModalInstance.close($ctrl.selected);
  };

  $ctrl.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});

app.controller('editColumnCtrl', function($scope, socket) {
  $scope.project = get_kanban_scope().project;

  $scope.addColumn = function() {
    sendStoreColumn(socket, $scope.project.project_id, "New column", Object.keys($scope.project.columns).length);
  };

  $scope.removeColumn = function(col) {
    removeColumn(socket, $scope.project.project_id, col.column_id, col.position);
  };


  $scope.updateColTitle = function(col, title) {
    updateColumnTitle(socket, col.column_id, get_kanban_scope().pid, title);
  };

  let start_column_id;
  let drag_started = false;
  $scope.handleColumnDragStart = function (event) {
    if (!drag_started) {
      let cell = $(event.toElement).closest('table');
      start_column_id = cell[0].getAttribute('column_id');

      event.dataTransfer.setData('text/plain', event.target.innerHTML);
      event.effectAllowed = 'move';
      drag_started = true;
    }
  };

  $scope.handleColumnDragOver = function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  $scope.handleColumnDrop = function (event) {
    event.preventDefault();
    if (drag_started) {
      let cell = $(event.toElement).closest('table');
      let end_column_id = cell[0].getAttribute('column_id');

      let columns = get_kanban_scope().project.columns;
      sendColumnUpdateMoved(socket, get_kanban_scope().pid, start_column_id, columns[end_column_id].position, columns[start_column_id].position);
      drag_started = false;
    }
  };

  $scope.updateColLimitEvent = function (colId, newLimit) {
    if (isNaN(newLimit)) {
      alert("Ticket limit must be a number");
    } else {
      sendColumnUpdateLimit(socket, get_kanban_scope().pid, colId, newLimit);
    }
  };
});

app.controller('DeadlineCtrl', function ($scope) {

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

app.controller('editTicketCtrl', function($scope, socket) {

  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'addUser.html',
    title: 'Title'
  };

  $scope.getProjectMembers = function() {
    return get_kanban_scope().project.members;
  };

  $scope.isMemberAddedToTicket = function (member) {
    return getTicket(getTid()).members.includes(member);
  };

  $scope.toggleMemberToTicket = function (member) {
    if ($scope.isMemberAddedToTicket(member)) {
      //remove member
      removeUserFromTicket(socket, get_kanban_scope().pid, member, getTid());
    } else {
      //add member
      addUserToTicket(socket, member, get_kanban_scope().pid, getTid());
    }
  };

  $scope.addUser = function (username) {
    addUserToTicket(socket, username, get_kanban_scope().pid, $scope.tid);
  };

  function getTicket(id) {
    let k_scope = get_kanban_scope();
    return k_scope.project.tickets[id];
  }

  function getTid() {
    let sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  }

  $scope.saveEditDeadline = function(deadline) {
    let ticket = getTicket($scope.tid);
    ticket.deadline = deadline;
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, deadline);
    updateTicketTimes()


  };

  $scope.resetDeadline = function() {
    let ticket = getTicket($scope.tid);

    ticket.resetDeadline();
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, ticket.deadline);
  };

  $scope.saveEditDesc = function(text) {
    console.log("Called");
    let ticket = getTicket($scope.tid);
    if (ticket !== undefined) {
      sendTicketUpdateDesc(socket, ticket, get_kanban_scope().pid, text);
    }
  };

  $scope.updateTimeLeft = function() {
    let ticket = getTicket($scope.tid);
    ticket.updateTimeLeft();
  };

  $scope.today = function() {
    $scope.dt = new Date();
  };

  $scope.clear = function() {
    $scope.dt = null;
  };

  $scope.inlineOptions = {
    customClass: getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    minDate: new Date(),
    startingDay: 1
  };


  $scope.openCalendar = function() {
    $scope.popup.opened = true;
  };

  $scope.setDate = function(year, month, day) {
    $scope.dt.setFullYear(year, month, day);
  };

  $scope.popup = {
    opened: false
  };

  function getDayClass(data) {
    var date = data.date,
        mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }

  $scope.toggleMode = function () {
    $scope.ismeridian = !$scope.ismeridian;
  };

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();

  //Get users for this ticket.
  getTicketUsers(socket, get_kanban_scope().pid, getTid());

  $scope.tid = getTid();
  $scope.ticket = getTicket($scope.tid);
  $scope.desc = $scope.ticket.desc;

  $scope.format = 'yyyy-MMMM-dd';
  $scope.today();
  $scope.dt = $scope.ticket.deadline;
  $scope.hstep = 1;
  $scope.mstep = 1;
  $scope.options = {
    hstep: [1, 2, 3],
    mstep: [1, 5, 10, 15, 25, 30]
  };

  $scope.ismeridian = true;
});

app.controller('deleteTicketCtrl', function($scope, $sce, socket) {
  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'yousurebutton.html',
    title: 'Title'
  };

  $scope.delete_ticket_button_click = function(id) {
    let info_header = $('#ticket_info_title')[0];

    //DIRTY - done to close modal.
    $scope.$parent.$close();

    removeTicket(socket, get_kanban_scope().pid, id);
  }
});

app.controller('DeadlineCollapseCtrl', function ($scope) {
  $scope.isCollapsed = true;
});

app.controller('CodeCtrl', function ($scope, $http, socket) {
  $scope.wholeFile = true; //Default

  //TODO: Send request to server, for files beginning with val. Responds with filenames.
  $scope.getFile = function(file) {
    $scope.selectedFile = false;
    return $http.get('//maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: file,
        sensor: false
      }
    }).then(function(response){
      return response.data.results.map(function(item){
        return item.formatted_address;
      });
    });
  };

  $scope.selectFile = function ($item, $model, $label, $event) {
    console.log($item);
    //TODO: Select file

    $scope.selectedFile = true;
  };

  //TODO: Send request to server, for methods beginning with val. Responds with methodnames.
  $scope.getMethod = function(file, method) {
    $scope.selectedMethod = false;
    return $http.get('//maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: method,
        sensor: false
      }
    }).then(function(response){
      return response.data.results.map(function(item){
        return item.formatted_address;
      });
    });
  };

  $scope.selectMethod = function ($item, $model, $label, $event, file) {
    console.log($item);
    console.log(file);

    //TODO: Select method
    $scope.selectedMethod = true;
  };
});
