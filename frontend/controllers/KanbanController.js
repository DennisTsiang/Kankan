app.controller('KanbanCtrl', function($scope, $location, socket) {
  if (get_kanban_scope().pid === undefined) {
    $location.path('/login');
  } else {

    //Enable popovers
    $('[data-toggle="popover"]').popover();

    sendKanbanRequest(socket, get_kanban_scope().pid);

    $scope.sendKanbanRequest = function(pid) {
      sendKanbanRequest(socket, pid);
    };
  }

  $scope.goHome = function () {
    $location.path('/home');
  };


  $scope.getBorderColour = function(timeLeft, deadlineActive) {
    let css;

    if (deadlineActive) {
      if (timeLeft > 5) {
        css = {
          'border': '2px solid #26292e'

        };
      } else if(timeLeft > 2) {
        css = {
          'border': '2px solid #0000ff'
        };

      }else if(timeLeft > 1){
        css = {
          'border': '2px solid #ff9902'
        };

      }else if(timeLeft > 0.5){
        css = {
          'border': '2px solid #ff3300'
        };

      }else if(timeLeft > 0){
        css = {
          'border': '2px solid #ff0000'
        };
      }else{
        css = {
          'border': '2px solid #26292e'

        };

      }
    } else {
      css = {
        'border': '2px solid #26292e'

      };
    }
    return css;

  };

  let id = null;
  let dragSrcEl = null;
  $scope.handleTicketDragStart = function (e) {
    dragSrcEl = e.srcElement;
    e.effectAllowed = 'move';
    id = e.srcElement.id;
    e.dataTransfer.setData('text/plain', e.target.innerHTML);
  };

  $scope.handleTicketDragLeave = function (e) {
    e.toElement.style.border = "";
    $(e.toElement).closest('.ticket-column')[0].style.border = ""
  };

  $scope.handleTicketDragOver = function (e) {
    e.preventDefault();
    $(e.toElement).closest('.ticket-column')[0].style.border = "thick solid #0000FF"
  };

  socket.on('storereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "ticket_new") {
      let ticket_info = reply.object;
      if (ticket_info.tid !== "Maxticketlimitreached") {
        addTicket(ticket_info.column_id, ticket_info.tid, ticket_info.desc, null, {});
      } else {
        console.log("Max ticket limit reached for this column ");
      }
    }
  });

  $scope.handleTicketDrop = function (e) {
    e.preventDefault();

    let scope = get_kanban_scope();
    let start_col_id = scope.project.tickets[id].col;

    let cell = $(e.toElement).closest('td');
    let end_col_id = cell[0].getAttribute('cid');

    sendTicketUpdateMoved(socket, scope.project.tickets[id], get_kanban_scope().pid, end_col_id, start_col_id);

    $(e.toElement).closest('.ticket-column')[0].style.border = "";
    e.srcElement.style.border = "";
    e.toElement.style.border = "";
  };

  $scope.addBTN = function () {
    //Get column in position 0
    sendStoreTicket(socket, $scope.project.project_id, $scope.project.column_order[0]);
  };

  socket.on('updatereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "ticket_moved") {
      if (reply.ticket_id !== "Maxticketlimitreached") {
        move_tickets(reply.to_col, reply.from_col, reply.ticket_id);
      } else {
        console.log("Max ticket limit reached for this column ");
        alert("Cannot move ticket. Ticket limit reached.")
      }
    } else if (reply.type === "ticket_info") {
      let ticket = $scope.project.columns[reply.col].tickets[reply.ticket_id];
      ticket.setDesc(reply.desc);

    } else if (reply.type === "ticket_deadline") {
      let ticket = scope.project.columns[reply.col].tickets[reply.ticket_id];
      ticket.setDeadline(reply.deadline);

    } else if (reply.type === "column_moved") {
      generate_kanban(reply.object);

      //Send for tickets, once received kanban.
      sendTicketsRequest(socket, get_kanban_scope().pid);

    } else if (reply.type === "column_title") {
      let pid = reply.pid;
      let cid = reply.cid;
      let title = reply.title;
      $scope.project.columns[cid].title = title;

    } else if (reply.type === "column_limit") {
      let cid = reply.cid;
      let pid = reply.pid;
      let limit = reply.limit;
      let column = $scope.project.columns[cid];
      column.limit = limit;

    } else if (reply.type === "gh_url") {
      let pid = reply.pid;
      let url = reply.url;
    }
  });
});

