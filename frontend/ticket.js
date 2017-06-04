
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


//TODO:At the moment the start date updates when the deadline is made
  this.setDeadline = function(year, month, day, hours, minutes) {
    this.deadline = new Date(year, month, day, hours, minutes);
    this.startdate = new Date();

  };

  this.updateProgress = function(){

    let endtime = this.deadline.getTime();
    let starttime = this.startdate.getTime();

    let currentDate = new Date();

    let timeWidth = endtime - starttime;

    let milliProgress = (currentDate.getTime() -starttime)/timeWidth

    this.progress =  (milliProgress * 100);

  }

}
