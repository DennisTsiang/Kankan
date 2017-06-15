
//Constructor
function Project(project_id){

  this.project_id = project_id;
  this.columns = {};
  this.column_order = {};
  this.tickets = {};
  this.title = "";
  this.upcomingDeadlines = [];
  this.users = {};

  this.gh_url = "";
  this.addUser = function(user){
    this.users[user.username] = user;
  };
}
