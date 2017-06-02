//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
  //enableDraggableTickets();
  enableDnDColumns();
  initiateConnection();
});

var app = angular.module('Pulse', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable']);
app.controller('MainCtrl', function($scope) {
  //Empty
});

app.controller('kanban_ctrl', function($scope) {

});

function addBTN(event) {
  let k_scope = angular.element($('#kanban_table')).scope();
  let project = k_scope.project;

  var ticket = new Ticket(project.tickets.length);
  let column_id = event.target.getAttribute("column_id");

  ticket.setColumn(column_id);

  k_scope.project.tickets.push(ticket);
  k_scope.project.columns[column_id].tickets[ticket.ticket_id] = ticket;

  sendStoreTicket('ticket_new', 0, ticket, column_id);
}

function saveEdit(el) {
  //TODO: work out how this works
  var content = el.innerHTML;
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

function addTicket(col, ticket_id, desc) {
  var ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col);

  var s = angular.element($("#kanban_table")).scope();
  s.project.tickets.push(ticket);
  s.project.columns[col].tickets[ticket_id] = ticket;

  //Update change
  s.$apply();
}

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  var ctrl = this;

  ctrl.animationsEnabled = true;
  $scope.tid = -1;
  ctrl.open = function(tid) {
    $scope.tid = tid;
    console.log(tid);
    var parentElem = angular.element($document[0].querySelector('.ticket-menu'));
    var modalInstance = $uibModal.open({
      animation: ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
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
    var k_scope = angular.element($('#kanban_table')).scope();
    console.log(k_scope.project.tickets);
    return k_scope.project.tickets[id];
  }

  function getTid() {
    var sel = 'div[ng-controller="ModalCtrl as $ModalCtrl"]';
    return angular.element(sel).scope().tid;
  }

  $scope.desc = getTicket(getTid()).desc;
  $scope.saveEdit = function(text) {
    var tid = getTid();
    var ticket = getTicket(tid);
    ticket.desc = text;
    sendTicketUpdateInfo(ticket, 0, text);
  };
});

function generateTickets(ticket_info_list) {
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc);
  }
}

function generate_kanban(received_project) {
  var k_scope = angular.element($('#kanban_table')).scope();

  var project = new Project(k_scope.pid);
  k_scope.project = project;

  project.title = received_project.project_name;
  project.col = received_project.columns;


  for (var i = 0; i < received_project.columns.length; i++) {
    var column = new Column(received_project.columns[i].column_id);
    column.title = received_project.columns[i].title;
    project.columns.push(column);
  }
}