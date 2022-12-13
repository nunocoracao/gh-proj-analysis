var utils = require('./src/utils');
var smoother = require('./src/smoother')


var repos = utils.readRepoFile()

console.log(repos)

function buildStep(item) {
    return {
        repo: item,
        action: (endCB) => {
            console.log(item)
            utils.cloneRepo(item, (repoName) => {
                utils.print('cloning ' + repoName)
                var struct = utils.scanFolder(repoName)
                utils.saveToFile(struct, repoName+'.json')
                endCB()
            })
        }
    }
}

var actionList = []
for (var i in repos) {
    var step = buildStep(repos[i].clone_url)
    actionList.push(step)
}

console.log(actionList)

smoother.start(actionList, () => {
    //overall process
    console.log(end)
})

/*

Dockerfile doesn't need to be called a Dockerfile - how to indentify?
Compose file - how to identfy?

*/