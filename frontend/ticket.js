var ticketList = [];

//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = new Array();
  this.desc = "";
  this.col  = -1;
  ticketList.push(this);
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
  node.setAttribute('ng-click', "$ModalCtrl.open("+this.ticket_id+")");
  node.innerHTML = "Ticket id#" + this.ticket_id + "</br>" + this.desc;
  // var textNode = document.createTextNode("Ticket id#" + this.ticket_id + Empty");
  //node.appendChild(textNode);
  return node;
}

Ticket.prototype.setColumn = function(n) {
  this.col = n;
}

// Ticket.prototype.addText = function(text) {
//   this.desc = text;
// }
