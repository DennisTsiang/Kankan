/**
 * Created by yianni on 25/05/17.
 */

function Ticket(id, column_id, desc) {
    this.id = id;
    this.desc = desc;
    this.column_id = column_id;
}

module.exports.Ticket = Ticket;
