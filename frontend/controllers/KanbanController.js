app.controller('KanbanCtrl', function($scope, $location, socket) {
  if (get_kanban_scope().pid === undefined) {
    $location.path('/login');
  } else {

    //Enable popovers
    $('[data-toggle="popover"]').popover();

    updateTickets();

    $scope.sendKanbanRequest = function(pid) {
      sendKanbanRequest(socket, pid);
    };
  }

  $scope.goHome = function() {
    socket.emit('leaveroom', get_kanban_scope().pid);
    $location.path('/home');
  };




  $scope.toggleOnlyUserTickets = function() {
    $scope.onlyUserTickets = !$scope.onlyUserTickets;

    if ($scope.onlyUserTickets) {
      $scope.ticketsToggle = "Show all tickets";
    } else {
      $scope.ticketsToggle = "Show my tickets";
    }
  };

  $scope.onlyUserTickets = true; //Default
  $scope.toggleOnlyUserTickets(); //Set default message


  if ($scope.project.tickets !== undefined) {
    for (let ticket in $scope.project.tickets) {
      getTicketUsers(socket, get_kanban_scope().pid, ticket);
    }
  }

  $scope.getColumnUserTickets = function(cid) {
    let column = $scope.project.columns[cid];

    let userTickets = {};

    for (let ticket in column.tickets) {
      for (let i = 0; i < column.tickets[ticket].members.length; i++) {
        if ($scope.username === column.tickets[ticket].members[i]) {
          userTickets[ticket] = column.tickets[ticket];
        }
      }
    }

    return userTickets;
  };

  $scope.getTicketMembers = function(pid, tid) {
    let projectMembers = $scope.projects[pid].users;
    let ticketMembers = $scope.project.tickets[tid].members;

    let ticketUsers = {};

    for (let i = 0; i < ticketMembers.length; i++) {
      ticketUsers[ticketMembers[i]] = projectMembers[ticketMembers[i]];
    }

    return ticketUsers;
  };

  let id = null;
  let dragSrcEl = null;
  $scope.handleTicketDragStart = function(e) {
    dragSrcEl = e.srcElement;
    e.effectAllowed = 'move';
    id = e.srcElement.id;
    e.dataTransfer.setData('text/plain', e.target.innerHTML);
  };

  $scope.handleTicketDragLeave = function(e) {
    var isTicket = e.toElement.className.includes('ticket ');
    if (!isTicket) {
      e.toElement.style.border = "";
      $(e.toElement).closest('.ticket-column')[0].style.border = "5px solid white";
    }
  };

  $scope.handleTicketDragOver = function(e) {
    e.preventDefault();
    $(e.toElement).closest('.ticket-column')[0].style.border = "6px solid #0000FF";
  };

  $scope.handleTicketDrop = function(e) {
    e.preventDefault();

    let scope = get_kanban_scope();
    let start_col_id = scope.project.tickets[id].col;

    let cell = $(e.toElement).closest('td');
    let end_col_id = cell[0].getAttribute('cid');

    sendTicketUpdateMoved(socket, scope.project.tickets[id], get_kanban_scope().pid, end_col_id, start_col_id);

    var isTicket = e.toElement.className.includes('ticket ');
    if (!isTicket) {
      e.srcElement.style.border = "";
      e.toElement.style.border = "";
      $(e.toElement).closest('.ticket-column')[0].style.border = "5px solid white";
    }
  };

  $scope.addBTN = function() {
    let k_scope = get_kanban_scope();

    //Get column in position 0
    sendStoreTicket(socket, k_scope.pid, k_scope.project.column_order[0]);
  };

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

  $scope.getTicket = function(id) {
    let k_scope = get_kanban_scope();
    return k_scope.project.tickets[id];
  };

  $scope.getTid = function() {
    let sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  };
});

