
//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = [];
  this.desc = "";
  this.col = -1;
  this.deadline = null;
  this.startdate = null;
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
    this.deadline = new Date(year, month -1, day, hours, minutes);
    this.startdate = new Date();

  };

this.setDeadlineFlat = function(deadline){
  if(deadline == null){
    //this.deadline = new Date();
  }else{
    console.log("setting deadline as " + deadline);

  var year = deadline.substring(0, 4);
  var month =  deadline.substring(5, 7);
  var day = deadline.substring(8, 10);
  var hour = deadline.substring(11, 13);
  var minute = deadline.substring(14, 16);

  this.setDeadline(year, month, day, hour, minute);
}
}


  this.updateProgress = function(){

    let endtime = this.deadline.getTime();
    let starttime = this.startdate.getTime();

    console.log("start time is " + starttime);
    console.log("end time is " + endtime);


    let currentDate = new Date();

    let timeWidth = endtime - starttime;

    console.log("width time is " + timeWidth);


    let milliProgress = (currentDate.getTime() -starttime)/timeWidth

    this.progress =  (milliProgress * 100);

    console.log("progress is " + this.progress);


  }

}
