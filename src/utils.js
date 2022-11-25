const clone = require('git-clone');
const fs = require('fs');

const TEMP_DIR = "./temp/"
const OUTPUT_DIR = "./outputs/"

module.exports = {


    print: function (params) {
        console.log(params)
    },

    readRepoArgs: function (args) {
        return args[2]
    },

    cloneRepo: function (repoUrl) {
        var repoTokens = repoUrl.split("/")
        var repoName = repoTokens[repoTokens.length - 1]
        var path = TEMP_DIR + repoName

        if (fs.existsSync(path)) {
            fs.rmSync( path, {recursive:true} )
        }

        clone(repoUrl, path, (error) => {
            if (error)
                console.log(error)
        })
        return repoName
    },

    scanFolder: function (name) {

    },

    saveToFile: function (data, filename) {
        fs.writeFileSync(OUTPUT_DIR + filename, JSON.stringify(data, null, 2))
    }


};