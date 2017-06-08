var github = require('octonode');
var client = github.client();

var ghme = client.me();
var ghrepo = null;

// Get the contents of a path in repository
//
// ghrepo.contents('lib/index.js', callback); //path
// ghrepo.contents('lib/index.js', 'v0.1.0', callback); //path

function setGHRepo(username, repositoryName) {
  ghrepo = client.repo(username+"/"+repositoryName);
}

function printRepos() {
  ghrepo.contents('', "master", function(err, results, body, headers){
    for (result of results) {
      console.log(result.download_url);
    }
  });
}

module.exports = {
  setGHRepo :setGHRepo,
  printRepos : printRepos
};