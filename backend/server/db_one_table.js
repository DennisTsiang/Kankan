/**
 * Created by yianni on 25/05/17.
 */

var await = require('asyncawait/await');
var async = require('asyncawait/async');
var locks = require('locks');
var ticket = require('./ticket');
var kanban = require('./kanban');

function Database(pool) {
  var rwlock = locks.createReadWriteLock();

  this.getTickets = async(function (pid, callback) {
    rwlock.readLock(function () {
      var res = await(pool.query('SELECT ticket_id, ticket_description, column_id FROM project WHERE project_id = $1::int',
          [pid]));

      var tickets = [];
      res.rows.forEach(function (row) {
        //Create ticket objects
        tickets.push(new ticket.Ticket(row["ticket_id"], row["ticket_description"], row["column_id"]));
      });
      rwlock.unlock();
      callback(tickets);
    });
  });

  this.getKanban = async(function (pid, callback) {
    rwlock.readLock(function () {
      var res = await(pool.query('SELECT project_name, column_id, column_position FROM project WHERE project_id = $1::int ' +
          'ORDER BY column_position DESC', [pid]));

      var column_order = [];
      var project_name = null;
      res.rows.forEach(function (row) {
        //Get column ordering

        column_order.push(row["column_id"]);
        project_name = row["project_name"]
      });

      callback(new kanban.Kanban(project_name, column_order));
      rwlock.unlock();
    });
  });

  this.newTicket = async(function (pid, ticket, columnName) {
    rwlock.writeLock(function () {

      //Check if ticket already exists
      var check_ticket = await(pool.query('SELECT project_name FROM project ' +
          'WHERE ticket_id = $1::int AND project_id = $2::int', [ticket.id, pid]));
      if (check_ticket.rows.length > 0) throw "Ticket already exists";

      //Collect information for column being moved into
      var columnInfoResponse = await(pool.query('SELECT column_id, column_position, project_name, column_title ' +
          'FROM project WHERE project_id = $1::int AND column_title = $2::text', [pid, columnName]));

      var columnInfo = columnInfoResponse.rows;
      if (columnInfo.length === 0) throw "New ticket can't be placed in a column that doesn't exist.";
      if (!columnInfo.reduce(function (total, next) {
            return total === next
          })) throw "Column title has inconsistent associated values.";

      columnInfo = columnInfo[0];

      try {
        var insertion = await(pool.query('INSERT INTO project VALUES ($1::int, $2::text, $3::int, $4::text, ' +
            '$5::int, $6::int, $7::text)',
            [pid, columnInfo['project_name'], ticket.column_id, columnInfo['column_title'],
              columnInfo['column_position'], ticket.id, ticket.desc]));
      } catch (error) {
        console.error("Error creating new ticket in db.");
        console.error(error);
        throw "Primary key value violated."
      }
      rwlock.unlock();
    });
  });

  this.moveTicket = async(function (pid, ticket, toColumnName, fromColumnName) {
    rwlock.writeLock(function () {
      //Check valid current location
      var checkCurrentColumn = await(pool.query('SELECT column_id FROM project WHERE' +
          ' column_name = $1::text AND ticket_id = $2::int AND project_id = $3::int',
          [fromColumnName, ticket.id, pid]));
      if (checkCurrentColumn.rows.length !== 1) throw "Ticket is currently in multiple columns.";

      //Get column information for toColumn
      var toColumnInfoResponse = await(pool.query('SELECT column_id, column_position FROM project ' +
          'WHERE project_id = $1::int AND column_title = $2::text', [pid, toColumnName]));
      var toColumnInfo = toColumnInfoResponse.rows;
      if (toColumnInfo.length === 0) throw "Can't move ticket to a column that doesn't exist.";
      if (!toColumnInfo.reduce(function (total, next) {
            return total === next
          })) throw "Column title has inconsistent associated values.";

      toColumnInfo = toColumnInfo[0];

      var res = await(pool.query('UPDATE project SET column_id = $1::int, column_position = $2::int, column_title = $3::text ' +
          ' WHERE project_id = $4::int AND ticket_id = $5::int', [toColumnInfo["column_id"], toColumnInfo["column_position"], toColumnName, pid, ticket.id]));

      rwlock.unlock();
    });
  });

  this.updateTicketDesc = async(function (pid, ticket, newDescription) {
    rwlock.writeLock(function () {
      var res = await(pool.query('UPDATE project SET ticket_description = $1::text ' +
          ' WHERE project_id = $2::int AND ticket_id = $3::int', [newDescription, pid, ticket.id]));
      rwlock.unlock();
    });
  });
}

module.exports.Database = Database;