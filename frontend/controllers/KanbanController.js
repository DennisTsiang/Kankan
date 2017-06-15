app.controller('KanbanCtrl', function($scope, $location, socket, currentProject) {

  $scope.getProject = function() {return currentProject.get()};

  if (currentProject.get() === null) {
    $location.path('/login');
  } else {

    //Enable popovers
    $('[data-toggle="popover"]').popover();


    $scope.sendKanbanRequest = function(pid) {
      sendKanbanRequest(socket, pid, currentProject.get().project_id);
    };
  }

  var test = currentProject.get();

    socket.on('requestreply', function (reply_string) {
      var reply = JSON.parse(reply_string);
      if (reply.type === "project_users") {
        let users = reply.object.users;
        if (currentProject.get() !== undefined) {
          currentProject.get().users = users;
        }
      } else if (reply.type === "tickets") {
        //generateTickets(reply.object.tickets, currentProject);
      }
    });
    socket.on('storereply', function (reply_string) {
      let reply = JSON.parse(reply_string);
      if (reply.type === "ticket_new") {
        let ticket_info = reply.object;
        if (ticket_info.tid !== "Maxticketlimitreached") {
          addTicket(ticket_info.column_id, ticket_info.tid, ticket_info.desc, null, {}, currentProject);
        } else {
          console.log("Max ticket limit reached for this column ");
        }
      }
    });
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
        let ticket = currentProject.get().columns[reply.col].tickets[reply.ticket_id];
        ticket.setDesc(reply.desc);

      } else if (reply.type === "ticket_deadline") {
        let ticket = currentProject.get().columns[reply.col].tickets[reply.ticket_id];
        ticket.setDeadline(reply.deadline);

      } else if (reply.type === "column_moved") {
        currentProject.set(generate_kanban(reply.object));

        //Send for tickets, once received kanban.
        sendTicketsRequest(socket, currentProject.get().project_id);

      } else if (reply.type === "column_title") {
        let pid = reply.pid;
        let cid = reply.cid;
        let title = reply.title;
        currentProject.get().columns[cid].title = title;

      } else if (reply.type === "column_limit") {
        let cid = reply.cid;
        let pid = reply.pid;
        let limit = reply.limit;
        let column = currentProject.get().columns[cid];
        column.limit = limit;

      } else if (reply.type === "gh_url") {
        let pid = reply.pid;
        let url = reply.url;
        if (currentProject.get().project_id === pid) {
          //console.log($scope.projects);
          currentProject.get().gh_url = url;
        }
      }
    });


  $scope.goHome = function () {
    socket.emit('leaveroom', currentProject.get().project_id);
    $location.path('/home');
  };

  function move_tickets(to_col_id, from_col_id, tid) {
    let toColumn = currentProject.get().columns[to_col_id];
    let fromColumn = currentProject.get().columns[from_col_id];

    currentProject.get().tickets[tid].setColumn(to_col_id);
    delete fromColumn.tickets[tid];
    toColumn.tickets[tid] = currentProject.get().tickets[tid];
  }

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

  $scope.handleTicketDrop = function (e) {
    e.preventDefault();
    
    let start_col_id = currentProject.get().tickets[id].col;

    let cell = $(e.toElement).closest('td');
    let end_col_id = cell[0].getAttribute('cid');

    sendTicketUpdateMoved(socket, currentProject.get().tickets[id], currentProject.get().project_id,
        end_col_id, start_col_id);

    $(e.toElement).closest('.ticket-column')[0].style.border = "";
    e.srcElement.style.border = "";
    e.toElement.style.border = "";
  };

  $scope.addBTN = function () {
    //Get column in position 0
    sendStoreTicket(socket, currentProject.get().project_id, currentProject.get().column_order[0]);
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

app.controller('TicketModalInstanceCtrl', function($scope, $uibModalInstance, currentProject) {
  let $ctrl = this;
  $ctrl.close = function() {
    $uibModalInstance.close($ctrl.selected);
  };

  $ctrl.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.getTicket = function (id) {
    return currentProject.get().tickets[id];
  };

  $scope.getTid = function () {
    let sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  };
});

app.controller('editColumnCtrl', function($scope, socket, currentProject) {
  $scope.getProject = function () {
    return currentProject.get();
  };


    socket.on('storereply', function (reply_string) {
      let reply = JSON.parse(reply_string);
      if (reply.type === "column_new") {
        let col_info = reply.object;
        addColumn(col_info.column_name, col_info.position, col_info.cid);
      }
    });
    socket.on('removereply', function (reply_string) {
      let reply = JSON.parse(reply_string);
      if (reply.type === "column_remove") {
        currentProject.set(generate_kanban(reply.object));

        //Send for tickets, once received kanban.
        sendTicketsRequest(socket, currentProject.get().project_id);
      }
    });

  function addColumn(title, position, id) {
    let column = new Column(id, title, position);
    currentProject.get().columns[id] = column;
    currentProject.get().column_order[position] = id;
  }

  $scope.addColumn = function() {
    sendStoreColumn(socket, currentProject.get().project_id, "New column", Object.keys(currentProject.get().columns).length);
  };

  $scope.removeColumn = function(col) {
    removeColumn(socket, currentProject.get().project_id, col.column_id, col.position);
  };

  $scope.updateColTitle = function(col, title) {
    updateColumnTitle(socket, col.column_id, currentProject.get().project_id, title);
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

      let columns = currentProject.get().columns;
      sendColumnUpdateMoved(socket, currentProject.get().project_id, start_column_id, columns[end_column_id].position, columns[start_column_id].position);
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
      sendColumnUpdateLimit(socket, currentProject.get().project_id, colId, newLimit);
    }
  };
});

