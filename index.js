var utils = require('./src/utils');
 


//var repo = utils.readRepoArgs(process.argv)
var repo = 'https://github.com/BretFisher/example-voting-app.git'

utils.print(repo);
utils.cloneRepo(repo, (repoName) => {
    console.log(repoName)
    var struct = utils.scanFolder(repoName)
    utils.saveToFile(struct, 'test.json')
})



//var test = process.argv
//utils.print(test);
//utils.saveToFile(test, 'test.json');
