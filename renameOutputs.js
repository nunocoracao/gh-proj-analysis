const fs = require('fs');

//const OUTPUT_DIR = "./outputs/"
const OUTPUT_DIR = "./outputs.min/"

fs.readdirSync(OUTPUT_DIR).every(file => {
    console.log('reading file: ' + file)
    var data = JSON.parse(fs.readFileSync(OUTPUT_DIR + file))
    //console.log(data.info)

    var repoTokens = data.info.clone_url.split("/")
    var repoName = repoTokens[repoTokens.length - 2] + '_' + repoTokens[repoTokens.length - 1]
    var path = OUTPUT_DIR + repoName + '.json'

    //console.log(OUTPUT_DIR + file)
    //console.log(path)

    console.log('renaming file ' + OUTPUT_DIR + file + ' to ' + path)

    fs.renameSync(OUTPUT_DIR + file, path)


    return true;
})