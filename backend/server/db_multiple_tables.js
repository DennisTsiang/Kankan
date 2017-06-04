
var locks = require('locks');
var ticket = require('./ticket');
var kanban = require('./kanban');

function Database(pool) {
  var rwlock = locks.createReadWriteLock();

  this.newProject = function (project_name, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT Max(project_id) FROM project', function (res) {
        var pid;
        if (res.rows.length === 0) {
          pid = 0;
        } else {
          pid = res.rows[0]["project_id"] + 1;
        }
        console.log("New project id is " + pid);
        pool.query('INSERT $1::int, $2::text INTO project', [pid, project_name], function (insertion) {
          pool.query('CREATE TABLE columns_$1::int (' +
              'project_id integer Primary Key' +
              'column_id integer Primary Key,' +
              'column_title varchar(255) not null,' +
              'column_position integer not null );',
              [pid], function (create) {
                pool.query('CREATE TABLE tickets_$1::int (' +
                    'ticket_id integer Primary Key,' +
                    'column_id integer,' +
                    'project_id integer Primary Key,' +
                    'ticket_description varchar(255) );',
                    [pid], function (finishedCreate) {
                      rwlock.unlock();
                      callback(true);
                    });
              });
        });
      });
    });
  };

  this.getTickets = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT * FROM tickets_$1::int ORDER BY ticket_id ASC', [pid], function(res) {
        var tickets = [];
        res.rows.forEach(function (row) {
          //Create ticket objects
          tickets.push(new ticket.Ticket(row["ticket_id"], row["column_id"], row["ticket_description"]));
        });
        rwlock.unlock();
        callback(tickets);
      });
    });
  };

  this.getKanban = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT project_name, column_id, column_position FROM project NATURAL JOIN column_$1::int' +
          ' ORDER BY column_id ASC', [pid], function(res) {

      });
    });
  };

  this.newTicket = function (pid, ticket, columnPos, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_id FROM columns_$1::int WHERE column_position = $2', [pid, columnPos], function (res) {
        if (res.rows.length === 1) {
          var cid = res.rows[0]["column_id"];
          pool.query('INSERT $1::int, $2::int, $3::int, $4::text INTO ticket_$3::int', [ticket.ticket_id, cid, pid, ticket.desc],
            function (insertion) {
              rwlock.unlock();
              callback(ticket, columnPos);
            });
        } else {
          rwlock.unlock();
          Error("Error getting column id");
        }
      });

    });
  };

  this.moveTicket = function (pid, ticket, toPosition, fromPos, callback) {
    rwlock.writeLock(function () {
      pool.query('SELECT column_id FROM columns_$1::int WHERE column_position = $2::int', [pid, toPosition], function (res) {
        if (res.rows.length === 1) {
          var cid = res.rows[0]["column_id"];
          pool.query('UPDATE ticket_$1::int SET column_id = $2::int WHERE ticket_id = $3::int', [pid, cid, ticket.ticket_id],
            function (insertion) {
              rwlock.unlock();
              callback(true);
            });
        } else {
          rwlock.unlock();
          Error("Error getting column id");
        }
      });
    });
  };

  this.updateTicketDesc = function (pid, ticket, newDescription, callback) {
    rwlock.writeLock(function () {
      pool.query('UPDATE ticket_$1::int SET ticket_description = $2::text WHERE ticket_id = $3::int',
          [pid, newDescription, ticket.ticket_id],
        function (insertion) {
          rwlock.unlock();
          callback(true);
        });
    });
  };

  module.exports.Database = Database;
}