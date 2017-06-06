function get_kanban_scope() {
  return angular.element($('#Application')).scope();
}

function addBTN(event) {
  let k_scope = get_kanban_scope();
  let columns = k_scope.project.columns;
  let column_id_position_0;
  for (let cid in columns) {
      if (columns[cid].position === 0) {
        column_id_position_0 = columns[cid].column_id;
        break;
    }
  }
  sendStoreTicket('ticket_new', k_scope.pid, column_id_position_0);
}

function enableDnDColumns() {
//Each column has drag and drop event listeners
  let elems = document.querySelectorAll('.ticket-column');
  for (var i=0; i < elems.length; i++) {
    let el = elems[i];
    el.addEventListener('dragover', handleDragOver, false);
    el.addEventListener('drop', handleDrop, false);
    el.addEventListener('dragleave', handleDragLeave, false);
  }
}

function addTicket(col_id, ticket_id, desc, deadline) {
  let ticket = new Ticket(ticket_id);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);
  console.log("new deadline is " + deadline);
  ticket.setDeadlineFlat(deadline);

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

  scope.$apply();
  enableDnDColumns();
}

function move_tickets(to_col_id, from_col_id, tid) {
  let scope = get_kanban_scope();
  scope.project.tickets[tid].setColumn(to_col_id);
  delete scope.project.columns[from_col_id].tickets[tid];
  scope.project.columns[to_col_id].tickets[tid]
      = scope.project.tickets[tid];
  scope.$apply();
}

function delete_ticket(ticket_id, update) {
  let scope = get_kanban_scope();

  let ticket = scope.project.tickets[ticket_id];
  if (ticket != null) {
    delete scope.project.columns[ticket.col].tickets[ticket_id];
    delete scope.project.tickets[ticket_id];
  }
  if(update === undefined || update) scope.$apply();
}

function generateTickets(ticket_info_list) {
  console.log("list is " + JSON.stringify(ticket_info_list));
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc, ticket_info.datetime);
  }
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

  for (let i = 0; i < received_project.columns.length; i++) {
    let title = received_project.columns[i].title;
    let position = i;
    let column = new Column(received_project.columns[i].column_id, title, position);
    k_scope.project.columns[column.column_id] = column;
  }

  k_scope.$apply();
  enableDnDColumns();
}

function generate_user_kanbans(projects) {
  get_kanban_scope().projects = projects;

  let other_projects = {};
  for (let proj in projects) {
    other_projects[proj] = projects[proj];
  }
  delete other_projects[get_kanban_scope().pid];

  get_kanban_scope().other_projects = other_projects;
  get_kanban_scope().$apply();
}



function generateArray(start, end){
let returnArray = [];

for(var i = start; i <=end; i++){

  returnArray.push(i.toString());

}

return returnArray;
}
