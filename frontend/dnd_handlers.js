var dragSrcEl = null;

var id = null;
function handleDragStart(e) {
  /*
  e.dataTransfer.setData('Text', e.target.id);
  e.dataTransfer.effectAllowed = 'move';
  */

  dragSrcEl = e.srcElement;
  e.effectAllowed = 'move';
  id = e.srcElement.id;
}

function handleDragOver(e) {
    e.preventDefault();
    this.style.border = "thick solid #0000FF"
}

function handleDragLeave(e) {
  this.style.border = "";
}

function handleDrop(e) {
  console.log(e);
  if (dragSrcEl != e.toElement) {
    e.preventDefault();

    var scope = angular.element($("#kanban_table")).scope();
    console.log(id);
    console.log(scope.project);
    var start_col = scope.project.tickets[id].col;

    //this.appendChild(document.getElementById(id));
    var cell = $(this).closest('td');
    var end_col = cell[0].cellIndex;

    scope.project.tickets[id].setColumn(end_col);
    delete scope.project.columns[start_col].tickets[id];
    scope.project.columns[end_col].tickets[id] = scope.project.tickets[id];

    sendTicketUpdateMoved(scope.project.tickets[id], 0, end_col, start_col);

    /*console.log(ticketList.length);
    for (let i = 0; i < ticketList.length; i++) {
      if (ticketList[i].ticket_id == id) {
          console.log("Found ticket");
          sendTicketUpdateMoved(ticketList[i], 0, columnNumber, ticketList[i].col);
          ticketList[i].setColumn(columnNumber);
          break;
      }
    }*/
  }
  //TODO:
  this.style.border = "";
}
