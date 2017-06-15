/**
 * Created by yianni on 25/05/17.
 */

function Kanban(proj_id, proj_name, columns, gh_url) {
    this.project_name = proj_name;
    this.columns = columns;
    this.project_id = proj_id;
    this.gh_url = gh_url;
}

module.exports.Kanban = Kanban;
