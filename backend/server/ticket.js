/**
 * Created by yianni on 25/05/17.
 */

function Ticket(id, column_id, desc, datetime) {
    this.id = id;
    this.desc = desc;
    this.column_id = column_id;
    this.datetime = datetime;
}

module.exports.Ticket = Ticket;
