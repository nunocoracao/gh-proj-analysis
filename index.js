var utils = require('./src/utils');
 


//var repo = utils.readRepoArgs(process.argv)
var repo = 'https://github.com/BretFisher/example-voting-app.git'

utils.print(repo);
var repoName = utils.cloneRepo(repo)

console.log(repoName)

//var test = process.argv
//utils.print(test);
//utils.saveToFile(test, 'test.json');
