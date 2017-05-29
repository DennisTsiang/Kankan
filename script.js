var nextavailabletid = 0;

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

function getNextLabel() {
  var label = nextavailabletid;
  nextavailabletid++;
  return label;
}

var app = angular.module('Pulse', ['ngAnimate', 'ngSanitize', 'ui.bootstrap']);
app.controller('MainCtrl', function($scope) {

  $scope.addBTN = function(id) {
   var ticket = new Ticket(getNextLabel());
   var newEle = angular.element(ticket.makeDiv());
   var target = document.getElementById(id);
   angular.element(target).append(newEle);
  }

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
  var tid = ticket.ticket_id;
  var table = document.getElementById("kanban");
  var ticket_container = table.rows[ticket_row].cells[col];
  ticket_container.appendChild(ticket.makeDiv());
}
