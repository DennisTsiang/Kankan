let dragSrcEl = null;

let id = null;
function handleTicketDragStart(e) {
  dragSrcEl = e.srcElement;
  e.effectAllowed = 'move';
  id = e.srcElement.id;
  e.dataTransfer.setData('text/plain', e.target.innerHTML);
}

function handleTicketDragOver(e) {
  e.preventDefault();
  $(e.toElement).closest('.ticket-column')[0].style.border = "thick solid #0000FF"
}

function handleTicketDragLeave(e) {
  e.toElement.style.border = "";
  $(e.toElement).closest('.ticket-column')[0].style.border = ""
}

function handleTicketDrop(e) {
  e.preventDefault();

  let scope = get_kanban_scope();
  let start_col_id = scope.project.tickets[id].col;

  let cell = $(e.toElement).closest('td');
  let end_col_id = cell[0].getAttribute('cid');

  sendTicketUpdateMoved(scope.project.tickets[id], get_kanban_scope().pid, end_col_id, start_col_id);

  $(e.toElement).closest('.ticket-column')[0].style.border = "";
  e.srcElement.style.border = "";
  e.toElement.style.border = "";
}


let start_column_id;
function handleColumnDragStart(event) {
  let cell = $(event.toElement).closest('table');
  start_column_id = cell[0].getAttribute('column_id');

  event.dataTransfer.setData('text/plain', event.target.innerHTML);
  event.effectAllowed = 'move';
}

function handleColumnDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";

}

function handleColumnDrop(event) {
  event.preventDefault();

  let cell = $(event.toElement).closest('table');
  let end_column_id = cell[0].getAttribute('column_id');

  let columns = get_kanban_scope().project.columns;
  sendColumnUpdateMoved(get_kanban_scope().pid, start_column_id, columns[end_column_id].position, columns[start_column_id].position);
}
