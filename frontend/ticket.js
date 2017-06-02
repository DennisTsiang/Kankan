
//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = [];
  this.desc = "";
  this.col = -1;

  this.addMembersToTicket = function (array) {
    for (var i = 0; i < array.length; i++) {
      this.members.push(array[i]);
    }
  }

  this.setDesc = function (text) {
    this.desc = text;
  }

  /*Ticket.prototype.makeDiv = function() {
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
   */

  this.setColumn = function (n) {
    this.col = n;
  }
}
// Ticket.prototype.addText = function(text) {
//   this.desc = text;
// }
