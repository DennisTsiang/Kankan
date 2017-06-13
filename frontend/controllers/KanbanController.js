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

  $scope.goOverview = function(){
    $location.path('/overview');

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
      controller: 'ModalInstanceCtrl',
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
      controller: 'ModalInstanceCtrl',
      controllerAs: '$ctrl',
      size: 'lg',
      windowClass: 'edit-columns-popup',
      resolve: {

      }
    });
  };

});

var popupInstance = this;
app.controller('ModalInstanceCtrl', function($uibModalInstance) {
  let $ctrl = this;
  $ctrl.close = function() {
    $uibModalInstance.close($ctrl.selected);
  };

  $ctrl.cancel = function() {
    $uibModalInstance.dismiss('cancel');
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
    return getTicket(getTid()).members.includes(member);
  };

  $scope.toggleMemberToTicket = function (member) {
    if ($scope.isMemberAddedToTicket(member)) {
      //remove member
      removeUserFromTicket(socket, get_kanban_scope().pid, member, getTid());
    } else {
      //add member
      addUserToTicket(socket, member, get_kanban_scope().pid, getTid());
    }
  };

  $scope.addUser = function (username) {
    addUserToTicket(socket, username, get_kanban_scope().pid, $scope.tid);
  };

  function getTicket(id) {
    let k_scope = get_kanban_scope();
    return k_scope.project.tickets[id];
  }

  function getTid() {
    let sel = 'div[ng-controller="ModalCtrl as $ctrl"]';
    return angular.element(sel).scope().tid;
  }

  $scope.saveEditDeadline = function(deadline) {
    let ticket = getTicket($scope.tid);
    ticket.deadline = deadline;
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, deadline);
    updateTicketTimes()


  };

  $scope.resetDeadline = function() {
    let ticket = getTicket($scope.tid);

    ticket.resetDeadline();
    sendTicketUpdateDeadline(socket, ticket, get_kanban_scope().pid, ticket.deadline);
  };

  $scope.saveEditDesc = function(text) {
    console.log("Called");
    let ticket = getTicket($scope.tid);
    if (ticket !== undefined) {
      sendTicketUpdateDesc(socket, ticket, get_kanban_scope().pid, text);
    }
  };

  $scope.updateTimeLeft = function() {
    let ticket = getTicket($scope.tid);
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
  getTicketUsers(socket, get_kanban_scope().pid, getTid());

  $scope.tid = getTid();
  $scope.ticket = getTicket($scope.tid);
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

app.controller('DeadlineCollapseCtrl', function ($scope) {
  $scope.isCollapsed = true;
});

app.controller('CodeCtrl', function ($scope, $http, socket) {
  $scope.wholeFile = true; //Default

  //TODO: Send request to server, for files beginning with val. Responds with filenames.
  let filenames = {'filenames':[]};

  $scope.getFile = function(file) {
    $scope.selectedFile = false;

    socket.emit('request', JSON.stringify({pid:get_kanban_scope().pid, type:'project_files', filename: file}));

    socket.on('requestreply', function(reply) {
      console.log(reply);
      if (reply.type === 'project_files') {
        filenames['names'] = reply.object;
      }
    });

    return filenames['names'];
  };

  $scope.selectFile = function ($item, $model, $label, $event) {
    console.log($item);
    //TODO: Select file

    $scope.selectedFile = true;
  };

  //TODO: Send request to server, for methods beginning with val. Responds with methodnames.
  $scope.getMethod = function(file, method) {
    $scope.selectedMethod = false;
    return $http.get('//maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: method,
        sensor: false
      }
    }).then(function(response){
      return response.data.results.map(function(item){
        return item.formatted_address;
      });
    });
  };

  $scope.selectMethod = function ($item, $model, $label, $event, file) {
    console.log($item);
    console.log(file);

    //TODO: Select method
    $scope.selectedMethod = true;
  };
});
