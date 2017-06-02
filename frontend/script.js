//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
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
  var ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);

  var s = get_kanban_scope();
  s.project.tickets[ticket_id] = ticket;

  //col_id may not be col position
  s.project.columns[col_id].tickets[ticket_id] = ticket;

  //Update change
  s.$apply();
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
    var column = new Column(received_project.columns[i].column_id);
    column.title = received_project.columns[i].title;
    column.tickets = {};
    project.columns[column.column_id] = column;
  }

  k_scope.$apply();
  enableDnDColumns();
}

var app = angular.module('Pulse', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable']);
app.controller('MainCtrl', function($scope) {
  //Empty
});

app.controller('kanban_ctrl', function($scope) {
  $scope.pid = 0;
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

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
var popupInstance = this;
angular.module('Pulse').controller('ModalInstanceCtrl', function($uibModalInstance) {
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


  $scope.tid = getTid();
  $scope.desc = getTicket($scope.tid).desc;
  $scope.deadline = getTicket(getTid()).deadline;

  $scope.saveEditDesc = function(text) {
    var ticket = getTicket($scope.tid);
    sendTicketUpdateInfo(ticket, $scope.pid, text);
  };
});

