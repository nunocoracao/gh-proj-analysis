require('dotenv-safe').config();
const githubSearchRepos = require('github-search-repos');
var utils = require('./src/utils');

var searchQueries = [
    'javascript',
    'go'
]

currentIndex = 0

var results = []

var searchGH = (query, callback) => {
    console.log('Search using query: ' + query)
    githubSearchRepos(query, { token: process.env.TOKEN, sort: 'stars' }).then(data => {
        callback(data.items);
    });
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
        results.push(obj)
    }

    //run next
    currentIndex++
    if(currentIndex < searchQueries.length){
        searchGH(searchQueries[currentIndex], processResult)
    } else {
        console.log('Saving ' + results.length + ' entries to file')
        utils.saveToFile(results, '../repos.json')
    }
}

searchGH(searchQueries[currentIndex], processResult)