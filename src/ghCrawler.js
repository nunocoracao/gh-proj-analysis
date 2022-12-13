const axios = require('axios');

const LIMIT_PER_REQUEST = 1000
const INTERVAL = 2000

var crawlLikeABoss = (query, opts, callback, preData, page) => {

    setTimeout(() => {
        var data = preData ? preData : null
        page = page ? page : 1

        let url = `search/repositories?q=${query}`;

        if (opts.sort === 'forks' || opts.sort === 'stars' || opts.sort === 'updated') {
            url += `&sort=${opts.sort}`;
        }

        if (page)
            url += `&page=${page}`;

        axios({
            method: 'get',
            baseURL: 'https://api.github.com',
            url: url,
            headers: {
                accept: 'application/vnd.github.v3+json',
                'user-agent': 'https://github.com/sindresorhus/gh-got',
                'Authorization': 'Token ' + opts.token
            },
            responseType: 'json',
        }).then(function (response) {

            if (data) {
                data.items = data.items.concat(response.data.items)
            } else {
                data = response.data
            }

            for(var i in response.data.items)
                console.log(response.data.items[i].clone_url)


            if (data.items.length < LIMIT_PER_REQUEST && data.items.length < data.total_count) {
                console.log('getting more data')
                crawlLikeABoss(query, opts, callback, data, page + 1)
            } else
                callback(data)
        });
    }, INTERVAL)
};

module.exports = crawlLikeABoss