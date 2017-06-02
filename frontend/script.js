var app = angular.module('Pulse', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'xeditable']);
app.controller('MainCtrl', function($scope, socket) {
  initiateSocket($scope, socket);
});

app.controller('kanban_ctrl', function($scope) {

  var todo_column = new Column(0);
  todo_column.title = 'To do';
  var progress_column = new Column(1);
  progress_column.title = 'In Progreess';
  var done_column = new Column(2);
  done_column.title = 'Finished';

  $scope.project = new Project(0);
  $scope.project.columns.push(todo_column);
  $scope.project.columns.push(progress_column);
  $scope.project.columns.push(done_column);

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

app.factory('socket', function ($rootScope) {
  var socket = io.connect();
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
  };
});


//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
  //enableDraggableTickets();
  enableDnDColumns();
});

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

function addTicket($scope, col, ticket_id, desc) {
  var ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col);
  var s = angular.element($("#kanban_table")).scope();
  s.project.tickets.push(ticket);
  s.project.columns[col].tickets[ticket_id] = ticket;
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

function generateTickets($scope, ticket_info_list) {
  console.log(ticket_info_list);
  for (let ticket_info of ticket_info_list) {
    addTicket($scope, ticket_info.column_id, ticket_info.id, ticket_info.desc);
  }
}

function generate_kanban($scope, kanban) {
  var kanban_name = kanban.project_name;
  var columns = kanban.columns;

  //TODO: Generate table columns corresponding to columns and update project name on ui.
}