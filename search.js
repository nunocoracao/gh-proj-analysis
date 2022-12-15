const fs = require('fs');

const OUTPUT_DIR = "./outputs/"

//Query
var language = 'Go'
var dockerfileCountMin = 200
var dockerfileCountMax = 100000
var composeCountMin = 0
var composeCountMax = 1000000


fs.readdirSync(OUTPUT_DIR).forEach(file => {
    var data = JSON.parse(fs.readFileSync(OUTPUT_DIR + '/' + file))

    if(!language || data.info.language == language){

        if(data.results.dockerfile.count >= dockerfileCountMin &&
            data.results.dockerfile.count <= dockerfileCountMax &&
            data.results.composefile.count >= composeCountMin &&
            data.results.composefile.count <= composeCountMax)
        console.log(data.info.clone_url)

    }

})