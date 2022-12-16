const fs = require('fs')

fs.readdirSync('./outputs').forEach(file => {
    if (!fs.existsSync('./outputs.min/' + file)) {
        console.log('minifying file: ' + file)
        var data = JSON.parse(fs.readFileSync('./outputs/' + file))
        delete data.struct
        fs.writeFileSync('./outputs.min/' + file, JSON.stringify(data, null, 2))
    }
})