app.controller('ModalCtrl', function($compile, $scope, $uibModal, $log, $document) {
  let ctrl = this;

  ctrl.animationsEnabled = true;
  $scope.tid = -1;
  ctrl.open_ticket_editor = function(tid) {
    $scope.tid = tid;
    let modalInstance = $uibModal.open({
      animation: ctrl.animationsEnabled,
      ariaLabelledBy: 'ticket-info-title',
      ariaDescribedBy: 'ticket-info-modal-body',
      templateUrl: 'ticket-popup',
      controller: 'TicketModalInstanceCtrl',
      controllerAs: '$ctrl',
      windowClass: 'code-navigator-modal',
      size: 'lg',
      resolve: {

      }
    });
  };

  ctrl.open_edit_column = function() {
    let modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'edit-column-popup',
      controller: 'ColumnModalInstanceCtrl',
      controllerAs: '$ctrl',
      size: 'lg',
      windowClass: 'edit-columns-popup',
      resolve: {

      }
    });
  };

});

app.controller('ColumnModalInstanceCtrl', function($scope, $uibModalInstance) {
  let $ctrl = this;
  $ctrl.close = function() {
    $uibModalInstance.close($ctrl.selected);
  };

  $ctrl.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});

app.controller('TicketModalInstanceCtrl', function($scope, $uibModalInstance) {
  let $ctrl = this;
  $ctrl.close = function() {
    $uibModalInstance.close($ctrl.selected);
  };

  $ctrl.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.getTicket = function (id) {
    return $scope.project.tickets[id];
  };

  $scope.getTid = function () {
    let sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  };
});

app.controller('editColumnCtrl', function($scope, socket) {
  socket.on('storereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "column_new") {
      let col_info = reply.object;
      addColumn(col_info.column_name, col_info.position, col_info.cid);
    }
  });

  function addColumn(title, position, id) {
    let column = new Column(id, title, position);
    $scope.project.columns[id] = column;
    $scope.project.column_order[position] = id;
  }

  $scope.addColumn = function() {
    sendStoreColumn(socket, $scope.project.project_id, "New column", Object.keys($scope.project.columns).length);
  };

  $scope.removeColumn = function(col) {
    removeColumn(socket, $scope.project.project_id, col.column_id, col.position);
  };

  socket.on('removereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "column_remove") {
      generate_kanban(reply.object);

      //Send for tickets, once received kanban.
      sendTicketsRequest(socket, $scope.project.pid);
    }
  });

  $scope.updateColTitle = function(col, title) {
    updateColumnTitle(socket, col.column_id, get_kanban_scope().pid, title);
  };

  let start_column_id;
  let drag_started = false;
  $scope.handleColumnDragStart = function (event) {
    if (!drag_started) {
      let cell = $(event.toElement).closest('table');
      start_column_id = cell[0].getAttribute('column_id');

      event.dataTransfer.setData('text/plain', event.target.innerHTML);
      event.effectAllowed = 'move';
      drag_started = true;
    }
  };

  $scope.handleColumnDragOver = function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  $scope.handleColumnDrop = function (event) {
    event.preventDefault();
    if (drag_started) {
      let cell = $(event.toElement).closest('table');
      let end_column_id = cell[0].getAttribute('column_id');

      let columns = get_kanban_scope().project.columns;
      sendColumnUpdateMoved(socket, get_kanban_scope().pid, start_column_id, columns[end_column_id].position, columns[start_column_id].position);
      drag_started = false;
    }
  };

  $scope.updateColLimitEvent = function (colId, newLimit) {
    if (isNaN(newLimit)) {
      alert("Ticket limit must be a number");

    } else if(newLimit < 1) {
      alert("Column must be able to contain at least one ticket");

    } else if (newLimit > 100) {
      alert("Ticket limit must not exceed 100");

    } else {
      sendColumnUpdateLimit(socket, get_kanban_scope().pid, colId, newLimit);
    }
  };
});

app.controller('DeadlineCtrl', function ($scope) {

});

