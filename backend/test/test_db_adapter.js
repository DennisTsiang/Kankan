/**
 * Created by tja115 on 01/06/17.
 */
var sinon = require('sinon');

function Database () {
 this.getTickets = sinon.spy();
 this.getKanban = sinon.spy();
 this.newTicket = sinon.spy();
 this.moveTicket = sinon.spy();
 this.updateTicketDesc = sinon.spy();
}

module.exports.Database = Database;