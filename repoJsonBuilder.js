const fs = require('fs');
require('dotenv-safe').config();
const githubSearchRepos = require('./src/ghCrawler.js');
var utils = require('./src/utils');

var searchQueries = [
    'cmake',
    'make',
    'shell',
    'react',
    'vue',
    'algorithm',
    'network',
    'persistence',
    'crawler',
    'spider',
    'emulator',
    'oem',
    'note',
    'social',
    'chat',
    'wasm',
    'web assembly',
    'wasi',
    'script',
    'shell',
    'qa',
    'test',
    'mobi',
    'podman',
    'rancher',
    'Cloud Foundation',
    'cncf',
    'cluster',
    'cloud',
    'serverless',
    'iot',
    'compute',
    'container',
    'image',
    'docker hub',
    'farm',
    'lambda',
    'lsp',
    'event',
    'system',
    'project',
    'infra',
    'PaaS',
    'IaaS',
    'digital ocean',
    'heroku',
    'distributed',
    'parallel',
    'process',
    'cdr',
    'om',
    'spring',
    'nosql',
    'nodejs',
    'blockchain',
    'framework',
    'express',
    'server',
    'notificaitons',
    'helm',
    'docker swarm',
    'push',
    'hadoop',
    'decentralized',
    'bot',
    'ai',
    'machine learning',
    'mobile',
    'security',
    'dashboard',
    'nginx',
    'elasticsearch',
    'wordpress',
    'oauth',
    'saas',
    'redis',
    'aws',
    'dynamo',
    'aurora',
    'postgres',
    'mongodb',
    'pull',
    'c sharp',
    'netflix',
    'facebook',
    'google',
    'amazon',
    'microsoft',
    'azure',
    'tensorflow',
    'terraform',
    'kubernetes',
    'docker samples',
    'paas',
    'database',
    'cms',
    'memory',
    'model',
    'ai',
    'crypto',
    'web3',
    'decentralized',
    'node',
    'javascript',
    'typescript',
    'java',
    'python',
    'html',
    'css',
    'go',
    'rust',
    'ruby',
    'php',
    'sql',
    'c++',
    'c',
    'dart',
    'swift',
    'scala',
    'sample',
    'kotlin',
    'android',
    'ios',
    'dockerfile',
    'compose',
    'docker',
    'docker compose',
    'kubernetes',
    'api',
    'ml',
]

currentIndex = 0

var results = {}

var searchGH = (query, callback) => {
    console.log('Search using query: ' + query)
    githubSearchRepos(query, { token: process.env.TOKEN, sort: 'stars'  /* stars | forks | updated */ }, (data) => {
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