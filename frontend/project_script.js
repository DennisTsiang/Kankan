//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
  //Setup default pid
  get_kanban_scope().pid = 0;

  initiateConnection();

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();
});

function get_kanban_scope() {
  return angular.element($('#kanban_table')).scope();
}

function addBTN(event) {
  let k_scope = get_kanban_scope();
  let column_id = event.target.getAttribute("column_id");
  sendStoreTicket('ticket_new', k_scope.pid, column_id);
}

function enableDnDColumns() {
//Each column has drag and drop event listeners
  elems = document.querySelectorAll('.ticket_column');
  for (var i=0; i < elems.length; i++) {
    el = elems[i];
    el.addEventListener('dragover', handleDragOver, false);
    el.addEventListener('drop', handleDrop, false);
    el.addEventListener('dragleave', handleDragLeave, false);
  }
}

function addTicket(col_id, ticket_id, desc) {
  let ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);
  ticket.setDeadline(1);

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

  sendStoreColumn(scope.pid, id, title, position);

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

function delete_ticket_button_click(id) {
  var info_header = $('#ticket_info_title')[0];
  info_header.innerHTML = "Deleted";
  sendTicketDelete(get_kanban_scope().pid, id);
  delete_ticket(id);
}

function delete_ticket(ticket_id) {
  let scope = get_kanban_scope();

  let ticket = scope.project.tickets[ticket_id];
  if (ticket != null) {
    delete scope.project.columns[ticket.col].tickets[ticket_id];
    delete scope.project.tickets[ticket_id];
  }
  scope.$apply();
}

function generateTickets(ticket_info_list) {
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc);
  }
}

function generate_kanban(received_project) {
  var k_scope = get_kanban_scope();

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

var app = angular.module('Kankan', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable', 'ui.select']);
app.controller('MainCtrl', function($scope) {
  //Empty
});

app.controller('kanban_ctrl', function($scope) {
});

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  var ctrl = this;

  ctrl.animationsEnabled = true;
  $scope.tid = -1;
  ctrl.open = function(tid) {
    $scope.tid = tid;
    var parentElem = angular.element($document[0].querySelector('.ticket-menu'));
    var modalInstance = $uibModal.open({
      animation: ctrl.animationsEnabled,
      ariaLabelledBy: 'ticket_info_title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'ticket-popup.html',
      controller: 'ModalInstanceCtrl',
      controllerAs: 'ModalCtrl',
      appendTo: parentElem,
      resolve: {

      }
    });
  };
});

var popupInstance = this;
angular.module('Kankan').controller('ModalInstanceCtrl', function($uibModalInstance) {
  popupInstance.ok = function() {
    $uibModalInstance.close(ModalCtrl.selected.item);
  };

  popupInstance.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});

app.controller('textCtrl', function($scope) {
  function getTicket(id) {
    var k_scope = get_kanban_scope();
    return k_scope.project.tickets[id];
  }

  function getTid() {
    var sel = 'div[ng-controller="ModalCtrl as $ModalCtrl"]';
    return angular.element(sel).scope().tid;
  }

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();

  //Initialise arrays for drop down boxes
  //TODO: Seems bad to do this very time?
  $scope.days = generateArray(1,31);
  $scope.months = generateArray(1,12);
  $scope.years = ["2017", "2018"];
  $scope.hours = generateArray(0,23);
  $scope.minutes = generateArray(0,59);

  $scope.tid = getTid();
  $scope.desc = getTicket($scope.tid).desc;

  //TODO: Remove the obvious duplicate code below
  //TODO: remove coupling, stuff like tostring is ugly
  //TODO: Deal with problems with month being 0-11 not 1-12
  //      as some edge cases to not work

  $scope.deadline = getTicket(getTid()).deadline;
  $scope.selectedDay = $scope.deadline.getDate().toString();
  $scope.selectedMonth = $scope.deadline.getMonth().toString();
  $scope.selectedYear = $scope.deadline.getFullYear().toString();
  $scope.selectedHour = $scope.deadline.getHours().toString();
  $scope.selectedMinute = $scope.deadline.getMinutes().toString();

  $scope.saveEditDeadline = function(){

    var ticket = getTicket($scope.tid);
    ticket.setDeadline($scope.selectedYear, $scope.selectedMonth - 1, $scope.selectedDay, $scope.selectedHour, $scope.selectedMinute);

  }

  $scope.saveEditDesc = function(text, day) {
    var ticket = getTicket($scope.tid);
    sendTicketUpdateInfo(ticket, get_kanban_scope().pid, text);

  };

  $scope.updateProgress = function(){

    var ticket = getTicket($scope.tid);
    ticket.updateProgress();

  }
});

function generateArray(start, end){
returnArray = [];

for(var i = start; i <=end; i++){

  returnArray.push(i.toString());

}

return returnArray;
}
