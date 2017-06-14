function user(username, image){

this.username = username;
this.image = image;
this.project = [];

this.setImage = function(image){

  this.image = image;

}

this.setProjects = function(projects){

  this.projects = projects;

}

this.addProject = function(project){
  this.projects.push(project);
}

}
