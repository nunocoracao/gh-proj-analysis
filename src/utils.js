const clone = require('git-clone');
const fs = require('fs');

const TEMP_DIR = "./temp/"
const OUTPUT_DIR = "./outputs/"
const REPOS_FILE = "./repos.json"


module.exports = {


    print: function (text) {
        console.log('Utils > ' + text)
    },

    readRepoArgs: function (args) {
        return args[2]
    },

    readRepoFile: function () {
        var repos = JSON.parse(fs.readFileSync(REPOS_FILE))
        return repos
    },

    cloneRepo: function (repoUrl, callback) {
        var repoTokens = repoUrl.split("/")
        var repoName = repoTokens[repoTokens.length - 1]
        var path = TEMP_DIR + repoName

        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true })
        }

        clone(repoUrl, path, (error) => {
            if (error)
                console.log(error)
            else
                callback(repoName)
        })
    },

    scanFolder: function (folder) {
        var path = TEMP_DIR+folder
        var struct = {}
        var files = fs.readdirSync(TEMP_DIR+folder, {withFileTypes:true})
        for(var i in files){
            struct[files[i].name] = {}
            struct[files[i].name].path = path + "/" + files[i].name
            struct[files[i].name].isDir = files[i].isDirectory()
            if(struct[files[i].name].isDir){
                struct[files[i].name].children = this.scanFolder(folder + '/' + files[i].name)
            }
        }
        return struct
    },

    saveToFile: function (data, filename) {
        fs.writeFileSync(OUTPUT_DIR + filename, JSON.stringify(data, null, 2))
    }


};