//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = new Array();
  this.desc = null;
}

Ticket.prototype.addMembersToTicket = function(array) {
  for (var i=0; i < array.length; i++) {
    this.members.push(array[i]);
  }
}

Ticket.prototype.setDesc = function(text) {
  this.desc = text;
}

Ticket.prototype.makeDiv = function() {
  var node = document.createElement("DIV");
  node.id = this.ticket_id;
  node.className = 'ticket';
  node.setAttribute('draggable', 'true');
  node.addEventListener('dragstart', handleDragStart, false);
  var textNode = document.createTextNode("Ticket id#"+this.ticket_id);
  node.appendChild(textNode);
  return node;
}
