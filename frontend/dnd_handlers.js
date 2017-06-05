var dragSrcEl = null;

var id = null;
function handleDragStart(e) {
  dragSrcEl = e.srcElement;
  e.effectAllowed = 'move';
  id = e.srcElement.id;
}

function handleDragOver(e) {
  e.preventDefault();
  $(e.toElement).closest('.ticket-column')[0].style.border = "thick solid #0000FF"
}

function handleDragLeave(e) {
  e.toElement.style.border = "";
  $(e.toElement).closest('.ticket-column')[0].style.border = ""
}

function handleDrop(e) {
  e.preventDefault();

  var scope = get_kanban_scope();
  var start_col = scope.project.tickets[id].col;

  var cell = $(e.toElement).closest('td');
  var end_col = cell[0].cellIndex;

  move_tickets(end_col, start_col, id);
  sendTicketUpdateMoved(scope.project.tickets[id], 0, end_col, start_col);

  $(e.toElement).closest('.ticket-column')[0].style.border = "";
  e.srcElement.style.border = "";
  e.toElement.style.border = "";
}
