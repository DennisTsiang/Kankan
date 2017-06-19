
//Constructor
function Project(project_id){

  this.project_id = project_id;
  this.columns = {};
  this.column_order = {};
  this.tickets = {};
  this.members = [];
  this.title = "";
  this.upcomingDeadlines = [];
  this.users = {};

  this.repositoryUrl = "";
  this.gh_url = "";
  this.addUser = function(user){
    console.log("user here is " + JSON.stringify(user));
    this.users[user.username] = user;
  };
}
