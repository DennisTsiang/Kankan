var nextavailabletid = 0;

//Finds the highest ticket id on the kanban board
function findHighestTid() {
  var tickets = document.querySelectorAll('.ticket');
  if (tickets.length == 0) {
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

var app = angular.module('Pulse', ['ngAnimate', 'ngSanitize', 'ui.bootstrap']);
app.controller('MainCtrl', function($scope) {

  var cols =[];
  var data= [];

  cols.push('To do');
  cols.push('In Progress');
  cols.push('Done');

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

  // app variables
  $scope.colCount = 3;

  /* Function to add column
  $scope.increment=function(dir){
    (dir === 'up')? $scope.colCount ++ : $scope.colCount--;
  }
  */

  $scope.cols = cols;
  $scope.data=data;

});

//Angular directive for the add ticket buttons
app.directive('addBtn', function($compile) {
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

//Fires as soon as the page DOM has finished loading
$( document ).ready(function(){
  enableDraggableTickets();
  enableDnDColumns();
  nextavailabletid = findHighestTid() + 1;
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

function addTicket(col, ticket) {
  var ticket_row = 1;
  var table = document.getElementById("kanban");
  var ticket_container = table.rows[ticket_row].cells[col];
  ticket_container.appendChild(ticket.makeDiv());
}

angular.module('Pulse').controller('ModalCtrl', function($uibModal, $log, $document) {
  var ctrl = this;

  ctrl.animationsEnabled = true;

  ctrl.open = function(size, parentSelector) {
    var parentElem = parentSelector ?
      angular.element($document[0].querySelector('.ticket-menu ' + parentSelector)) : undefined;
    var modalInstance = $uibModal.open({
      animation: ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'ticket-popup.html',
      controller: 'ModalInstanceCtrl',
      controllerAs: 'ModalCtrl',
      size: size,
      appendTo: parentElem,
      resolve: {
        items: function() {
          return ctrl.items;
        }
      }
    });
  };
});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

var popupInstance = this;
angular.module('Pulse').controller('ModalInstanceCtrl', function($uibModalInstance, items) {


  popupInstance.ok = function() {
    $uibModalInstance.close(ModalCtrl.selected.item);
  };

  popupInstance.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});
