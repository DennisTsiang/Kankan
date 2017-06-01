//fuction getTicketJSON(ticket){

  //var ticketJSON = JSON.stringify(ticket);
  //var reqJSON = {"Request":requestType};
  //var joinedJSON = {}

//for(var key in reqJSON) joinedJSON[key] = reqJSON[key];
//for(var key in ticketJSON) joinedJSON[key] = ticketJSON[key];

  //return ticketJSON;
//}


//Create a JSON for getting a project or all of its tickets
//Pass in the request type as a string and the project object
function getKanbanRequestJSON(request, project){

  return {"type":request,"pid":project.project_id};

}

//Create a JSON for creating a new ticket
//Pass in the project object, ticket object and column object
function getTicketNewJSON(project, ticket, column){

  return {"type":"ticketnew", "pid":project.project_id,
          "tid":ticket.ticket_id, "cid":column.column_id};

}

//Create a JSON for tickettCreated or ticketNew (pass this in as a string)
function ticketUpdateStatic(type, ticket, project){

  return {"type":type, "tid":ticket.ticket_id,
          "pid":project.project_id};

}

//Create a JSON for moving a ticket between columns in a project
function ticketUpdateMove(ticket, project, toColumn, fromColumn){

  return {"ticketMoved": "move", "tid": ticket.ticket_id,
          "pid":project.project_id, "to": toColumn.column_id,
           "from":fromColumn.column_id};
}
