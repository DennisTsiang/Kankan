var github = require('octonode');
const https = require('https');
var client = github.client();
var fs = require('fs');

var ghme = client.me();
var ghrepo = null;
var path = "backend/GitRepos/";

// Get the contents of a path in repository
//
// ghrepo.contents('lib/index.js', callback); //path
// ghrepo.contents('lib/index.js', 'v0.1.0', callback); //path

function setGHRepo(username, repositoryName) {
  ghrepo = client.repo(username+"/"+repositoryName);
}

function printRepos(branch) {
  clearGitReposFolder(
    function() {
      ghrepo.contents('', branch, function(err, results, body, headers){
        //console.log(results);
        for (result of results) {
          if (result.type !== "file") {
            continue;
          }
          var filename = result.name;
          getFileContent(filename, result.download_url);
          console.log(result.download_url);
        }
      })
    }
  );
}

function getFileContent(filename, url) {
  https.get(url, function(res) {
    //console.log("Got response: " + res.statusCode);

    res.on('data', function(d) {
      fs.writeFile(path + filename, d.toString(), {flag: 'a+'}, function(err) {
        if (err) {
          return console.log(err);
        } else {
          console.log("Wrote to " + filename);
        }
      });
    });

  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

function clearGitReposFolder(callback) {
  fs.readdir(path, function(err, items) {
    for (item of items) {
      console.log(path + item);
      fs.unlink(path + item);
    }
    callback();
  });
}

module.exports = {
  setGHRepo :setGHRepo,
  printRepos : printRepos,
  clearGitReposFolder : clearGitReposFolder
};