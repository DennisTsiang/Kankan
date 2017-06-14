
//Constructor
function Project(project_id){

  this.project_id = project_id;
  this.columns = {};
  this.column_order = {};
  this.tickets = {};
  this.members = [];
  this.title = "";
  this.upcomingDeadlines = [];

  this.repositoryUrl = "";
}
