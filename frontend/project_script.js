function get_kanban_scope() {
  return angular.element($('#Application')).scope();
}

function addBTN(event) {
  let k_scope = get_kanban_scope();
  let columns = k_scope.project.columns;
  //Get column in position 0
  sendStoreTicket(k_scope.pid, k_scope.project.column_order[0]);
}

function enableDnDColumns() {
//Each column has drag and drop event listeners
  let elems = document.querySelectorAll('.ticket-column');
  for (let i=0; i < elems.length; i++) {
    let el = elems[i];
    el.addEventListener('dragover', handleTicketDragOver, false);
    el.addEventListener('drop', handleTicketDrop, false);
    el.addEventListener('dragleave', handleTicketDragLeave, false);
  }
}

function addTicket(col_id, ticket_id, desc, deadline) {
  let ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);
  if(deadline != null){
  ticket.setDeadline(deadline);
  }

  let s = get_kanban_scope();
  s.project.tickets[ticket_id] = ticket;

  //col_id may not be col position
  s.project.columns[col_id].tickets[ticket_id] = ticket;

  //Update change
  s.$apply();
}

function addColumn(title, position, id) {
  let scope = get_kanban_scope();
  let column = new Column(id, title, position);
  scope.project.columns[id] = column;
  scope.project.column_order[position] = id;

  scope.$apply();
  enableDnDColumns();
}

updateColLimitEvent = function (event) {
  let colId = event.srcElement.attributes['cid'];
  let limit = event.srcElement.value;
  if (isNaN(limit)) {
    alert("Ticket limit must be a number");
  } else {
    sendColumnUpdateLimit(get_kanban_scope().pid, colId, limit);
  }
};

function move_tickets(to_col_id, from_col_id, tid) {
  let scope = get_kanban_scope();
  let toColumn = scope.project.columns[to_col_id];
  let fromColumn = scope.project.columns[from_col_id];

  let column_limit = toColumn.limit;
  let to_ticket_number = toColumn.tickets.length;
  if (to_ticket_number < column_limit) {
    scope.project.tickets[tid].setColumn(to_col_id);
    delete fromColumn.tickets[tid];
    toColumn.tickets[tid] = scope.project.tickets[tid];
    scope.$apply();
  } else {
    alert("Cannot move ticket. Ticket limit reached.")
  }
}

function delete_ticket(ticket_id, update) {
  let scope = get_kanban_scope();

  let ticket = scope.project.tickets[ticket_id];
  if (ticket != null) {
    delete scope.project.columns[ticket.col].tickets[ticket_id];
    delete scope.project.tickets[ticket_id];
  }
  if (update === undefined || update) scope.$apply();
}

function generateTickets(ticket_info_list) {
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc, ticket_info.datetime);
  }
  updateTicketTimes()
  updateTickets();

}

function generate_kanban(received_project) {
  var k_scope = get_kanban_scope();

  k_scope.pid = received_project.project_id;
  if (k_scope.project === undefined) {
    let project = new Project(k_scope.pid);
    k_scope.project = project;
  }

  k_scope.project.project_id = received_project.project_id;
  k_scope.project.title = received_project.project_name;
  k_scope.project.columns = {};
  k_scope.project.column_order = {};

  for (let i = 0; i < received_project.columns.length; i++) {
    let title = received_project.columns[i].title;
    let position = received_project.columns[i].position;
    let column = new Column(received_project.columns[i].column_id, title, position);
    k_scope.project.column_order[position] = column.column_id;
    k_scope.project.columns[column.column_id] = column;
  }

  k_scope.$apply();
  enableDnDColumns();
}

function generate_user_kanbans(projects) {
  let projectsH = {};

  for (let proj in projects) {
    projectsH[projects[proj].project_id] = projects[proj];
  }

  get_kanban_scope().projects = projectsH;
  get_kanban_scope().$apply();
}

function generate_other_user_kanbans() {
  let projects = get_kanban_scope().projects;
  let other_projects = {};

  for (let proj in projects) {
    other_projects[projects[proj].project_id] = projects[proj];
  }
  delete other_projects[get_kanban_scope().pid];

  get_kanban_scope().other_projects = other_projects;
}

/*
function generateArray(start, end) {
  let returnArray = [];

  for (let i = start; i <= end; i++) {
    returnArray.push(i.toString());
  }
  return returnArray;
}
*/

function updateTickets() {
  setInterval(updateTicketTimes, 10000);
  //updateProgressBars();
}


function updateTicketTimes() {
  let s = get_kanban_scope();
  for (let ticket in s.project.tickets) {
    let tick = s.project.tickets[ticket];
    if (tick.deadlineActive) {
      tick.updateTimeLeft();
    }
  }
  s.$apply();
}
