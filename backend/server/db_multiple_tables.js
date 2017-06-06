
var locks = require('locks');
var ticket = require('./ticket');
var kanban = require('./kanban');
var column = require('./column');

function Database(pool) {
  var rwlock = locks.createReadWriteLock();
  var _this = this;

  this.newProject = function (project_name, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT Max(project_id) FROM project_table', [], function (res) {
        var pid;
        if (res.rows[0].max === null) {
          pid = 0;
        } else {
          pid = res.rows[0].max + 1;
        }
        console.log("New project id is " + pid);
        pool.query('INSERT INTO project_table VALUES($1::int, $2::text)', [pid, project_name], function (insertion) {
          pool.query('CREATE TABLE columns_' + pid + ' (' +
              'project_id integer, ' +
              'column_id integer, ' +
              'column_title varchar(255) not null, ' +
              'column_position integer not null, ' +
              'PRIMARY KEY (project_id, column_id) )',
              [], function (create) {
                pool.query('CREATE TABLE tickets_' + pid + ' (' +
                    'ticket_id integer,' +
                    'column_id integer,' +
                    'project_id integer,' +
                    'ticket_description varchar(255),' +
                    'deadline timestamp, ' +
                    'PRIMARY KEY (project_id, ticket_id) )',
                    [], function (finishedCreate) {
                      rwlock.unlock();
                      console.log("Created new project " + project_name);
                      callback(pid);
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
            console.log('Deleted project ' + pid);
            rwlock.unlock();
            callback(true);
          });
        });
      });
    });
  };

  this.deleteColumn = function (pid, cid, callback) {
    rwlock.writeLock(function () {
      pool.query('DELETE FROM columns_' + pid + ' WHERE column_id = $1::int', [cid], function (res) {
        rwlock.unlock();
        callback(true);
      });
    });
  };

  this.getTickets = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT * FROM tickets_' + pid + ' ORDER BY ticket_id ASC', [], function(res) {
        var tickets = [];
        res.rows.forEach(function (row) {
          //Create ticket objects
          tickets.push(new ticket.Ticket(row["ticket_id"], row["column_id"],
              row["ticket_description"], row["deadline"]));
        });
        rwlock.unlock();
        callback(tickets);
      });
    });
  };

  this.getKanban = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT project_id, project_name, column_id, column_title FROM project_table NATURAL JOIN columns_' + pid +
          ' ORDER BY column_id ASC', [], function(res) {

        var columns = [];
        var project_name = null;
        var project_id = null;
        res.rows.forEach(function (row) {
          //Get column ordering
          var c = new column.Column(row["column_id"], row["column_title"]);
          columns.push(c);
          project_name = row["project_name"];
          project_id = row["project_id"];
        });

        rwlock.unlock();
        callback(new kanban.Kanban(project_id, project_name, columns));
      });
    });
  };

  this.newTicket = function (pid, column_id, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT Max(ticket_id) FROM tickets_' + pid, [], function (res) {
        var tid;
        if (res.rows[0].max === null) {
          tid = 0;
        } else {
          tid = res.rows[0].max + 1;
        }
        pool.query('INSERT INTO tickets_' + pid + ' VALUES($1::int, $2::int, $3::int, \'\', NULL)',
            [tid, column_id, pid],
            function (insertion) {
              rwlock.unlock();
              callback();
            });
      });
    });
  };

  this.deleteTicket = function(pid, ticket_id, callback) {
    rwlock.writeLock(function () {
      pool.query('DELETE FROM tickets_' + pid + ' WHERE ticket_id = $1::int',
          [ticket_id], function (res) {
        rwlock.unlock();
        callback(true);
      });
    });
  };

  this.moveTicket = function (pid, ticket, toPosition, fromPos, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_position FROM columns_' + pid + ' NATURAL JOIN tickets_' + pid + ' ' +
          'WHERE ticket_id = $1::int', [ticket.ticket_id], function (checkResult) {
        if (checkResult.rows.length === 1) {
          if (checkResult.rows[0]["column_position"] === fromPos) {
            pool.query('SELECT column_id FROM columns_' + pid + ' WHERE column_position = $1::int',
                [toPosition], function (res) {
                  if (res.rows.length === 1) {
                    var cid = res.rows[0]["column_id"];
                    pool.query('UPDATE tickets_' + pid + ' SET column_id = $1::int WHERE ticket_id = $2::int',
                        [cid, ticket.ticket_id],
                        function (insertion) {
                          rwlock.unlock();
                          callback(true);
                        });
                  } else {
                    rwlock.unlock();
                    console.error("Error getting column id");
                  }
                });
          } else {
            rwlock.unlock();
            console.error("Error adding ticket: column_position is " + checkResult.rows[0]["column_position"]
                + " is not fromPos:" + fromPos);
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

  this.updateTicketDeadline = function (pid, ticket, datetime, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT ticket_id FROM tickets_' + pid + ' WHERE  ticket_id = $1::int',
          [ticket.ticket_id], function (res) {
            if (res.rows.length === 1) {
              pool.query('UPDATE tickets_' + pid + ' SET deadline = $1::text WHERE ticket_id = $2::int',
                  [datetime, ticket.ticket_id],
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

  this.getUsersProjects = function (username, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT project_id, project_name FROM users NATURAL JOIN project_table WHERE username = $1::text', [username], function (res) {
        if (res.rows.length > 0) {
          var array = [];
          for (var row of res.rows) {
            array.push({project_id:row.project_id, title:row.project_name});
          }
          rwlock.unlock();
          callback(array);
        } else {
          rwlock.unlock();
          console.error("User does not exist in db");
        }
      });
    });
  };

  this.addUserToProject = function (username, pid, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT username FROM users WHERE username = $1::text AND project_id = $2::int',
          [username, pid], function (checkRes) {
        if (checkRes.rows.length === 0 ) {
          pool.query('INSERT INTO users VALUES($1::text, $2::int)', [username, pid], function (res) {
            rwlock.unlock();
            callback(true);
          });
        } else {
          rwlock.unlock();
          console.error("User already exists in db");
        }
      });
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
          console.error("User does not exist in db");
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
          callback(array);
        } else {
          rwlock.unlock();
          console.error("Ticket does not exist in db");
        }
      });
    });
  };
}

module.exports.Database = Database;
