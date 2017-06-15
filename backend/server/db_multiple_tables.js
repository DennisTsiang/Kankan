
var locks = require('locks');
var ticket = require('./ticket');
var kanban = require('./kanban');
var column = require('./column');

function Database(pool) {
  var rwlock = locks.createReadWriteLock();
  var _this = this;

  this.newProject = function (project_name, gh_url, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT Max(project_id) FROM project_table', [], function (res) {
        var pid;
        if (res.rows[0].max === null) {
          pid = 0;
        } else {
          pid = res.rows[0].max + 1;
        }
        console.log("New project id is " + pid);
        pool.query('INSERT INTO project_table VALUES($1::int, $2::text, $3::text)',
            [pid, project_name, gh_url], function (insertion) {
          pool.query('CREATE TABLE columns_' + pid + ' (' +
              'project_id integer, ' +
              'column_id integer, ' +
              'column_title varchar(255) not null, ' +
              'column_position integer not null, ' +
              'column_limit integer, ' +
              'PRIMARY KEY (project_id, column_id) )',
              [], function (create) {
                pool.query('CREATE TABLE tickets_' + pid + ' (' +
                    'ticket_id integer,' +
                    'column_id integer,' +
                    'project_id integer,' +
                    'ticket_description varchar(255),' +
                    'deadline varchar(30), ' +
                    'PRIMARY KEY (project_id, ticket_id) )',
                    [], function () {
                      pool.query('CREATE TABLE github_table_' + pid + ' (' +
                          'filename varchar(100), ' +
                          'methodname varchar (100), ' +
                          'startline integer, ' +
                          'endline integer , ' +
                          'download_url varchar (250), ' +
                          'PRIMARY KEY (filename, methodname) )',
                          [], function (finishedCreate) {
                            pool.query('CREATE TABLE ticket_files_' + pid + ' (' +
                                'filename varchar(100), ' +
                                'methodname varchar(100), ' +
                                'ticket_id integer, ' +
                                'PRIMARY KEY (filename, methodname, ticket_id) )', [], function () {
                              rwlock.unlock();
                              console.log("Created new project " + project_name);
                              callback(pid);
                            });
                          })
                    });
              });
        });
      });
    });
  };

  this.newColumn = function (pid, column_name, position, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT Max(column_id) FROM columns_' + pid, [], function (res) {
        var cid;
        if (res.rows[0].max === null) {
          cid = 0;
        } else {
          cid = res.rows[0].max + 1;
        }
        console.log("New column id is " + pid);
        pool.query('INSERT INTO columns_' + pid +' VALUES($1::int, $2::int, $3::text, $4::int)',
            [pid, cid, column_name, position], function (insertion) {
          rwlock.unlock();
          console.log("Create new column " + column_name + " in project " + pid);
          callback(cid, column_name, position);
        });
      });
    });
  };

  this.deleteProject = function (pid, callback) {
    rwlock.writeLock(function () {
      pool.query('DROP TABLE columns_' + pid, [], function (err, res) {
        pool.query('DELETE FROM project_table WHERE project_id = $1::int', [pid], function (err, res2) {
          pool.query('DROP TABLE tickets_' + pid, [], function (err, res3) {
            pool.query('DELETE FROM user_projects WHERE project_id = $1::int', [pid], function(res4) {
              pool.query('DROP TABLE github_table_' + pid, [], function(err, res5) {
                pool.query('DROP TABLE ticket_files_' + pid, [], function (err, res) {
                  console.log('Deleted project ' + pid);
                  rwlock.unlock();
                  callback(true);
                })
              });
            });
          });
        });
      });
    });
  };

  this.deleteColumn = function (pid, cid, columnPos, callback) {
    rwlock.writeLock(function () {
      pool.query('DELETE FROM columns_' + pid + ' WHERE column_id = $1::int', [cid], function (res) {
        pool.query('DELETE FROM tickets_' + pid + ' WHERE column_id = $1::int', [cid], function (res2) {
          pool.query('UPDATE columns_' + pid + ' SET column_position = column_position - 1' +
              ' WHERE column_position > $1::int', [columnPos], function (res3) {
            rwlock.unlock();
            callback(true);
          });
        });
      });
    });
  };

  this.moveColumn = function (pid, cid, fromPos, toPos, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_position FROM columns_' + pid + ' WHERE column_id = $1::int', [cid], function (res) {
        if (res.rows[0].column_position !== fromPos) {
          rwlock.unlock();
          console.error("Error moving column. FromPos: " + fromPos +
              " But column_position: " + res.rows[0].column_position);
          callback(false);
        } else {
          pool.query('UPDATE columns_' + pid + ' SET column_position = $2::int' +
              ' WHERE column_id = $1::int', [cid, toPos], function (res2) {
            if (toPos < fromPos) {
              pool.query('UPDATE columns_' + pid + ' SET column_position = column_position + 1' +
                  ' WHERE column_id != $1::int AND column_position < $2::int AND column_position >= $3::int',
                  [cid, fromPos, toPos], function (res3) {
                    rwlock.unlock();
                    callback(true);
                  });
            } else {
              pool.query('UPDATE columns_' + pid + ' SET column_position = column_position - 1' +
                  ' WHERE column_id != $1::int AND column_position > $2::int AND column_position <= $3::int',
                  [cid, fromPos, toPos], function (res3) {
                    rwlock.unlock();
                    callback(true);
                  });
            }
          });
        }
      });
    });
  };

  this.getTickets = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT t1.*, t2.filename, t2.methodname, t2.startline, t2.endline, t2.download_url FROM tickets_'
          + pid + ' AS t1 LEFT JOIN ' + '(SELECT * FROM ticket_files_' + pid +' NATURAL JOIN github_table_' + pid +
          ') AS t2 ON t1.ticket_id = t2.ticket_id ORDER BY t1.ticket_id ASC',
          [], function(res) {
        var tickets = [];
        if (res.rows.length > 1) {
          var row = res.rows[0];
          var current_ticket = row['ticket_id'];
          var files = [];
          var column_id = row["column_id"];
          var ticket_description = row["ticket_description"];
          var deadline = row["deadline"];
          files.push({filename:row.filename, methodname:row.methodname,
            startline:row.startline, endline:row.endline, gh_url:row.download_url});
          for (var i = 1; i < res.rows.length; i++) {
            row = res.rows[i];
            if (row['ticket_id'] === current_ticket) {
              files.push({filename:row.filename, methodname:row.methodname,
                startline:row.startline, endline:row.endline, gh_url:row.download_url});
            } else {
              tickets.push(new ticket.Ticket(current_ticket, column_id,
                  ticket_description, deadline, files));
              current_ticket = row['ticket_id'];
              column_id = row["column_id"];
              ticket_description = row["ticket_description"];
              deadline = row["deadline"];
              files = [];
              files.push({filename:row.filename, methodname:row.methodname,
                startline:row.startline, endline:row.endline, gh_url:row.download_url});
            }
          }
          tickets.push(new ticket.Ticket(current_ticket, column_id,
              ticket_description, deadline, files));
        }
        rwlock.unlock();
        sortTickets(tickets);
        callback(pid, tickets);
      });
    });
  };

  function sortTickets(tickets) {
    tickets.forEach(function(ticket) {
      var hashmap = {};
      ticket.files.forEach(function (file) {
        if (file.filename in hashmap) {
          hashmap[file.filename].methods.push({methodname:file.methodname, startline:file.startline, endline:file.endline});
        } else {
          hashmap[file.filename] = {methods:[{methodname:file.methodname, startline:file.startline, endline:file.endline}],
            download_url:file.gh_url};
        }
      });
      ticket.files = hashmap;
    });
  }

  this.getKanban = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT project_id, project_name, ghurl FROM project_table WHERE project_id = $1::int', [pid], function(res) {
        if (res.rows.length === 1) {
          pool.query('SELECT column_id, column_title, column_position, column_limit FROM columns_' + pid +
              ' WHERE project_id = $1::int', [pid], function (res2) {
            if (res2.rows.length > 0) {
              var columns = [];
              res2.rows.forEach(function (row) {
                //Get column ordering
                var c = new column.Column(row["column_id"], row["column_title"], row["column_position"], row["column_limit"]);
                columns.push(c);
              });

              rwlock.unlock();
              callback(new kanban.Kanban(res.rows[0].project_id, res.rows[0].project_name, columns, res.rows[0].ghurl));
            } else {
              rwlock.unlock();
              callback(new kanban.Kanban(res.rows[0].project_id, res.rows[0].project_name, [], res.rows[0].gh_url));
            }
          });
        } else {
          rwlock.unlock();
        }
      });
    });
  };

  function newTicketHelper(pid, column_id, callback) {
    pool.query('SELECT Max(ticket_id) FROM tickets_' + pid, [], function (res) {
      var tid;
      if (res.rows[0].max === null) {
        tid = 0;
      } else {
        tid = res.rows[0].max + 1;
      }
      pool.query('INSERT INTO tickets_' + pid + ' VALUES($1::int, $2::int, $3::int, \'New Ticket\', NULL)',
        [tid, column_id, pid],
        function (insertion) {
          rwlock.unlock();
          callback(tid);
      });
    });
  }

  this.newTicket = function (pid, column_id, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_limit FROM columns_' + pid + ' WHERE column_id = $1::int', [column_id], function (res1) {
        if (res1.rows[0].column_limit !== null) {
          var column_limit = res1.rows[0].column_limit;
          pool.query('SELECT COUNT(ticket_id) as numberOfTickets FROM tickets_' + pid + ' WHERE column_id = $1::int', [column_id], function (res2) {
            if (res2.rows[0].numberoftickets >= column_limit) {
              rwlock.unlock();
              console.log("Reached maximum ticket limit (" + column_limit + ") for column_id: " + column_id);
              callback(-1); //-1 denotes invalid tid
            } else {
              newTicketHelper(pid, column_id, callback);
            }
          });
        } else {
          newTicketHelper(pid, column_id, callback);
        }
      });
    });
  };

  this.deleteTicket = function(pid, ticket_id, callback) {
    rwlock.writeLock(function () {
      pool.query('DELETE FROM tickets_' + pid + ' WHERE ticket_id = $1::int',
          [ticket_id], function (res) {
        pool.query('DELETE FROM ticket_files_' + pid + ' WHERE ticket_id=$1::int', [ticket_id], function (res) {
          rwlock.unlock();
          callback(true);
        });
      });
    });
  };

  this.moveTicket = function (pid, ticket, toColumn, fromColumn, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_id FROM tickets_' + pid + ' WHERE ticket_id = $1::int',
          [ticket.ticket_id], function (checkResult) {
        if (checkResult.rows.length === 1) {
          //Check the id of the columns match
          if (checkResult.rows[0]["column_id"] == fromColumn) {
            pool.query('SELECT column_limit FROM columns_'+pid + ' WHERE column_id = $1::int', [toColumn], function(res) {
              if (res.rows[0].column_limit !== null) {
                var column_limit = res.rows[0].column_limit;
                pool.query('SELECT COUNT(ticket_id) as numberOfTickets FROM tickets_' + pid +' WHERE column_id = $1::int', [toColumn], function (res2) {
                  //check column limit hasn't been reached
                  if (res2.rows[0].numberoftickets >= column_limit) {
                    rwlock.unlock();
                    console.error("Reached maximum ticket limit (" + column_limit + ") for column_id: " + toColumn);
                    callback(false);
                  } else {
                    //Update ticket
                    pool.query('UPDATE tickets_' + pid + ' SET column_id = $1::int WHERE ticket_id = $2::int',
                        [toColumn, ticket.ticket_id],
                        function (insertion) {
                          rwlock.unlock();
                          callback(true);
                        });
                  }
                });
              } else {
                //Continue as normal update ticket
                pool.query('UPDATE tickets_' + pid + ' SET column_id = $1::int WHERE ticket_id = $2::int',
                    [toColumn, ticket.ticket_id],
                    function (insertion) {
                      rwlock.unlock();
                      callback(true);
                    });
              }
            });
          } else {
            rwlock.unlock();
            console.error("The ticket that is moving is not in the given from column_id " + fromColumn);
            callback(false);
          }
        } else {
          rwlock.unlock();
          console.error("Error adding ticket: ticket does not exist in db.");
          callback(false);
        }
      });
    });
  };

  this.updateTicketDesc = function (pid, ticket, newDescription, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT ticket_id FROM tickets_' + pid + ' WHERE ticket_id = $1::int',
          [ticket.ticket_id], function (res) {
        if (res.rows.length === 1) {
          var escTicketDesc = newDescription.replace(/"/g,'\\"').replace(/'/g, "\\'");
          pool.query('UPDATE tickets_' + pid + ' SET ticket_description = $1::text WHERE ticket_id = $2::int',
              [newDescription, ticket.ticket_id],
            function (insertion) {
              rwlock.unlock();
              callback(true);
            });
        } else {
          rwlock.unlock();
          console.error("Ticket was not in database");
        }
      });
    });
  };

  this.updateColumnTitle = function (cid, pid, newTitle, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_id FROM columns_' + pid + ' WHERE column_id = $1::int',
          [cid], function (res) {
            if (res.rows.length === 1) {
              pool.query('UPDATE columns_' + pid + ' SET column_title = $1::text WHERE column_id = $2::int',
                  [newTitle, cid],
                  function (insertion) {
                    rwlock.unlock();
                    callback(true);
                  });
            } else {
              rwlock.unlock();
              console.error("Error: more than one column_id was returned");
            }
          });
    });
  };

  this.updateTicketDeadline = function (pid, ticket, datetime, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT ticket_id FROM tickets_' + pid + ' WHERE  ticket_id = $1::int',
          [ticket.ticket_id], function (res) {
            if (res.rows.length === 1) {
              pool.query('UPDATE tickets_' + pid + ' SET deadline = \'' + datetime +
                  '\' WHERE ticket_id = $1::int', [ticket.ticket_id], function (insertion) {
                    rwlock.unlock();
                    callback(true);
                  });
            } else {
              rwlock.unlock();
              console.error("Ticket was not in database");
            }
          });

    });
  };

  this.getFilenames = function (pid, filename, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT DISTINCT(filename) FROM github_table_' + pid + ' WHERE filename LIKE \'%' + filename + '%\'',
        [], function (res) {
            var filenames = [];
            for (var row of res.rows) {
              filenames.push(row.filename);
            }
            rwlock.unlock();
            callback(filenames);
        });
    });
  };

  this.getMethodNames = function (pid, filename, methodname, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT DISTINCT(methodname) FROM github_table_' + pid + ' WHERE filename = $1::text ' +
          'AND methodname LIKE \'%' + methodname + '%\'',
          [filename], function (res) {
            var methodnames = [];
            for (var row of res.rows) {
              methodnames.push(row.methodname);
            }
            rwlock.unlock();
            callback(methodnames);
          });
    });
  };

  this.getUsersProjects = function (username, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT project_id, project_name, ghurl FROM user_projects NATURAL JOIN project_table ' +
          'WHERE username = $1::text', [username], function (res) {
        if (res.rows.length > 0) {
          var array = [];
          for (var row of res.rows) {
            array.push({project_id:row.project_id, title:row.project_name, gh_url:row.ghurl});
          }
          rwlock.unlock();
          callback(array);
        } else {
          rwlock.unlock();
          callback([]);
        }
      });
    });
  };

  this.getProjectUsers = function (pid, callback) {
    //returns the users assigned to this project
    rwlock.readLock(function () {
      pool.query('SELECT username FROM user_projects ' +
          'WHERE project_id = $1::int', [pid], function (res) {
        if (res.rows.length > 0) {
          var array = [];
          for (var row of res.rows) {
            array.push(row.username);
          }
          rwlock.unlock();
          callback(pid, array);
        } else {
          rwlock.unlock();
          console.error("Project with pid: " + pid +" does not exist in db");
        }
      });
    });
  };

  this.addUserToProject = function (username, pid, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT username FROM users WHERE username = $1::text', [username], function (res) {
        if (res.rows.length !== 0) {
          pool.query('SELECT username FROM user_projects WHERE username = $1::text AND project_id = $2::int',
              [username, pid], function (checkRes) {
                if (checkRes.rows.length === 0) {
                  pool.query('INSERT INTO user_projects VALUES($1::text, $2::int)', [username, pid], function (res) {
                    rwlock.unlock();
                    callback(true);
                  });
                } else {
                  rwlock.unlock();
                  console.error("User already exists in project");
                }
              });
        } else {
          rwlock.unlock();
          console.error("Trying to add a user that does not exist");
        }
      });
    });
  };

  this.addMethodToTicket = function (pid, filename, methodname, ticket_id, callback) {
    rwlock.writeLock(function () {
      pool.query('INSERT INTO ticket_files_' + pid + ' VALUES($1::text, $2::text, $3::int)',
          [filename, methodname, ticket_id], function () {
        pool.query('SELECT startline, endline FROM github_table_' + pid +
            ' WHERE filename=$1::text AND methodname=$2::text', [filename, methodname], function (res) {
          if (res.rows.length === 1) {
            rwlock.unlock();
            callback(res.rows[0].startline, res.rows[0].endline);
          } else {
            rwlock.unlock();
          }
        });
      })
    })
  };

  this.removeMethodFromTicket = function (pid, filename, methodname, ticket_id, callback) {
    rwlock.writeLock(function () {
      pool.query('DELETE FROM ticket_files_' + pid + ' WHERE filename=$1::text AND methodname=$2::text AND ' +
          'ticket_id=$3::int',[filename, methodname, ticket_id], function () {
            rwlock.unlock();
            callback(true);
          })
    })
  };

  this.addUserToTicket = function (username, tid, pid, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT username FROM user_tickets WHERE username = $1::text AND' +
          ' project_id = $2::int AND ticket_id = $3::int', [username, pid, tid], function (checkRes) {
        if (checkRes.rows.length === 0 ) {
          pool.query('INSERT INTO user_tickets VALUES($1::int, $2::int, $3::text)', [tid, pid, username],
          function (res) {
            rwlock.unlock();
            callback(true);
          });
        } else {
          rwlock.unlock();
          console.error("Mapping to ticket already exists");
        }
      });
    });
  };

  this.getUserTickets = function (username, pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT ticket_id FROM user_tickets WHERE username = $1::text AND ' +
          'project_id = $2::int', [username, pid], function (res) {
        if (res.rows.length > 0) {
          var array = [];
          for (var row of res.rows) {
            array.push(row.ticket_id);
          }
          rwlock.unlock();
          callback(array);
        } else {
          rwlock.unlock();
          console.error("User does not have any tickets assigned to it with pid: " + pid);
        }
      });
    });
  };

  this.getTicketUsers = function (pid, tid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT username FROM user_tickets WHERE ticket_id = $1::int AND ' +
          'project_id = $2::int', [tid, pid], function (res) {
        if (res.rows.length > 0) {
          var array = [];
          for (var row of res.rows) {
            array.push(row.username);
          }
          rwlock.unlock();
          callback(tid, array);
        } else {
          rwlock.unlock();
          console.error("Ticket does not exist in db");
        }
      });
    });
  };

  this.addNewUser = function (username, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT username FROM users WHERE username = $1::text', [username], function (res) {
        if (res.rows.length > 0) {
          console.log("Username already taken.");
          rwlock.unlock();
          callback(false);
        } else {
          pool.query('INSERT INTO users VALUES($1::text)', [username], function (res2) {
            rwlock.unlock();
            callback(true);
          });
        }
      });
    });
  };

  this.removeUser = function (username, callback) {
    rwlock.writeLock(function() {
      pool.query('DELETE FROM users WHERE username = $1::text', [username], function(res){
        pool.query('DELETE FROM user_projects WHERE username = $1::text', [username], function(res2){
          pool.query('DELETE FROM user_tickets WHERE username = $1::text', [username], function(res3){
            rwlock.unlock();
            callback(true);
          });
        });
      });
    });
  };

  this.removeUserFromProject = function (username, pid, callback) {
    rwlock.writeLock(function() {
      pool.query('DELETE FROM user_projects WHERE username = $1::text AND project_id = $2::int', [username, pid], function(res){
        rwlock.unlock();
        callback(true);
      });
    });
  };

  this.removeUserFromTicket = function (username, pid, tid, callback) {
    rwlock.writeLock(function() {
      pool.query('DELETE FROM user_tickets WHERE username = $1::text ' +
          'AND project_id = $2::int AND ticket_id = $3::int', [username, pid, tid], function(res) {
        rwlock.unlock();
        callback(true);
      });
    });
  };

  this.checkUserExists = function(username, callback) {
    //returns true if user already exists
    rwlock.writeLock(function(){
      pool.query('SELECT username FROM users WHERE username = $1::text', [username], function (res) {
        rwlock.unlock();
        if (res.rows.length > 0) {
          console.log("Username exists in db");
          callback(true);
        } else {
          callback(false);
        }
      });
    });
  };

  this.updateColumnLimit = function (pid, cid, limit, callback) {
    rwlock.writeLock(function() {
      pool.query('UPDATE columns_' + pid + ' SET column_limit = $1::int WHERE column_id = $2::int',
          [limit, cid], function(err, res) {
        rwlock.unlock();
        callback(true);
      });
    });
  };

  this.updateGHURL = function(pid, gh_url, callback) {
    rwlock.writeLock(function () {
      pool.query('UPDATE project_table SET ghurl = $2::text WHERE project_id = $1::int', [pid, gh_url], function (err, res) {
        rwlock.unlock();
        callback(true);
      })
    });
  };
}

module.exports.Database = Database;
