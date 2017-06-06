/**
 * Created by yianni on 25/05/17.
 */

function Kanban(proj_id, proj_name, columns) {
    this.project_name = proj_name;
    this.columns = columns;
    this.project_id = proj_id;
}

module.exports.Kanban = Kanban;
