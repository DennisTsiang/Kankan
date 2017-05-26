/**
 * Created by yianni on 25/05/17.
 */

var await = require('asyncawait/await');
var async = require('asyncawait/async');

var ticket = require('./ticket');
var kanban = require('./kanban');
const pool = require('./db');

function Database() {

    this.getTickets = async (function (pid) {
        var res = await (pool.query('SELECT ticket_id, ticket_description, column_id FROM project WHERE project_id = $1::int',
            [pid]));

        var tickets = [];
        res.rows.forEach(function (row) {
            //Create ticket objects

            tickets.push(new ticket.Ticket(row["ticket_id"], row["ticket_description"], row["column_id"]));
        });

        return tickets;
    });

    this.getKanban = async (function (pid) {
        var res = await (pool.query('SELECT project_name, column_id, column_position FROM project WHERE project_id = $1::int ' +
            'ORDER BY column_position DESC', [pid]));

        var column_order = [];
        var project_name = null;
        res.rows.forEach(function (row) {
            //Get column ordering

            column_order.push(row["column_id"]);
            project_name = row["project_name"]
        });

        return new kanban.Kanban(project_name, column_order);
    });

    //TODO: Need to make sure database isn't changed duing execution of one of these methods.
    this.newTicket = async (function (pid, ticket, columnName) {
        try {

            //TODO: Check if ticket already exists eg ticket id.
            //TODO: Check columnInfo value is valid for current ticket location.

            //Collect information for column being moved into
             var columnInfoResponse = await (pool.query('SELECT column_id, column_position, project_name, column_title ' +
                 'FROM project WHERE project_id = $1::int AND column_title = $2::text', [pid, columnName]));

            var columnInfo = columnInfoResponse.rows;
            if (columnInfo.length === 0);//TODO: Return error -> 'bok' response.
            columnInfo = columnInfo[0];


            var insertion = await (pool.query('INSERT INTO project VALUES ($1::int, $2::text, $3::int, $4::text, ' +
                '$5::int, $6::int, $7::text)',
                [pid, columnInfo['project_name'], ticket.column_id, columnInfo['column_title'],
                    columnInfo['column_position'], ticket.id, ticket.desc]));

        } catch (error) {
            console.error("Error creating new ticket in db.");
            console.error(error);
        }
    });

    //TODO: Need to make sure database isn't changed duing execution of one of these methods.
    this.moveTicket = async (function (pid, ticket, toColumnName, fromColumnName) {
        try {

            //TODO: Check fromColumnName value is valid for current ticket location.

            //Get column information for toColumn
            var toColumnInfoResponse = await (pool.query('SELECT column_id, column_position FROM project ' +
                'WHERE project_id = $1::int AND column_title = $2::text', [pid, toColumnName]));
            var toColumnInfo = toColumnInfoResponse.rows;
            if (toColumnInfo.length === 0);//TODO: Return error -> 'bok' response.
            toColumnInfo = toColumnInfo[0];

            var res = await (pool.query('UPDATE project SET column_id = $1::int, column_position = $2::int, column_title = $3::text ' +
                ' WHERE project_id = $4::int AND ticket_id = $5::int',  [toColumnInfo["column_id"], toColumnInfo["column_position"], toColumnName, pid, ticket.id]));

        } catch (error) {
            console.error("Error moving ticket in db.");
            console.error(error);
        }
    });

    this.updateTicketDesc = async (function (pid, ticket, newDescription) {
        var res = await (pool.query('UPDATE project SET ticket_description = $1::text '+
            ' WHERE project_id = $2::int AND ticket_id = $3::int',  [newDescription, pid, ticket.id]));
    });
}

module.exports.Database = Database;