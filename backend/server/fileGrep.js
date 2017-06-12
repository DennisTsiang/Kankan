var grep = require('simple-grep');
/* Usage
 grep('search string', 'a directory or file', function(list){
 console.log(list);
 });

 */

function findString(string) {
  var escapedString = string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  // start search
  grep(escapedString, 'backend/GitRepos/', function (list) {
    for (var entry of list) {
      console.log("File: " + entry.file);
      for (var result of entry.results) {
        console.log("\tLine number: " + result.line_number);
      }
    }
  });
}

module.exports = {
  findString : findString,
};
