var utils = require('./src/utils');
var smoother = require('./src/smoother')

var repos = utils.readRepoFile()

console.log('Scanning ' + repos.length + ' repos')

var total_repos = 0

function buildStep(item, info) {
    return {
        repo: item,
        action: (endCB) => {
            if (!utils.alreadyProcessed(item)) {
                utils.cloneRepo(item, (repoName) => {
                    var struct = utils.scanFolder(repoName)
                    var res = utils.processStruct(struct)
                    res.info = info
                    utils.saveToFile(res, repoName + '.json')
                    utils.deleteRepo(item) //delete repo after processing
                    endCB()
                }, () => {
                    endCB()
                })
            } else {
                endCB()
            }
        }
    }
}

var actionList = []
for (var i in repos) {
    total_repos++
    var step = buildStep(repos[i].clone_url, repos[i])
    actionList.push(step)
}
console.log(total_repos)

smoother.start(actionList, () => {
    console.log('end')
})