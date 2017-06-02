var dragSrcEl = null;

var id = null;
function handleDragStart(e) {
  dragSrcEl = e.srcElement;
  e.effectAllowed = 'move';
  id = e.srcElement.id;
}

function handleDragOver(e) {
    e.preventDefault();
    this.style.border = "thick solid #0000FF"
}

function handleDragLeave(e) {
  this.style.border = "";
}

function handleDrop(e) {
  e.preventDefault();

  var scope = angular.element($("#kanban_table")).scope();
  var start_col = scope.project.tickets[id].col;

  var cell = $(this).closest('td');
  var end_col = cell[0].cellIndex;

  scope.project.tickets[id].setColumn(end_col);
  delete scope.project.columns[start_col].tickets[id];
  scope.project.columns[end_col].tickets[id] = scope.project.tickets[id];

  sendTicketUpdateMoved(scope.project.tickets[id], 0, end_col, start_col);

  this.style.border = "";
}
