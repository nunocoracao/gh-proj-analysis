const clone = require('git-clone');
const fs = require('fs');

const TEMP_DIR = "./temp/"
const OUTPUT_DIR = "./outputs/"
const REPOS_FILE = "./oldrepos.json"

const dockerfile_regex = /[Dd]ockerfile.*/;
const compose_regex = /.*[Cc]ompose.*ya*ml/;

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

        this.print('cloning ' + repoName)

        clone(repoUrl, path, (error) => {
            if (error)
                console.log(error)
            else
                callback(repoName)
        })
    },

    scanFolder: function (folder) {
        var path = folder
        var struct = {}
        var files = fs.readdirSync(TEMP_DIR + folder, { withFileTypes: true })

        this.print('scanning ' + path)

        for (var i in files) {
            struct[files[i].name] = {}
            struct[files[i].name].name = files[i].name
            struct[files[i].name].path = path + "/" + files[i].name
            struct[files[i].name].isDir = files[i].isDirectory()
            struct[files[i].name].isDockerfile = files[i].name.match(dockerfile_regex) ? true : false;
            struct[files[i].name].isComposefile = files[i].name.match(compose_regex) ? true : false;
            if (struct[files[i].name].isDir) {
                struct[files[i].name].children = this.scanFolder(folder + '/' + files[i].name)
            }
        }
        return struct
    },

    processStruct: function (struct) {
        this.print('processing structure for important files')
        var obj = {
            results: this.processStructAux(struct),
            struct: struct
        }
        return obj
    },

    processStructAux: function (struct) {
        var res = {
            dockerfile: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            },
            composefile: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            }
        }

        var directories = []

        for(var i in struct){

            if(struct[i].isDockerfile){
                res.dockerfile.exist = true
                res.dockerfile.count++
                res.dockerfile.rootCount++
                res.dockerfile.filepaths.push(struct[i].path)
            }else if(struct[i].isComposefile){
                res.composefile.exist = true
                res.composefile.count++
                res.composefile.rootCount++
                res.composefile.filepaths.push(struct[i].path)
            } else if(struct[i].isDir){
               directories.push(struct[i])
            }
        }

        for(var d in directories){
            var temp = this.processStructAux(directories[d].children)
            res.dockerfile.exist = temp.dockerfile.exist? true : res.dockerfile.exist
            res.dockerfile.count += temp.dockerfile.count
            res.dockerfile.subFolderCount += temp.dockerfile.rootCount + temp.dockerfile.subFolderCount
            res.dockerfile.filepaths = res.dockerfile.filepaths.concat(temp.dockerfile.filepaths)
            res.composefile.exist = temp.composefile.exist? true : res.composefile.exist
            res.composefile.count += temp.composefile.count
            res.composefile.subFolderCount += temp.composefile.rootCount + temp.composefile.subFolderCount
            res.composefile.filepaths = res.composefile.filepaths.concat(temp.composefile.filepaths)
        }

        return res
    },

    processOverallResults: function () {
        this.print('processing overall results')
        fs.readdirSync(OUTPUT_DIR).forEach(file => {
            console.log(file);
        });
        return {}
    },

    saveToFile: function (data, filename) {
        this.print('saving data to ' + filename)
        fs.writeFileSync(OUTPUT_DIR + filename, JSON.stringify(data, null, 2))
    }


};