app.controller('editTicketCtrl', function($scope, socket) {

  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'addUser.html',
    title: 'Title'
  };

  $scope.getProjectMembers = function() {
    return get_kanban_scope().project.members;
  };

  $scope.isMemberAddedToTicket = function (member) {
    return $scope.getTicket($scope.getTid()).members.includes(member);
  };

  $scope.toggleMemberToTicket = function (member) {
    if ($scope.isMemberAddedToTicket(member)) {
      //remove member
      removeUserFromTicket(socket, get_kanban_scope().pid, member, $scope.getTid());
    } else {
      //add member
      addUserToTicket(socket, member, get_kanban_scope().pid, $scope.getTid());
    }
  };

  socket.on('removereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if(reply.type === "userOfTicket_remove") {
      //remove a user from a ticket
      generate_kanban(reply.object);

      //Send for tickets, once received kanban.
      sendTicketsRequest(socket, get_kanban_scope().pid);
    }
  });

  $scope.addUser = function (username) {
    addUserToTicket(socket, username, get_kanban_scope().pid, $scope.tid);
  };

  $scope.saveEditDeadline = function(deadline) {
    let ticket = $scope.getTicket($scope.tid);
    ticket.deadline = deadline;
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, deadline);
    updateTicketTimes()


  };

  $scope.resetDeadline = function() {
    let ticket = $scope.getTicket($scope.tid);

    ticket.resetDeadline();
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, ticket.deadline);
  };

  $scope.saveEditDesc = function(text) {
    let ticket = $scope.getTicket($scope.tid);
    if (ticket !== undefined) {
      sendTicketUpdateDesc(socket, ticket, get_kanban_scope().pid, text);
    }
  };

  $scope.updateTimeLeft = function() {
    let ticket = $scope.getTicket($scope.tid);
    ticket.updateTimeLeft();
  };

  $scope.today = function() {
    $scope.dt = new Date();
  };

  $scope.clear = function() {
    $scope.dt = null;
  };

  $scope.inlineOptions = {
    customClass: getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    minDate: new Date(),
    startingDay: 1
  };


  $scope.openCalendar = function() {
    $scope.popup.opened = true;
  };

  $scope.setDate = function(year, month, day) {
    $scope.dt.setFullYear(year, month, day);
  };

  $scope.popup = {
    opened: false
  };

  function getDayClass(data) {
    var date = data.date,
        mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }

  $scope.toggleMode = function () {
    $scope.ismeridian = !$scope.ismeridian;
  };

  //Enables all popovers.
  $('[data-toggle="popover"]').popover();

  //Get users for this ticket.
  getTicketUsers(socket, get_kanban_scope().pid, $scope.getTid());

  $scope.tid = $scope.getTid();
  $scope.ticket = $scope.getTicket($scope.tid);
  $scope.desc = $scope.ticket.desc;

  $scope.format = 'yyyy-MMMM-dd';
  $scope.today();
  $scope.dt = $scope.ticket.deadline;
  $scope.hstep = 1;
  $scope.mstep = 1;
  $scope.options = {
    hstep: [1, 2, 3],
    mstep: [1, 5, 10, 15, 25, 30]
  };

  $scope.ismeridian = true;
});

app.controller('deleteTicketCtrl', function($scope, $sce, socket) {
  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'yousurebutton.html',
    title: 'Title'
  };

  $scope.delete_ticket_button_click = function(id) {
    let info_header = $('#ticket_info_title')[0];
    //DIRTY - done to close modal.
    $scope.$parent.$close();

    removeTicket(socket, get_kanban_scope().pid, id);
  };

  socket.on('removereply', function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === "ticket_remove") {
      let ticket_id = reply.ticket_id;
      let project_id = reply.pid;
      if (project_id == get_kanban_scope().pid) {
        delete_ticket(ticket_id);
      } else {
        console.error("Getting deletion info for different project.")
      }
    }
  });
});

app.controller('DeadlineCollapseCtrl', function ($scope) {
  $scope.isCollapsed = true;
});

