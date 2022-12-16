var utils = require('./src/utils');

var result = utils.processOverallResults()

var languages = result.languages
delete result.languages

utils.saveToFile(result, '../final/0-Final_Result_Overall.json')

for(var lang in languages){
    utils.saveToFile(languages[lang], '../final/Res_'+lang+'.json')
}
