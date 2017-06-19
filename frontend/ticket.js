//Constructor
function Ticket(ticket_id) {
  this.ticket_id = ticket_id;
  this.members = [];
  this.desc = "";
  this.col = -1;
  this.codeData = {};
  this.deadline = null;
  this.startdate = null;
  //this.progress = 0;
  this.deadlineActive = false;
  this.timeLeft = 0;
  this.timeLeftFormatted = "";
  this.timeFormatter = "";
  this.isTimeLeft = "";
  this.borderColour="2px solid #26292e";

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

  this.setCodeData = function (codeData) {
    this.codeData = codeData;
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
    this.isTimeLeft = "Time left: ";
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
    this.deadline = null;
    this.deadlineActive = false;
    this.timeLeft = 0;
    this.isTimeLeft = "";


  };


  this.updateTimeLeft = function() {

    let endtime = this.deadline;
    //let starttime = this.startdate;

    let currentDate = new Date();

    this.timeLeft = (endtime - currentDate) / (1000 * 3600);
    if (this.timeLeft <= 0) {
      if (this.deadlineActive == true) {
        //console.log("was active");
        this.deadlineActive = false;
        this.isTimeLeft = "Due";
        this.timeFormatter = "";
        this.timeLeftFormatted = "";
      } else {

        this.timeLeftFormatted = "";
        this.timeFormatter = "";
        this.isTimeLeft = "";

      }
      this.timeLeft = 0;

    } else {
      console.log("doing stuff");

      if (this.timeLeft < 1) {
        this.timeFormatter = "minutes";
        this.timeLeftFormatted = (Math.floor(this.timeLeft * 60)).toString();
        console.log("new minutes is " + this.timeLeftFormatted);

      } else if (this.timeLeft < (24)) {
        this.timeFormatter = "hours";
        this.timeLeftFormatted = (Math.floor(this.timeLeft)).toString();
      } else if (this.timeLeft < (2 * 24)) {
        this.timeFormatter = "day";
        this.timeLeftFormatted = (Math.floor(this.timeLeft / 24)).toString();
      } else {
        this.timeFormatter = "days";
        this.timeLeftFormatted = (Math.floor(this.timeLeft / 24)).toString();
      }
    }

    this.borderColour = this.getBorderColour();


  };

  this.getBorderColour = function() {
    let desc = this.desc;
    let deadlineActive = this.deadlineActive;
    let timeLeft = this.timeLeft;
    console.log("calledesc, timeLeft, deadlineActived getColour for " + desc);
    let css;

    if (deadlineActive) {
      if (timeLeft > 5) {
        //black
        console.log("for " + desc + " we return black");
        css =
          '2px solid #26292e';
      } else if (timeLeft > 2) {
        //blue
        console.log("for " + desc + " we return blue");

        css =
          '2px solid #0000ff';

      } else if (timeLeft > 1) {
        //yellow
        console.log("for " + desc + " we return yellow");

        css =

          '2px solid #ff9902';

      } else if (timeLeft > 0.5) {
        //orange
        console.log("for " + desc + " we return orange");

        css =
          '2px solid #ff3300';

      } else if (timeLeft > 0) {

        //red
        console.log("for " + desc + " we return red");

        css =
          '2px solid #ff0000';
      } else {
        css =
          '2px solid #26292e';

      }
    } else {
      css =
        '2px solid #26292e';
    }
    return css;

  };
}
