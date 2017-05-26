
//Adds an event to a HTML element
var addEvent = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false);
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  } else {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  }
})();

var app = angular.module('Pulse', []);

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

//Finds all ticket classes and sets the draggable attribute
//Also adds the dragstart event.
var elems = document.querySelectorAll('.ticket'), el = null;
for (var i=0; i < elems.length; i++) {
  console.log("ticket length: " + elems.length);
  el = elems[i];
  el.setAttribute('draggable', 'true');
  el.addEventListener('dragstart', handleDragStart, false);
}

elems = document.querySelectorAll('.ticket_column');
for (var i=0; i < elems.length; i++) {
  el = elems[i];
  el.addEventListener('dragover', handleDragOver, false);
  el.addEventListener('drop', handleDrop, false);
  el.addEventListener('dragleave', handleDragLeave, false);
}

var dragSrcEl = null;

function handleDragStart(e) {
  e.dataTransfer.setData('Text', e.target.id);
  e.dataTransfer.effectAllowed = 'move';
  dragSrcEl = this;
}

function handleDragOver(e) {
    e.preventDefault();
    this.style.border = "thick solid #0000FF"
}

function handleDragLeave(e) {
  this.style.border = "";
}

function handleDrop(e) {
  if (dragSrcEl != this ) {
    console.log("class name:" + e.target.className);
    e.preventDefault();
    var data = e.dataTransfer.getData("Text");
    console.log("ticket id: " + data);
    this.appendChild(document.getElementById(data));
  }
  this.style.border = "";
}
