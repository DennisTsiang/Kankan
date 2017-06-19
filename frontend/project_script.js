function get_kanban_scope() {
  return angular.element($('#Application')).scope();
}

function addTicket(col_id, ticket_id, desc, deadline, codeData) {
  let ticket = new Ticket(ticket_id);
  ticket.setCodeData(codeData);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);
  if (deadline != null) {
    ticket.setDeadline(deadline);
  }

  let s = get_kanban_scope();
  s.project.tickets[ticket_id] = ticket;

  //col_id may not be col position
  s.project.columns[col_id].tickets[ticket_id] = ticket;
}

function move_tickets(to_col_id, from_col_id, tid) {
  let scope = get_kanban_scope();
  let toColumn = scope.project.columns[to_col_id];
  let fromColumn = scope.project.columns[from_col_id];

  scope.project.tickets[tid].setColumn(to_col_id);
  delete fromColumn.tickets[tid];
  toColumn.tickets[tid] = scope.project.tickets[tid];
}

function delete_ticket(ticket_id) {
  let scope = get_kanban_scope();

  let ticket = scope.project.tickets[ticket_id];
  if (ticket != null) {
    delete scope.project.columns[ticket.col].tickets[ticket_id];
    delete scope.project.tickets[ticket_id];
  }
}

function generateTickets(ticket_info_list) {
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc, ticket_info.datetime, ticket_info.files);
  }
  updateTicketTimes();
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
    let received_column = received_project.columns[i];
    let title = received_column.title;
    let position = received_column.position;
    let limit = received_column.limit;
    let cid = received_column.column_id;
    let column = new Column(cid, title, position, limit === null ? undefined : limit);
    k_scope.project.column_order[position] = column.column_id;
    k_scope.project.columns[column.column_id] = column;
  }
}

function generate_user_kanbans(projects, socket) {
  let projectsH = {};

  for (let proj in projects) {
    projectsH[projects[proj].project_id] = projects[proj];
    getUserTickets(socket, get_kanban_scope().username, projects[proj].project_id);
    getProjectUsers(socket, projects[proj].project_id);

  }

  get_kanban_scope().projects = projectsH;
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

function updateTickets() {
  setInterval(function () {
    updateTicketTimes();
    get_kanban_scope().$apply();
  }, 10000);
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
}
