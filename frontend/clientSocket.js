
function sendKanbanRequest(socket, pid) {
  socket.emit('leaveroom', get_kanban_scope().pid);
  socket.emit('joinroom', pid);
  sendKanbanRequestHelper(socket, pid);
}

function addMethodToTicket(socket, pid, filename, methodname, ticket_id) {
  var ticketObj = {type:'add_ticket_method', pid:pid, filename:filename, methodname:methodname, ticket_id:ticket_id};
  socket.emit("store", JSON.stringify(ticketObj));
}

function removeMethodFromTicket(socket, pid, filename, methodname, ticket_id) {
  var ticketObj = {type:'remove_ticket_method', pid:pid, filename:filename, methodname:methodname, ticket_id:ticket_id};
  socket.emit("remove", JSON.stringify(ticketObj));
}

function sendKanbanRequestHelper(socket, pid) {
  var ticketObj = {type : "kanban", pid : pid};
  socket.emit("request", JSON.stringify(ticketObj));
}

function sendTicketsRequest(socket, pid) {
  var ticketObj = {type : "tickets", pid : pid};
  socket.emit("request", JSON.stringify(ticketObj));
}

function sendTicketUpdateMoved(socket, ticket, pid, to, from) {
  var jsonString = {type: 'ticket_moved', ticket: ticket, pid : pid,
    to : to, from : from};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendColumnUpdateMoved(socket, pid, cid, to, from) {
  var jsonString = {type: 'column_moved', pid : pid, cid: cid,
    to : to, from : from};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendColumnUpdateLimit(socket, pid, cid, newlimit) {
  var jsonString = {type: 'column_limit', pid : pid, cid: cid,
    limit : newlimit};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateDesc(socket, ticket, pid, desc) {
  var jsonString = {type: "ticket_info", ticket: ticket, pid : pid, new_description : desc};
  socket.emit("update", JSON.stringify(jsonString));
}

function updateColumnTitle(socket, cid, pid, title) {
  var jsonString = {type: "column_title", cid:cid, pid:pid, new_title:title};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendTicketUpdateDeadline(socket, ticket, pid, deadline) {
  var jsonString = {type: "ticket_deadline", ticket: ticket, pid : pid, deadline : deadline};
  socket.emit("update", JSON.stringify(jsonString));
}

function sendStoreTicket(socket, pid, col_id) {
  let jsonString = {type:'ticket_new', pid : pid, column_id: col_id};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreProject(socket, project_name, url) {
  var jsonString = {type:'project_new', project_name:project_name, gh_url: url};
  socket.emit("store", JSON.stringify(jsonString));
}

function sendStoreColumn(socket, pid, column_name, position) {
  var jsonString = {type:'column_new', pid:pid, column_name:column_name, position:position};
  socket.emit("store", JSON.stringify(jsonString));
}

function storeNewUser(socket, username) {
  var jsonString = {type: 'user_new', username:username};
  socket.emit("request", JSON.stringify(jsonString));
}

function removeProject(socket, pid) {
  var jsonString = {type:'project_remove', pid:pid};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeColumn(socket, pid, column_id, column_position) {
  var jsonString = {type:'column_remove', pid:pid, column_id:column_id, column_position: column_position};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeTicket(socket, pid, ticket_id) {
  var jsonString = {type:'ticket_remove', pid:pid, ticket_id:ticket_id};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeUser(socket, pid, username) {
  var jsonString = {type : 'user_remove', pid:pid, username:username};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeUserFromProject(socket, pid, username) {
  var jsonString = {type : 'userOfProject_remove', pid:pid, username:username};
  socket.emit("remove", JSON.stringify(jsonString));
}

function removeUserFromTicket(socket, pid, username, tid) {
  var jsonString = {type : 'userOfTicket_remove', pid:pid, username:username, tid:tid};
  socket.emit("remove", JSON.stringify(jsonString));
}

function getUserProjects(socket, username, pid) {
  var jsonString = {type:'user_projects', username : username, pid : pid};
  socket.emit("request", JSON.stringify(jsonString));
}

function addUserToProject(socket, username, pid) {
  var jsonString = {type:'new_user_project', username : username, pid : pid};
  socket.emit("store", JSON.stringify(jsonString));
}

function addUserToTicket(socket, username, pid, tid) {
  var jsonString = {type:'add_user_to_ticket', username : username, pid : pid, tid : tid};
  socket.emit("request", JSON.stringify(jsonString));
}

function getTicketUsers(socket, pid, tid) {
  var jsonString = {type:'ticket_users', pid : pid, tid : tid};
  socket.emit("request", JSON.stringify(jsonString));
}

function getUserTickets(socket, username, pid) {
  var jsonString = {type:'user_tickets', pid : pid, username : username};
  socket.emit("request", JSON.stringify(jsonString));
}

function sendUsernameCheck(socket, username) {
  var jsonString = {type: 'user_check', username : username};
  socket.emit("request", JSON.stringify(jsonString));
}

function getProjectUsers(socket, pid) {
  var jsonString = {type : 'project_users', pid:pid};
  socket.emit("request", JSON.stringify(jsonString));
}

function getProjectFiles(socket, pid, partial_filename) {
  socket.emit('request', JSON.stringify({pid:pid, type:'project_files', filename: partial_filename}));
}

function getFileMethods(socket, pid, filename, partial_methodname) {
  socket.emit('request', JSON.stringify({pid:pid, type:'file_methods', filename: filename, methodname: partial_methodname}));
}

function sendUpdateGHURL(socket, pid, new_ghurl) {
  socket.emit('update', JSON.stringify({type: 'set_gh_url', pid : pid, gh_url : gh_url}));
}
