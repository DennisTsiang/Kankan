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
    .otherwise({
      redirectTo: '/login'
    });
});

app.controller('ApplicationCtrl', function($scope) {
  $scope.projects = [];
  $scope.project = undefined;
  $scope.pid = undefined;

  initiateConnection();
});

app.controller('HomeController', function($scope, $location) {
  if (get_kanban_scope().username === undefined) {
    $location.path('/login');
  } else {
    $scope.username = get_kanban_scope().username;

    getUserProjects($scope.username);
    $scope.a_k = get_kanban_scope();

    $scope.chooseProject = function(proj_id) {
      get_kanban_scope().pid = proj_id;
      $location.path('/kanban');
    };
  }
});

app.controller('PopoverDemoCtrl', function($scope, $sce) {
  $scope.dynamicPopover = {
    templateUrl: 'myPopoverTemplate.html',
    title: 'Enter Here'
  };
  $scope.newProject = function(project_name) {
    sendStoreProject(project_name);
  }
});

app.controller('LoginController', function($scope, $location) {
  $scope.a_k = get_kanban_scope();

  $scope.login = function(name) {
    get_kanban_scope().username = name;
    $location.path('/home');
  };

  $scope.newUser = function(username) {
    storeNewUser(username);
  }
});

app.controller('KanbanCtrl', function($scope, $location) {
  if (get_kanban_scope().pid === undefined) {
    $location.path('/login');
  } else {

    //Enable popovers
    $('[data-toggle="popover"]').popover();

    sendKanbanRequest(get_kanban_scope().pid);

    $scope.sendKanbanRequest = function(pid) {
      sendKanbanRequest(pid);
    }
  }

  updateProgressTickets();

  $scope.getBorderColour = function(progress, deadlineActive) {
    let css;

    if (deadlineActive) {
      console.log("active");
      if (progress < 20) {
        css = {
          'border': '2px solid #26292e'

        };
      } else if( progress < 50) {
        css = {
          'border': '2px solid #0000ff'
        };

      }else if(progress < 80){
        css = {
          'border': '2px solid #ffb602'
        };

      }else{
        css = {
          'border': '2px solid #ff0000'
        };

      }
    } else {
      console.log("notactive");

    }
    return css;

  }
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

app.controller('editColumnCtrl', function($scope) {
  $scope.project = get_kanban_scope().project;

  $scope.addColumn = function() {
    sendStoreColumn($scope.project.project_id, "New column", Object.keys($scope.project.columns).length);
  };

  $scope.removeColumn = function(col) {
    removeColumn($scope.project.project_id, col.column_id, col.position);
  };


  $scope.updateColTitle = function(col, title) {
    updateColumnTitle(col.column_id, get_kanban_scope().pid, title);
  }
});

app.controller('DeadlineCtrl', function ($scope) {
});

app.controller('editTicketCtrl', function($scope) {

  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'addUser.html',
    title: 'Title'
  };

  $scope.addUser = function (username) {
    console.log(username);
    addUserToTicket(username, get_kanban_scope().pid, $scope.tid);
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
    console.log(deadline);

    sendTicketUpdateDeadline(ticket, get_kanban_scope().pid, deadline);
  };

  $scope.resetDeadline = function() {
    let ticket = getTicket($scope.tid);

    ticket.resetDeadline();
    sendTicketUpdateDeadline(ticket, get_kanban_scope().pid, ticket.deadline);
  };

  $scope.saveEditDesc = function(text) {
    let ticket = getTicket($scope.tid);
    if (ticket !== undefined) {
      sendTicketUpdateDesc(ticket, get_kanban_scope().pid, text);
    }
  };

  $scope.updateProgress = function() {
    let ticket = getTicket($scope.tid);
    ticket.updateProgress();
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
  getTicketUsers(get_kanban_scope().pid, getTid());

  $scope.tid = getTid();
  $scope.ticket = getTicket($scope.tid);
  $scope.desc = $scope.ticket.desc;

  $scope.format = 'yyyy-MMMM-dd';
  $scope.today();
  $scope.dt = new Date();
  $scope.hstep = 1;
  $scope.mstep = 1;
  $scope.options = {
    hstep: [1, 2, 3],
    mstep: [1, 5, 10, 15, 25, 30]
  };

  $scope.ismeridian = true;
});

app.controller('deleteTicketCtrl', function($scope, $sce) {
  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'yousurebutton.html',
    title: 'Title'
  };

  $scope.delete_ticket_button_click = function(id) {
    let info_header = $('#ticket_info_title')[0];

    //DIRTY - done to close modal.
    $scope.$parent.$parent.$close();

    removeTicket(get_kanban_scope().pid, id);
    delete_ticket(id, false);
  }
});

app.controller('DeadlineCollapseCtrl', function ($scope) {
  $scope.isCollapsed = true;
});
