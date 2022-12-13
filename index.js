var utils = require('./src/utils');
var smoother = require('./src/smoother')

var repos = utils.readRepoFile()

console.log(repos)
console.log('Scanning ' + repos.length + ' repos')

function buildStep(item) {
    return {
        repo: item,
        action: (endCB) => {
            utils.cloneRepo(item, (repoName) => {
                var struct = utils.scanFolder(repoName)
                var res = utils.processStruct(struct)
                utils.saveToFile(res, repoName+'.json')
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

smoother.start(actionList, () => {
    var result = utils.processOverallResults()
    utils.saveToFile(result, '../finalResults.json')
})

/*

Dockerfile doesn't need to be called a Dockerfile - how to indentify?
Compose file - how to identfy?

*/