//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
  //Setup default pid

  get_kanban_scope().pid = 0;
  get_kanban_scope().username = "harry";


  initiateConnection();

  //get_kanban_scope().projects = [];
  getUserProjects(get_kanban_scope().username);

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();
});

function get_kanban_scope() {
  return angular.element($('#kanban_location')).scope();
}

function addBTN(event) {
  let k_scope = get_kanban_scope();
  let columns = k_scope.project.columns;
  let column_id_position_0;
  for (let cid in columns) {
      if (columns[cid].position === 0) {
        column_id_position_0 = columns[cid].column_id;
        break;
    }
  }
  sendStoreTicket('ticket_new', k_scope.pid, column_id_position_0);
}

function enableDnDColumns() {
//Each column has drag and drop event listeners
  elems = document.querySelectorAll('.ticket-column');
  for (var i=0; i < elems.length; i++) {
    el = elems[i];
    el.addEventListener('dragover', handleDragOver, false);
    el.addEventListener('drop', handleDrop, false);
    el.addEventListener('dragleave', handleDragLeave, false);
  }
}

function addTicket(col_id, ticket_id, desc, deadline) {
  let ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);
  console.log("new deadline is " + deadline);
  ticket.setDeadlineFlat(deadline);

  let s = get_kanban_scope();
  s.project.tickets[ticket_id] = ticket;

  //col_id may not be col position
  s.project.columns[col_id].tickets[ticket_id] = ticket;

  //Update change
  s.$apply();
}

//TODO: Add/remove column button somewhere - maybe plus minus icon, with popup for more info.
function addColumn(title, position, id) {
  let scope = get_kanban_scope();
  let column = new Column(id, title, position);
  scope.project.columns[id] = column;

  scope.$apply();
  enableDnDColumns();
}

function move_tickets(to_col_id, from_col_id, tid) {
  let scope = get_kanban_scope();
  scope.project.tickets[tid].setColumn(to_col_id);
  delete scope.project.columns[from_col_id].tickets[tid];
  scope.project.columns[to_col_id].tickets[tid]
      = scope.project.tickets[tid];
  scope.$apply();
}

function delete_ticket(ticket_id, update) {
  let scope = get_kanban_scope();

  let ticket = scope.project.tickets[ticket_id];
  if (ticket != null) {
    delete scope.project.columns[ticket.col].tickets[ticket_id];
    delete scope.project.tickets[ticket_id];
  }
  if(update === undefined || update) scope.$apply();
}

function generateTickets(ticket_info_list) {
  console.log("list is " + JSON.stringify(ticket_info_list));
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc, ticket_info.datetime);
  }
}

function generate_kanban(received_project) {
  var k_scope = get_kanban_scope();

  k_scope.pid = received_project.project_id;
  var project = new Project(k_scope.pid);
  k_scope.project = project;

  project.title = received_project.project_name;
  project.col = received_project.columns;


  for (var i = 0; i < received_project.columns.length; i++) {
    let title = received_project.columns[i].title;
    let position = i;
    var column = new Column(received_project.columns[i].column_id, title, position);
    project.columns[column.column_id] = column;
  }

  k_scope.$apply();
  enableDnDColumns();
}

function generate_user_kanbans(projects) {
  get_kanban_scope().projects = projects;

  let other_projects = {};
  for (let proj in projects) {
    other_projects[proj] = projects[proj];
  }
  delete other_projects[get_kanban_scope().pid];

  get_kanban_scope().other_projects = other_projects;
}

var app = angular.module('Kankan', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable', 'ui.select']);

/*
app.config(['$routeProvider'], function config($routeProvider) {
  $routeProvider
  .when("/", {
   templateUrl : "login.html",
   controller: "loginCtrl"
   })
   .when("/", {
     templateUrl : "/kanban.html",
     controller: "MainCtrl"
    })
   .otherwise('/');
});
*/

app.controller('MainCtrl', function($scope) {
  //Empty
});

app.controller('kanban_ctrl', function($scope) {
  $scope.sendKanbanRequest = function (pid) {
    sendKanbanRequest(pid);
  }
});

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  var ctrl = this;

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
    delete $scope.project.columns[col.column_id];
  };

  $scope.updateColTitle = function (title) {
    console.log(title);
    //TODO: Handle update column description
    
  }
});

app.controller('editTicketCtrl', function($scope) {
  function getTicket(id) {
    var k_scope = get_kanban_scope();
    return k_scope.project.tickets[id];
  }

  function getTid() {
    var sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  }

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();

  var digit10 = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09"];
  //Initialise arrays for drop down boxes
  //TODO: Seems bad to do this every time?
  $scope.days = digit10.slice(1,9).concat(generateArray(10,31));

  $scope.months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  $scope.years = ["2017", "2018"];
  $scope.hours = digit10.concat(generateArray(10,23));
  $scope.minutes = digit10.concat(generateArray(10,59));

  $scope.tid = getTid();
  $scope.desc = getTicket($scope.tid).desc;

  //TODO: Remove the obvious duplicate code below
  //TODO: remove coupling, stuff like tostring is ugly
  //TODO: Deal with problems with month being 0-11 not 1-12
  //      as some edge cases to not work

  $scope.deadline = getTicket(getTid()).deadline;
  console.log("current id is " + getTid());
  console.log("current deadline is is " + $scope.deadline);

  //$scope.selectedDay = $scope.deadline.getDate().toString();
  //Account for the fact months are stored as 0-11 in date object
  //$scope.selectedMonth = ($scope.deadline.getMonth() + 1 ).toString();
  //$scope.selectedYear = $scope.deadline.getFullYear().toString();
  //$scope.selectedHour = $scope.deadline.getHours().toString();
  //$scope.selectedMinute = $scope.deadline.getMinutes().toString();

  console.log("selected day first  is " + $scope.selectedDay);
  console.log("selected month first is " + $scope.selectedMonth);
  console.log("selected year first is " + $scope.selectedYear);
  console.log("selected hours first is " + $scope.selectedHour);
  console.log("selected minutes first is " + $scope.selectedMinute);

  $scope.saveEditDeadline = function(){

    console.log("selected day is " + $scope.selectedDay);
    console.log("selected month is " + $scope.selectedMonth);
    console.log("selected year is " + $scope.selectedYear);
    console.log("selected hours is " + $scope.selectedHour);
    console.log("selected minutes is " + $scope.selectedMinute);


    var ticket = getTicket($scope.tid);
  //  ticket.setDeadline($scope.selectedYear, $scope.selectedMonth - 1, $scope.selectedDay, $scope.selectedHour, $scope.selectedMinute);

    sendTicketUpdateDeadline(ticket, get_kanban_scope().pid,
                             $scope.selectedMonth,
                             $scope.selectedYear,
                             $scope.selectedDay,
                             $scope.selectedHour,
                             $scope.selectedMinute);

  }

  $scope.saveEditDesc = function(text) {
    var ticket = getTicket($scope.tid);
    if (ticket !== undefined) {
      sendTicketUpdateDesc(ticket, get_kanban_scope().pid, text);
    }

  };

  $scope.updateProgress = function(){

    var ticket = getTicket($scope.tid);
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


function generateArray(start, end){
returnArray = [];

for(var i = start; i <=end; i++){

  returnArray.push(i.toString());

}

return returnArray;
}
