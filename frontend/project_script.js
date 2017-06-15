function addTicket(col_id, ticket_id, desc, deadline, codeData, currentProject) {
  let ticket = new Ticket(ticket_id);
  ticket.setCodeData(codeData);
  ticket.setDesc(desc);
  ticket.setColumn(col_id);
  if (deadline != null) {
    ticket.setDeadline(deadline);
  }

  currentProject.get().tickets[ticket_id] = ticket;

  //col_id may not be col position
  currentProject.get().columns[col_id].tickets[ticket_id] = ticket;
}

function generateTickets(ticket_info_list, currentProject) {
  for (let ticket_info of ticket_info_list) {
    addTicket(ticket_info.column_id, ticket_info.id, ticket_info.desc, ticket_info.datetime, ticket_info.files, currentProject);
  }
  updateTickets(currentProject);
}

function generate_kanban(received_project) {
    let project = new Project(received_project.project_id);

    project.project_id = received_project.project_id;
    project.title = received_project.project_name;

    for (let i = 0; i < received_project.columns.length; i++) {
      let received_column = received_project.columns[i];
      let title = received_column.title;
      let position = received_column.position;
      let limit = received_column.limit;
      let cid = received_column.column_id;
      let column = new Column(cid, title, position, limit === null ? undefined : limit);
      project.column_order[position] = column.column_id;
      project.columns[column.column_id] = column;
    }
    return project;
  }

function updateTickets(currentProject) {
  updateTicketTimes(currentProject)();
  setInterval(updateTicketTimes(currentProject), 10000);
  //updateProgressBars();
}


function updateTicketTimes(currentProject) {
  return function() {
    for (let ticket in currentProject.get().tickets) {
      let tick = currentProject.get().tickets[ticket];
      if (tick.deadlineActive) {
        tick.updateTimeLeft();
      }
    }
  }
}
