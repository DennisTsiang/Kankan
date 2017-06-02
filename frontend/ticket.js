
//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = [];
  this.desc = "";
  this.col = -1;
  this.deadline = 0;

  this.addMembersToTicket = function (array) {
    for (var i = 0; i < array.length; i++) {
      this.members.push(array[i]);
    }
  };

  this.setDesc = function (text) {
    this.desc = text;
  };

  this.setColumn = function (n) {
    this.col = n;
  };

  this.setDeadline = function(deadline) {
  this.deadline = deadline;
  };

}