app.controller('editColumnCtrl', function($scope, socket) {
  $scope.project = get_kanban_scope().project;

  $scope.addColumn = function() {
    sendStoreColumn(socket, $scope.project.project_id, "New column", Object.keys($scope.project.columns).length);
  };

  $scope.removeColumn = function(col) {
    removeColumn(socket, $scope.project.project_id, col.column_id, col.position);
  };


  $scope.updateColTitle = function(col, title) {
    updateColumnTitle(socket, col.column_id, get_kanban_scope().pid, title);
  };

  let start_column_id;
  let drag_started = false;
  $scope.handleColumnDragStart = function(event) {
    if (!drag_started) {
      let cell = $(event.toElement).closest('table');
      start_column_id = cell[0].getAttribute('column_id');

      event.dataTransfer.setData('text/plain', event.target.innerHTML);
      event.effectAllowed = 'move';
      drag_started = true;
    }
  };

  $scope.handleColumnDragOver = function(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  $scope.handleColumnDrop = function(event) {
    event.preventDefault();
    if (drag_started) {
      let cell = $(event.toElement).closest('table');
      let end_column_id = cell[0].getAttribute('column_id');

      let columns = get_kanban_scope().project.columns;
      sendColumnUpdateMoved(socket, get_kanban_scope().pid, start_column_id, columns[end_column_id].position, columns[start_column_id].position);
      drag_started = false;
    }
  };

  $scope.updateColLimitEvent = function(colId, newLimit) {
    if (isNaN(newLimit)) {
      alert("Ticket limit must be a number");

    } else if (newLimit < 1) {
      alert("Column must be able to contain at least one ticket");

    } else if (newLimit > 100) {
      alert("Ticket limit must not exceed 100");

    } else {
      sendColumnUpdateLimit(socket, get_kanban_scope().pid, colId, newLimit);
    }
  };
});

app.controller('DeadlineCtrl', function($scope) {

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

  $scope.isMemberAddedToTicket = function(member) {
    return $scope.getTicket($scope.getTid()).members.includes(member);
  };

  $scope.toggleMemberToTicket = function(member) {
    if ($scope.isMemberAddedToTicket(member)) {
      //remove member
      removeUserFromTicket(socket, get_kanban_scope().pid, member, $scope.getTid());
    } else {
      //add member
      addUserToTicket(socket, member, get_kanban_scope().pid, $scope.getTid());
    }
  };

  $scope.addUser = function(username) {
    addUserToTicket(socket, username, get_kanban_scope().pid, $scope.tid);
  };

  $scope.saveEditDeadline = function(deadline) {
    let ticket = $scope.getTicket($scope.tid);
    ticket.deadline = deadline;
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, deadline);
    updateTicketTimes();


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
      var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }

  $scope.toggleMode = function() {
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
  }
});

app.controller('DeadlineCollapseCtrl', function($scope) {
  $scope.isCollapsed = true;
});

app.controller('CodeCtrl', function($scope, $http, socket) {
  $scope.wholeFile = false; //Default
  editcodescope = $scope;

  $scope.server_response = {
    'filenames': [],
    'methodnames': []
  };



  $scope.getFile = function(file) {
    $scope.selectedFile = false;
    getProjectFiles(socket, get_kanban_scope().pid, file);

    return $scope.server_response['filenames'];
  };

  $scope.selectFile = function(file, $model, $label, $event) {
    //TODO: Select file

    $scope.selectedFile = true;
  };



  $scope.getMethod = function(file, method) {
    $scope.selectedMethod = false;

    getFileMethods(socket, get_kanban_scope().pid, file, method);

    return $scope.server_response['methodnames'];
  };



  $scope.selectMethod = function(method, $model, $label, $event, file) {
    addMethodToTicket(socket, get_kanban_scope().pid, file, method, $scope.getTid());

    $scope.selectedMethod = true;
  };

  $scope.getTicketCodeData = function() {
    let ticket = $scope.getTicket($scope.getTid());

    //Remove null data
    delete ticket.codeData.null;

    return ticket.codeData;
  };



  $scope.removeMethodT = function(files, filename, method) {
    let methodnames = [];
    for (let i = 0; i < files[filename].methods.length; i++) {
      let indexedmethodname = files[filename].methods[i].methodname;
      if (indexedmethodname !== method) {
        methodnames.push(files[filename].methods[i]);
      }
    }
    if (methodnames.length === 0) {
      delete files[filename];
    } else {
      files[filename].methods = methodnames;
    }
  };

  $scope.removeMethod = function(filename, method) {
    removeMethodFromTicket(socket, get_kanban_scope().pid, filename, method, $scope.getTid());
  };

  let code = [];

  function trimToLines(lines, startLine1Inx, endLine1Inx) {
    let startLine = startLine1Inx - 1;
    let endLine = endLine1Inx - 1;

    let trimmed = lines.slice(startLine, endLine + 1);
    let numbers = [];
    for (let i = startLine; i < endLine + 1; i++) {
      numbers.push([i, trimmed[i - startLine]]);
    }
    return numbers;
  }

  function getMethodObject(methods, methodname) {
    for (let i = 0; i < methods.length; i++) {
      if (methods[i]['methodname'] === methodname) {
        return methods[i];
      }
    }
  }

  $scope.updateCode = function(filename, method) {
    $scope.filename = filename;
    $scope.methodname = method;
    let ticket = $scope.getTicket($scope.getTid());

    let methods = ticket.codeData[filename]['methods'];
    let methodObject = getMethodObject(methods, method);
    let startLine = methodObject['startline'];
    let endLine = methodObject['endline'];

    let url = ticket.codeData[filename]['download_url'];

    $http.get(url).then(function(response) {
      let data = response.data;
      data = data.split('\n');
      code = trimToLines(data, startLine, endLine);
    });

    $scope.showCode = true;
  };

  $scope.showCode = false; //Default
  $scope.getCodeData = function() {
    if ($scope.showCode) {
      return code;
    }
  }
});
