require('dotenv-safe').config();
const githubSearchRepos = require('github-search-repos');
 
/*githubSearchRepos('gulp+language:javascript', {token: process.env.TOKEN}).then(data => {
    console.log(data.items);
    //=> [{id: 11167738, name: 'gulp', full_name: 'gulpjs/gulp', ...}, ...]
});*/

var searchGH = (query, callback) => {
    githubSearchRepos(query, {token: process.env.TOKEN, sort: 'stars'}).then(data => {
        callback(data.items);
    });
}

searchGH('javascript', (items)=>{

    console.log(items)

    
    /*

{
    id: 167174,
    name: 'jquery',
    full_name: 'jquery/jquery',
    owner: {
      login: 'jquery',
      html_url: 'https://github.com/jquery',
      type: 'Organization',
    },
    html_url: 'https://github.com/jquery/jquery',
    description: 'jQuery JavaScript Library',
    url: 'https://api.github.com/repos/jquery/jquery',
    clone_url: 'https://github.com/jquery/jquery.git',
    homepage: 'https://jquery.com',
    size: 31675,
    stargazers_count: 57006,
    watchers_count: 57006,
    language: 'JavaScript'
  }

    */

})