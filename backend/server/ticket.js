/**
 * Created by yianni on 25/05/17.
 */

function Ticket(id, column_id, desc, datetime, files) {
    this.id = id;
    this.desc = desc;
    this.column_id = column_id;
    this.datetime = datetime;
    this.files = files;
}

module.exports.Ticket = Ticket;
