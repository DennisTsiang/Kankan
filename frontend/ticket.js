//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = [];
  this.desc = "";
  this.col = -1;
  this.deadline = null;
  this.startdate = null;
  //this.progress = 0;
  this.deadlineActive = false;
  this.timeLeft = 0;
  this.timeLeftFormatted = "";
  this.timeFormatter = "";

  this.addMembersToTicket = function(array) {
    for (let i = 0; i < array.length; i++) {
      this.members.push(array[i]);
    }
  };

  this.setDesc = function(text) {
    this.desc = text;
  };

  this.setColumn = function(n) {
    this.col = n;
  };


  //TODO:At the moment the start date updates when the deadline is made
  /*this.setDeadline = function(year, month, day, hours, minutes) {
    this.deadline = new Date(year, month - 1, day, hours, minutes);
    this.startdate = new Date();
    this.deadlineActive = true;

  };
  */

  this.setDeadline = function(deadline) {
   this.deadline = new Date(deadline);
   this.startdate = new Date();
   this.timeleft = 0;
   this.deadlineActive = true;
  };

  /*
  this.setDeadlineFlat = function(deadline) {
    if (deadline == null) {

      this.deadline = new Date();

    } else {

      let deadlineSplit = deadline.split(" ");
      this.setDeadline(deadlineSplit[0], deadlineSplit[1], deadlineSplit[2], deadlineSplit[3], deadlineSplit[4]);
    }
    this.startdate = new Date();
  };
  */

  this.resetDeadline = function() {
    this.startdate = new Date();
    this.deadline = new Date();
    this.deadlineActive = false;
    this.timeLeft = 0;

  };


  this.updateTimeLeft = function() {

    let endtime = this.deadline;
    //let starttime = this.startdate;

    let currentDate = new Date();

    this.timeLeft = (endtime - currentDate)/(1000 * 3600);
    if(this.timeLeft < 0){
      this.deadlineActive = false;
      this.timeLeft = 0;

    }

    console.log("time left is " + this.timeLeft);

    if(this.timeLeft < 1){
      this.timeFormatter = "minutes";
      this.timeLeftFormatted  = (Math.floor(this.timeLeft * 60)).toString();

    }else if(this.timeLeft < (24)){
      this.timeFormatter = "hours";
      this.timeLeftFormatted  = (Math.floor(this.timeLeft)).toString();
    }else if(this.timeLeft < (2 * 24)){
      this.timeFormatter = "day";
      this.timeLeftFormatted  = (Math.floor(this.timeLeft/24)).toString();
    }else{
      this.timeFormatter = "days";
      this.timeLeftFormatted  = (Math.floor(this.timeLeft/24)).toString();
    }




    /*

    if (timeWidth > 0) {


      let milliProgress = (currentDate.getTime() - starttime) / timeWidth
      this.progress = (milliProgress * 100);


      if (this.progress >= 100) {
        this.progress = 100;
        this.deadlineActive = false;
      }

    } else {
      this.progress = 0;
      this.deadlineActive = 0;
    }

    */

    console.log("time left is " + this.timeLeft);
  //  console.log("starttime " + starttime);
  //  console.log("endtime is " + endtime);

    //console.log("startdate is " + this.startdate);

  };
}
