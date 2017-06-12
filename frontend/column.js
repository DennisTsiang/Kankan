//Constructor
function Column(column_id, title, position, limit){

  this.column_id = column_id;
  this.title = title;
  this.position = position;
  this.limit = limit;
  this.tickets = {};
}
