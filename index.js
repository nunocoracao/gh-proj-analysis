var utils = require('./src/utils');
 


//var repo = utils.readRepoArgs(process.argv)
var repo = 'https://github.com/BretFisher/example-voting-app.git'

//this needs to be timout'd

utils.print(repo);
utils.cloneRepo(repo, (repoName) => {
    console.log(repoName)
    var struct = utils.scanFolder(repoName)
    //process
    utils.saveToFile(struct, 'test.json')
})



//var test = process.argv
//utils.print(test);
//utils.saveToFile(test, 'test.json');


/*

Dockerfile doesn't need to be called a Dockerfile - how to indentify?
Compose file - how to identfy?

*/