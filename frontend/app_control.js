/**
 * Created by yianni on 06/06/17.
 */

let app = angular.module('Kankan', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable', 'ui.select', "ngRoute"]);

app.config(function ($routeProvider) {
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

    $scope.chooseProject = function (proj_id) {
      get_kanban_scope().pid = proj_id;
      $location.path('/kanban');
    };
  }
});

app.controller('PopoverDemoCtrl', function ($scope, $sce) {
  $scope.dynamicPopover = {
    templateUrl: 'myPopoverTemplate.html',
    title: 'Enter Here'
  };
  $scope.newProject = function (project_name) {
    sendStoreProject(project_name);
  }
});

app.controller('LoginController', function ($scope, $location) {
  $scope.a_k = get_kanban_scope();

  $scope.login = function(name) {
    get_kanban_scope().username = name;
    $location.path('/home');
  };

  $scope.newUser = function (username) {
    addUserToProject(username, 0);
    $location.path('/home');
  }
});

app.controller('KanbanCtrl', function($scope, $location) {
  if (get_kanban_scope().pid === undefined) {
    $location.path('/login');
  } else {

    //Enable popovers
    $('[data-toggle="popover"]').popover();

    sendKanbanRequest(get_kanban_scope().pid);

    $scope.sendKanbanRequest = function (pid) {
      sendKanbanRequest(pid);
    }
  }
});

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  let ctrl = this;

  ctrl.animationsEnabled = true;
  $scope.tid = -1;
  ctrl.open_ticket_description = function(tid) {
    $scope.tid = tid;
    let modalInstance = $uibModal.open({
      animation: ctrl.animationsEnabled,
      ariaLabelledBy: 'ticket-info-title',
      ariaDescribedBy: 'ticket-info-modal-body',
      templateUrl: 'ticket-popup',
      controller: 'ModalInstanceCtrl',
      controllerAs: '$ctrl',
      resolve: {

      }
    });
  };

  ctrl.open_edit_column = function (){
    let modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'edit-column-popup',
      controller: 'ModalInstanceCtrl',
      controllerAs: '$ctrl',
      size:'lg',
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

  $scope.removeColumn = function (col) {
    removeColumn($scope.project.project_id, col.column_id, col.position);
  };


  $scope.updateColTitle = function (col, title) {
    updateColumnTitle(col.column_id, get_kanban_scope().pid, title);
  }
});

app.controller('editTicketCtrl', function($scope) {

  $scope.deadlineUpdate = function() {
    $scope.deadline = getTicket(getTid()).deadline;
    $scope.selectedDay = $scope.deadline.getDate().toString();
    //Account for the fact months are stored as 0-11 in date object
    $scope.selectedMonth = ($scope.deadline.getMonth() + 1).toString();
    $scope.selectedYear = $scope.deadline.getFullYear().toString();
    $scope.selectedHour = $scope.deadline.getHours().toString();
    $scope.selectedMinute = $scope.deadline.getMinutes().toString();


  }


  function getTicket(id) {
    let k_scope = get_kanban_scope();
    return k_scope.project.tickets[id];
  }

  function getTid() {
    let sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  }

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();

  //Initialise arrays for drop down boxes
  //TODO: Seems bad to do this every time?
  $scope.days = generateArray(1,31);

  $scope.months = generateArray(1,12);
  $scope.years = ["2017", "2018"];
  $scope.hours = generateArray(0,23);
  $scope.minutes = generateArray(0,59);

  $scope.tid = getTid();
  $scope.desc = getTicket($scope.tid).desc;

  $scope.deadlineUpdate();

  $scope.saveEditDeadline = function(){

    let ticket = getTicket($scope.tid);

    sendTicketUpdateDeadline(ticket, get_kanban_scope().pid,
        $scope.selectedMonth,
        $scope.selectedYear,
        $scope.selectedDay,
        $scope.selectedHour,
        $scope.selectedMinute);
  };

  $scope.resetDeadline = function () {
    let ticket = getTicket($scope.tid);

    ticket.resetDeadline();
    $scope.deadlineUpdate();
    sendTicketUpdateDeadline(ticket, get_kanban_scope().pid,
        $scope.selectedMonth,
        $scope.selectedYear,
        $scope.selectedDay,
        $scope.selectedHour,
        $scope.selectedMinute);
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

  }
});

app.controller('deleteTicketCtrl', function ($scope, $sce) {
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

