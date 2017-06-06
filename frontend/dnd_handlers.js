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
  var start_col_id = scope.project.tickets[id].col;

  var cell = $(e.toElement).closest('td');
  var end_col_id = cell[0].getAttribute('cid');

  sendTicketUpdateMoved(scope.project.tickets[id], get_kanban_scope().pid, end_col_id, start_col_id);

  $(e.toElement).closest('.ticket-column')[0].style.border = "";
  e.srcElement.style.border = "";
  e.toElement.style.border = "";
}