app.controller('CodeCtrl', function ($scope, $http, socket) {
  $scope.wholeFile = false; //Default

  let server_response = {'filenames':[], 'methodnames': []};

  socket.on('requestreply', function(reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === 'project_files') {
      server_response['filenames'] = reply.object;
    }
  });

  $scope.getFile = function(file) {
    $scope.selectedFile = false;
    getProjectFiles(socket, get_kanban_scope().pid, file);

    return server_response['filenames'];
  };

  $scope.selectFile = function (file, $model, $label, $event) {
    //TODO: Select file

    $scope.selectedFile = true;
  };

  socket.on('requestreply', function(reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === 'file_methods') {
      server_response['methodnames'] = reply.object;
    }
  });

  $scope.getMethod = function(file, method) {
    $scope.selectedMethod = false;

    getFileMethods(socket, get_kanban_scope().pid, file, method);

    return server_response['methodnames'];
  };

  socket.on('storereply', function(reply_string) {
    let reply = JSON.parse(reply_string);

    if (reply.type === 'add_ticket_method') {
      let tid = reply.ticket_id;
      let filename = reply.filename;
      let methodname = reply.methodname;
      let endline = reply.endline;
      let startline = reply.startline;

      let methodObject = {methodname: methodname, startline: startline, endline:endline};

      if (filename in $scope.getTicket(tid).codeData) {
        $scope.getTicket(tid).codeData[filename]['methods'].push(methodObject);
      } else {
        let url = reply.fileurl;
        $scope.getTicket(tid).codeData[filename]['methods'] = [methodObject];
        $scope.getTicket(tid).codeData[filename]['download_url'] = url;
      }
    }
  });

  $scope.selectMethod = function (method, $model, $label, $event, file) {
    addMethodToTicket(socket, get_kanban_scope().pid, file, method, $scope.getTid());

    $scope.selectedMethod = true;
  };

  $scope.getTicketCodeData = function () {
    let ticket = $scope.getTicket($scope.getTid());
    //See if ticket contains no data
    return ticket.codeData;
  };

  socket.on('removereply', function(reply_string) {
    let reply = JSON.parse(reply_string);

    if (reply.type === 'remove_ticket_method') {
      let tid = reply.ticket_id;
      let filename = reply.filename;
      let methodname = reply.methodname;

      if (filename in $scope.getTicket(tid).codeData) {
        removeMethod($scope.getTicket(tid).codeData, filename, methodname);
      }
    }
  });

  function removeMethod(files, filename, method) {
    console.log(files);
    console.log(filename);
    console.log(method);
    let methodnames = [];
    for (let i = 0; i < files[filename].length; i++) {
      let indexedmethodname = files[filename][i];
      if (indexedmethodname !== method) {
        methodnames.push(indexedmethodname);
      }
    }

    if(methodnames.length === 0) {
      delete files[filename];
    } else {
      files[filename] = methodnames;
    }
  }

  $scope.removeMethod = function (filename, method) {
    removeMethodFromTicket(socket, get_kanban_scope().pid, filename, method, $scope.getTid());
  };

  let code = [];

  function trimToLines(lines, startLine1Inx, endLine1Inx) {
    let startLine = startLine1Inx -1;
    let endLine = endLine1Inx -1;

    let trimmed = lines.slice(startLine, endLine+1);
    let numbers = [];
    for (let i = startLine; i < endLine+1; i++) {
      numbers.push([i, trimmed[i-startLine]]);
    }
    return numbers;
  }

  function getMethodObject(methods, methodname) {
    for(let i = 0; i < methods.length; i++) {
      if (methods[i]['methodname'] === methodname) {
        return methods[i];
      }
    }
  }

  $scope.updateCode = function (filename, method) {
    $scope.filename = filename;
    $scope.methodname = method;
    let ticket = $scope.getTicket($scope.getTid());

    let methods = ticket.codeData[filename]['methods'];
    let methodObject = getMethodObject(methods, method);
    let startLine = methodObject['startline'];
    let endLine = methodObject['endline'];

    let url = ticket.codeData[filename]['download_url'];

    $http.get(url).then(function (response) {
      let data = response.data;
      data = data.split('\n');
      code = trimToLines(data, startLine, endLine);
    });

    $scope.showCode = true;
  };

  $scope.showCode = false; //Default
  $scope.getCodeData = function () {
    if ($scope.showCode) {
      return code;
    }
  }
});
