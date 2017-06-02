/**
 * Created by yianni on 25/05/17.
 */

//TODO: Need to handle errors.

var locks = require('locks');
var ticket = require('./ticket');
var column = require('./column');
var kanban = require('./kanban');

function Database(pool) {
  var rwlock = locks.createReadWriteLock();

  this.getTickets = function (pid, callback) {
    rwlock.readLock(function () {
      pool.query('SELECT ticket_id, ticket_description, column_id FROM project WHERE project_id = $1::int ORDER BY' +
          ' ticket_id ASC', [pid],
          function (res) {
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
      pool.query('SELECT DISTINCT project_name, column_title,' +
          ' column_id, column_position FROM project WHERE' +
          ' project_id = $1::int ORDER BY column_position ASC', [pid], function (res) {

        var columns = [];
        var project_name = null;
        res.rows.forEach(function (row) {
          //Get column orderin
          var c = new column.Column(row["column_id"], row["column_title"]);
          columns.push(c);
          project_name = row["project_name"]
        });

        rwlock.unlock();
        callback(new kanban.Kanban(project_name, columns));
      });
    });
  };

  this.newTicket = function (pid, column_id, callback) {
    rwlock.writeLock(function () {

      //Collect information for column being moved into
      pool.query('SELECT column_position, column_title, project_name, column_title ' +
          'FROM project WHERE project_id = $1::int AND column_position = $2::int', [pid, column_id],
          function (columnInfoResponse) {

            var columnInfo = columnInfoResponse.rows;
            //if (columnInfo.length === 0) throw new Error("New ticket can't be placed in a column that doesn't exist.");
            //Check all columns are the same

            /*for (var i = 1; i < columnInfo.length; i++) {
              if (columnInfo[i-1].column_id !== columnInfo[i].column_id)
                throw new Error("Column title has inconsistent associated values.");
            }*/

            columnInfo = columnInfo[0];

            try {
              pool.query('INSERT INTO project VALUES ($1::int, $2::text, $3::int, $4::text, ' +
                  '$5::int, (SELECT MAX(ticket_id)+1 FROM project WHERE project_id = $1::int), $6::text)',
                  [pid, 0, column_id, 'sup', column_id, "New ticket"],
                  function (insertion) {
                    //handle dealing with insertion

                    console.log(insertion);
                    callback();
                  });
            } catch (error) {
              console.error("Error creating new ticket in db.");
              console.error(error);
              throw new Error("Primary key value violated.");
            }
            rwlock.unlock();
          });
    });
  };

  this.moveTicket = function (pid, ticket, toPosition, fromPos, callback) {
    rwlock.writeLock(function () {
      //Get column information for toColumn
      pool.query('SELECT column_title, column_id FROM project ' +
          'WHERE project_id = $1::int AND column_position = $2::int', [pid, toPosition],
          function (toColumnInfoResponse) {
           console.log("made is here");
            var toColumnInfo = toColumnInfoResponse.rows;
            //TODO: Need to make sure info in arguments provided and database state is correct and consistent
            //if (toColumnInfo.length === 0) throw new Error("Can't move ticket to a column that doesn't exist.");

            /*if (!toColumnInfo.reduce(function (total, next) {
                  return total === next
                })) throw new Error("Column title has inconsistent associated values.");
            */
            //toColumnInfo = toColumnInfo[0];

            pool.query('UPDATE project SET column_id = $1::int, column_position = $2::int, column_title = $3::text ' +
                ' WHERE project_id = $4::int AND ticket_id = $5::int', [toPosition /*Current hack, as position == id*/,
              toPosition, 'sup', pid, ticket.ticket_id], function (res) {
              rwlock.unlock();
              console.log("Finished updating");
              callback(true);
            });
      });
    });
  };

  this.updateTicketDesc = function (pid, ticket, newDescription, callback) {
    rwlock.writeLock(function () {
      pool.query('UPDATE project SET ticket_description = $1::text ' +
          ' WHERE project_id = $2::int AND ticket_id = $3::int', [newDescription, pid, ticket.ticket_id], function (res) {
        rwlock.unlock();
        callback(true);
      });
    });
  };
}

module.exports.Database = Database;