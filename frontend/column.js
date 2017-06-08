//Constructor
function Column(column_id, title, position){

  this.column_id = column_id;
  this.title = title;
  this.position = position;
  this.limit = undefined;
  this.tickets = {};
}
