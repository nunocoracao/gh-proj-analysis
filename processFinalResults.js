var utils = require('./src/utils');

var result = utils.processOverallResults()
utils.saveToFile(result, '../finalResults.json')
