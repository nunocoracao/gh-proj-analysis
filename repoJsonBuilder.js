const fs = require('fs');
require('dotenv-safe').config();
const githubSearchRepos = require('./src/ghCrawler.js');
var utils = require('./src/utils');

var searchQueries = [
    'javascript',
    //'typescript',
    //'java',
    //'python',
    //'html',
    //'css',
    //'go',
    //'rust',
    //'ruby',
    //'php',
    //'sql',
    //'c#',
    //'c++',
    //'c',
    //'dart',
    //'swift',
    //'scala',
    //'sample',
    //'kotlin',
    //'android',
    //'ios',
    //'dockerfile',
    //'compose',
    //'docker',
    //'docker compose',
    //'kubernetes',
    //'api',
    //'ml',
]

currentIndex = 0

var results = {}

var searchGH = (query, callback) => {
    console.log('Search using query: ' + query)
    githubSearchRepos(query, { token: process.env.TOKEN, sort: 'stars' }, (data) => {
        callback(data.items);
    });
}

var saveToFile = () => {
    var res_array = []
    var url_array = []
    for (var i in results) {
        res_array.push(results[i])
        url_array.push(results[i].clone_url)
    }
    console.log('Saving ' + res_array.length + ' entries to file')
    utils.saveToFile(res_array, '../repos.json')
    utils.saveToFile(url_array, '../repos_url.json')
}

var processResult = (items) => {
    console.log('Processing ' + items.length + ' items')

    for (var i in items) {
        var obj = {
            id: items[i].id,
            name: items[i].name,
            full_name: items[i].full_name,
            owner: {
                login: items[i].owner.login,
                html_url: items[i].owner.html_url,
                type: items[i].owner.type,
            },
            html_url: items[i].html_url,
            description: items[i].description,
            url: items[i].url,
            clone_url: items[i].clone_url,
            homepage: items[i].homepage,
            size: items[i].size,
            stargazers_count: items[i].stargazers_count,
            watchers_count: items[i].watchers_count,
            language: items[i].language
        }
        results[items[i].id] = obj //avoid duplicates
    }

    //run next
    currentIndex++
    saveToFile()

    if (currentIndex < searchQueries.length) {
        searchGH(searchQueries[currentIndex], processResult)
    }
}

if (fs.existsSync('repos.json')) {
    var alreadyLoaded = JSON.parse(fs.readFileSync('repos.json'))
    for (var i in alreadyLoaded)
        results[alreadyLoaded[i].id] = alreadyLoaded[i]
}
searchGH(searchQueries[currentIndex], processResult)