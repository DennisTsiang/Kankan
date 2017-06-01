var nextavailabletid = 0;

//Finds the highest ticket id on the kanban board
function findHighestTid() {
  var tickets = document.querySelectorAll('.ticket');
  if (tickets.length === 0) {
    return -1;
  }
  var highestTid = Math.max.apply(Math,
      Array.prototype.map.call(tickets, function(t){
        return t.id;
      }));
  return parseInt(highestTid);
}

//Returns the next available ticket id and increments the nextavailabletid
function getNextLabel() {
  var label = nextavailabletid;
  nextavailabletid++;
  return label;
}

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
  done_column.title = 'Done';

  $scope.project = new Project(0);
  $scope.project.columns.push(todo_column);
  $scope.project.columns.push(progress_column);
  $scope.project.columns.push(done_column);


  /* populate demo data
   for (var i=0; i<10;i++){
   cols.push('Col '+(i+1));
   var rowData = [];
   for (var j=0; j<10;j++){
   rowData.push('Row-'+(i+1) +' - Col '+(j+1))
   }
   data.push(rowData)
   }
   */

  /* Function to add column
   $scope.increment=function(dir){
   (dir === 'up')? $scope.colCount ++ : $scope.colCount--;
   }
   */

});

//Angular directive for the add ticket buttons
app.directive('addBtn', function($compile) {
  $c = $compile;
  return {
    replace: true,
    template: "<button type='button' class='btn btn-primary'"+
    "ng-click='addBTN(($event).target.parentElement"+
    ".parentElement.id)'>"+
    "Add"+
    "</button>",
    controller: function($scope, $element, $attrs) {
      $scope.addBTN = function(id) {
        var ticket = new Ticket(getNextLabel());
        var newEle = angular.element(ticket.makeDiv());
        $compile(newEle)($scope); //Must compile angular again to get ng-click to work
        var target = document.getElementById(id);
        angular.element(target).append(newEle);
      }
    }
  }
});

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
    //TODO: Need to implement connected function
    /*connected: function (eventName, data, callback) {
      socket.connected(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }*/
  };
});


//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
  enableDraggableTickets();
  enableDnDColumns();
  nextavailabletid = findHighestTid() + 1;
  //socketConnect();
});

function enableDraggableTickets() {
//Finds all ticket classes and sets the draggable attribute
//Also adds the dragstart event.
  var elems = document.querySelectorAll('.ticket'), el = null;
  for (var i=0; i < elems.length; i++) {
    //console.log("ticket length: " + elems.length);
    el = elems[i];
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', handleDragStart, false);
  }
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
  var s = angular.element($("#kanban_table")).scope();
  s.project.columns[col].tickets.push(ticket);
}

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  var ctrl = this;

  ctrl.animationsEnabled = true;
  $scope.tid = -1;
  ctrl.open = function(tid) {
    $scope.tid = tid;
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


function addKeyPressEventListenerToTicketsPopups() {

}

function updateTicketTextHTML(ticket) {
  var target = document.getElementById(ticket.ticket_id);
  target.innerHTML = "Ticked id#" + ticket.ticket_id + "</br>" + ticket.desc;
}

function saveEdit(el) {
  var content = el.innerHTML;
}

app.controller('textCtrl', function($scope) {
  function getTicket(id) {
    //var tickets = document.querySelectorAll(".ticket");
    for (let ticket of ticketList) {
      if (ticket.ticket_id === id) {
        console.log("Found");
        return ticket;
      }
    }
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
    updateTicketTextHTML(ticket);
  };
});

function generateTickets($scope, ticket_info_list) {
  for (let ticket_info of ticket_info_list) {
    addTicket($scope, ticket_info.column_id, ticket_info.id, ticket_info.desc);
  }
}

function generate_kanban($scope, kanban) {
  var kanban_name = kanban.project_name;
  var columns = kanban.columns;

  //TODO: Generate table columns corresponding to columns and update project name on ui.
}