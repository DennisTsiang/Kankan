
//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = [];
  this.desc = "";
  this.col = -1;
  this.deadline = new Date();
  this.startdate = new Date();
  this.progress = 0;

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


//TODO:There must be a better way to do this?
  this.setDeadline = function(year, month, day, hours, minutes) {
    this.deadline.setYear(year);
    this.deadline.setMonth(month);
    this.deadline.setDate(day);
    this.deadline.setHours(hours);
    this.deadline.setMinutes(minutes);

  };

  this.setStartDate = function(){
    //Currently just sets it to current date, will change later
    this.startDate = Date();
  }

}
