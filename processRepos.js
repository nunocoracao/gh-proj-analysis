var utils = require('./src/utils');
var smoother = require('./src/smoother')

var repos = utils.readRepoFile()

console.log('Scanning ' + repos.length + ' repos')

function buildStep(item) {
    return {
        repo: item,
        action: (endCB) => {
            if (!utils.alreadyProcessed(item)) {
                utils.cloneRepo(item, (repoName) => {
                    var struct = utils.scanFolder(repoName)
                    var res = utils.processStruct(struct)
                    utils.saveToFile(res, repoName + '.json')
                    //utils.deleteRepo(item) //delete repo after processing
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
    var step = buildStep(repos[i].clone_url)
    actionList.push(step)
}

smoother.start(actionList, () => {
    console.log('end')
})