app.controller('DeadlineCtrl', function ($scope) {

});

app.controller('editTicketCtrl', function($scope, socket, currentProject) {

  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'addUser.html',
    title: 'Title'
  };

  $scope.getProjectMembers = function() {
    return currentProject.get().members;
  };

  $scope.isMemberAddedToTicket = function (member) {
    return $scope.getTicket($scope.getTid()).members.includes(member);
  };

    socket.on('requestreply', function (reply_string) {
      var reply = JSON.parse(reply_string);
      if (reply.type === "ticket_users") {
        let users = reply.object.users;
        let tid = reply.object.tid;
        currentProject.get().tickets[tid].members = users;
      }
    });
    socket.on('removereply', function (reply_string) {
      let reply = JSON.parse(reply_string);
      if(reply.type === "userOfTicket_remove") {
        //remove a user from a ticket
        currentProject.set(generate_kanban(reply.object));

        //Send for tickets, once received kanban.
        sendTicketsRequest(socket, currentProject.get().project_id);
      }
    });


  $scope.toggleMemberToTicket = function (member) {
    if ($scope.isMemberAddedToTicket(member)) {
      //remove member
      removeUserFromTicket(socket, currentProject.get().project_id, member, $scope.getTid());
    } else {
      //add member
      addUserToTicket(socket, member, currentProject.get().project_id, $scope.getTid());
    }
  };



  $scope.addUser = function (username) {
    addUserToTicket(socket, username, currentProject.get().project_id, $scope.tid);
  };

  $scope.saveEditDeadline = function(deadline) {
    let ticket = $scope.getTicket($scope.tid);
    ticket.deadline = deadline;
    sendTicketUpdateDeadline(socket, ticket, currentProject.get().project_id, deadline);
    updateTicketTimes()


  };

  $scope.resetDeadline = function() {
    let ticket = $scope.getTicket($scope.tid);

    ticket.resetDeadline();
    sendTicketUpdateDeadline(socket, ticket, currentProject.get().project_id, ticket.deadline);
  };

  $scope.saveEditDesc = function(text) {
    let ticket = $scope.getTicket($scope.tid);
    if (ticket !== undefined) {
      sendTicketUpdateDesc(socket, ticket, currentProject.get().project_id, text);
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
  getTicketUsers(socket, currentProject.get().project_id, $scope.getTid());

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


app.controller('deleteTicketCtrl', function($scope, $sce, socket, currentProject) {
  $scope.dynamicPopover = {
    content: 'Hello world!',
    templateUrl: 'yousurebutton.html',
    title: 'Title'
  };

  $scope.delete_ticket_button_click = function(id) {
    let info_header = $('#ticket_info_title')[0];
    //DIRTY - done to close modal.
    $scope.$parent.$close();

    removeTicket(socket, currentProject.get().project_id, id);
  };

    socket.on('removereply', function (reply_string) {
      let reply = JSON.parse(reply_string);
      if (reply.type === "ticket_remove") {
        let ticket_id = reply.ticket_id;
        let project_id = reply.pid;
        if (project_id === currentProject.get().project_id) {
          delete_ticket(ticket_id);
        } else {
          console.error("Getting deletion info for different project.")
        }
      }
    });


  function delete_ticket(ticket_id) {
    let ticket = currentProject.get().tickets[ticket_id];
    if (ticket != null) {
      delete currentProject.get().columns[ticket.col].tickets[ticket_id];
      delete currentProject.get().tickets[ticket_id];
    }
  }
});

app.controller('DeadlineCollapseCtrl', function ($scope) {
  $scope.isCollapsed = true;
});

app.controller('CodeCtrl', function ($scope, $http, socket, currentProject) {
  $scope.wholeFile = false; //Default

  let server_response = {'filenames':[], 'methodnames': []};
  var requestreplyF = function (reply_string) {
    let reply = JSON.parse(reply_string);
    if (reply.type === 'project_files') {
      server_response['filenames'] = reply.object;
    } else if (reply.type === 'file_methods') {
      server_response['methodnames'] = reply.object;
    }
  };
  var storereplyF = function(reply_string) {
    let reply = JSON.parse(reply_string);

    if (reply.type === 'add_ticket_method') {
      console.log("shgdjfhg");
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
        $scope.getTicket(tid).codeData[filename] = {};
        $scope.getTicket(tid).codeData[filename]['methods'] = [methodObject];
        $scope.getTicket(tid).codeData[filename]['download_url'] = url;
      }
    }
  };
  var removereplyF = function(reply_string) {
    let reply = JSON.parse(reply_string);

    if (reply.type === 'remove_ticket_method') {
      let tid = reply.ticket_id;
      let filename = reply.filename;
      let methodname = reply.methodname;

      if (filename in $scope.getTicket(tid).codeData) {
        removeMethod($scope.getTicket(tid).codeData, filename, methodname);
      }
    }
  };

  socket.removeEventListener('requestreply', requestreplyF);
  socket.removeEventListener('storereply', storereplyF);
  socket.removeEventListener('removereply', removereplyF);

  socket.on('requestreply', requestreplyF);
  socket.on('storereply', storereplyF);
  socket.on('removereply', removereplyF);


  $scope.getFile = function(file) {
    $scope.selectedFile = false;
    getProjectFiles(socket, currentProject.get().project_id, file);

    return server_response['filenames'];
  };

  $scope.selectFile = function (file, $model, $label, $event) {
    //TODO: Select file

    $scope.selectedFile = true;
  };

  $scope.getMethod = function(file, method) {
    $scope.selectedMethod = false;

    getFileMethods(socket, currentProject.get().project_id, file, method);

    return server_response['methodnames'];
  };



  $scope.selectMethod = function (method, $model, $label, $event, file) {
    addMethodToTicket(socket, currentProject.get().project_id, file, method, $scope.getTid());

    $scope.selectedMethod = true;
  };

  $scope.getTicketCodeData = function () {
    let ticket = $scope.getTicket($scope.getTid());
    if (ticket !== undefined) {
      //See if ticket contains no data
      return ticket.codeData;
    }
    return undefined;
  };

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
    removeMethodFromTicket(socket, currentProject.get().project_id, filename, method, $scope.getTid());
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
