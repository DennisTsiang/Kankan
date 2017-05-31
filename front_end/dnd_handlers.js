var dragSrcEl = null;

function handleDragStart(e) {
  e.dataTransfer.setData('Text', e.target.id);
  e.dataTransfer.effectAllowed = 'move';
  dragSrcEl = this;
}

function handleDragOver(e) {
    e.preventDefault();
    this.style.border = "thick solid #0000FF"
}

function handleDragLeave(e) {
  this.style.border = "";
}

function handleDrop(e) {
  if (dragSrcEl != this ) {
    console.log("class name:" + e.target.className);
    e.preventDefault();
    var data = e.dataTransfer.getData("Text");
    console.log("ticket id: " + data);
    this.appendChild(document.getElementById(data));
  }
  this.style.border = "";
}