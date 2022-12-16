const clone = require('git-clone');
const fs = require('fs');

const TEMP_DIR = "./temp/"
const OUTPUT_DIR = "./outputs/"
const OUTPUT_MIN_DIR = "./outputs.min/"
const REPOS_FILE = "./repos.json"

const dockerfile_regex = /[Dd]ockerfile.*/;
const compose_regex = /.*[Cc]ompose.*ya*ml/;

module.exports = {


    print: function (text) {
        console.log('Utils > ' + text)
    },

    readRepoArgs: function (args) {
        return args[2]
    },

    readRepoFile: function () {
        var repos = JSON.parse(fs.readFileSync(REPOS_FILE))
        return repos
    },

    cloneRepo: function (repoUrl, callback, skipCallback) {
        var repoTokens = repoUrl.split("/")
        var repoName = repoTokens[repoTokens.length - 1]
        var path = TEMP_DIR + repoName

        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true })
        }

        this.print('cloning ' + repoName)

        clone(repoUrl, path, { shallow: true }, (error) => {
            if (error){
                console.log(error)
                //this.cloneRepo(repoUrl, callback)
                skipCallback()
            } else
                callback(repoName)
        })
    },

    deleteRepo: function (repoUrl) {
        var repoTokens = repoUrl.split("/")
        var repoName = repoTokens[repoTokens.length - 1]
        var path = TEMP_DIR + repoName

        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true })
        }
    },

    alreadyProcessed: function (repoUrl) {
        var repoTokens = repoUrl.split("/")
        var repoName = repoTokens[repoTokens.length - 1]
        var path = OUTPUT_DIR + repoName + '.json'

        if (fs.existsSync(path)) {
            //this.print('already processed ' + path)
            return true
        } else {
            return false
        }
    },

    scanFolder: function (folder) {
        var path = folder
        var struct = {}
        var files = fs.readdirSync(TEMP_DIR + folder, { withFileTypes: true })

        for (var i in files) {
            struct[files[i].name] = {}
            struct[files[i].name].name = files[i].name
            struct[files[i].name].path = path + "/" + files[i].name
            struct[files[i].name].isDir = files[i].isDirectory()
            struct[files[i].name].isDockerfile = files[i].name.match(dockerfile_regex) ? true : false;
            struct[files[i].name].isComposefile = files[i].name.match(compose_regex) ? true : false;
            if (struct[files[i].name].isDir) {
                struct[files[i].name].children = this.scanFolder(folder + '/' + files[i].name)
            }
        }
        return struct
    },

    processStruct: function (struct) {
        this.print('processing structure for important files')
        var obj = {
            results: this.processStructAux(struct),
            struct: struct
        }
        return obj
    },

    processStructAux: function (struct) {
        var res = {
            dockerfile: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            },
            composefile: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            }
        }

        var directories = []

        for (var i in struct) {

            if (struct[i].isDockerfile) {
                res.dockerfile.exist = true
                res.dockerfile.count++
                res.dockerfile.rootCount++
                res.dockerfile.filepaths.push(struct[i].path)
            } else if (struct[i].isComposefile) {
                res.composefile.exist = true
                res.composefile.count++
                res.composefile.rootCount++
                res.composefile.filepaths.push(struct[i].path)
            } else if (struct[i].isDir) {
                directories.push(struct[i])
            }
        }

        for (var d in directories) {
            var temp = this.processStructAux(directories[d].children)
            res.dockerfile.exist = temp.dockerfile.exist ? true : res.dockerfile.exist
            res.dockerfile.count += temp.dockerfile.count
            res.dockerfile.subFolderCount += temp.dockerfile.rootCount + temp.dockerfile.subFolderCount
            res.dockerfile.filepaths = res.dockerfile.filepaths.concat(temp.dockerfile.filepaths)
            res.composefile.exist = temp.composefile.exist ? true : res.composefile.exist
            res.composefile.count += temp.composefile.count
            res.composefile.subFolderCount += temp.composefile.rootCount + temp.composefile.subFolderCount
            res.composefile.filepaths = res.composefile.filepaths.concat(temp.composefile.filepaths)
        }

        return res
    },

    processOverallResults: function () {
        this.print('processing overall results')

        var res = {
            total_repos: 0,
            dockerfile: {
                total: 0,
                only_in_root: 0,
                only_in_subfolders: 0,
                root_and_subfolders: 0,
            },
            composefile: {
                total: 0,
                only_in_root: 0,
                only_in_subfolders: 0,
                root_and_subfolders: 0,
            },
            just_dockerfile: {
                total: 0,
                dockerfile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                composefile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                avg_dockerfile_per_repo: 0,
                n_dockerfiles_counter: {},
                avg_compose_per_repo: 0,
                n_compose_counter: {},
            },
            just_compose: {
                total: 0,
                dockerfile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                composefile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                avg_dockerfile_per_repo: 0,
                n_dockerfiles_counter: {},
                avg_compose_per_repo: 0,
                n_compose_counter: {},
            },
            dockerfile_or_compose: {
                total: 0,
                dockerfile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                composefile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                avg_dockerfile_per_repo: 0,
                n_dockerfiles_counter: {},
                avg_compose_per_repo: 0,
                n_compose_counter: {},
            },
            dockerfile_and_compose: {
                total: 0,
                dockerfile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                composefile: {
                    only_in_root: 0,
                    only_in_subfolders: 0,
                    root_and_subfolders: 0,
                },
                avg_dockerfile_per_repo: 0,
                n_dockerfiles_counter: {},
                avg_compose_per_repo: 0,
                n_compose_counter: {},
            },
            no_docker: {
                total: 0,
            },
            languages: {}
        }

        fs.readdirSync(OUTPUT_MIN_DIR).forEach(file => {
            this.print('processing overall results for file: ' + file)
            var data = JSON.parse(fs.readFileSync(OUTPUT_MIN_DIR + '/' + file))

            res.total_repos++

            //dockerifle stats
            if (data.results.dockerfile.exist)
                res.dockerfile.total++
            if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                res.dockerfile.only_in_root++
            if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                res.dockerfile.only_in_subfolders++
            if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                res.dockerfile.root_and_subfolders++

            //composefile stats
            if (data.results.composefile.exist)
                res.composefile.total++
            if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                res.composefile.only_in_root++
            if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                res.composefile.only_in_subfolders++
            if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                res.composefile.root_and_subfolders++


            //Category Stats

            //Category: Just Dockerfile
            if (data.results.dockerfile.exist && !data.results.composefile.exist) {
                res.just_dockerfile.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.just_dockerfile.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.just_dockerfile.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.just_dockerfile.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.just_dockerfile.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.just_dockerfile.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.just_dockerfile.composefile.root_and_subfolders++


                //Cummulative Averages
                res.just_dockerfile.avg_dockerfile_per_repo = res.just_dockerfile.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.just_dockerfile.avg_dockerfile_per_repo) / res.just_dockerfile.total)
                if (res.just_dockerfile.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.just_dockerfile.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.just_dockerfile.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.just_dockerfile.avg_compose_per_repo = res.just_dockerfile.avg_compose_per_repo + ((data.results.composefile.count - res.just_dockerfile.avg_compose_per_repo) / res.just_dockerfile.total)
                if (res.just_dockerfile.n_compose_counter[data.results.composefile.count])
                    res.just_dockerfile.n_compose_counter[data.results.composefile.count]++
                else
                    res.just_dockerfile.n_compose_counter[data.results.composefile.count] = 1


            }

            //Category: Just Compose
            if (!data.results.dockerfile.exist && data.results.composefile.exist) {
                res.just_compose.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.just_compose.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.just_compose.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.just_compose.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.just_compose.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.just_compose.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.just_compose.composefile.root_and_subfolders++

                //Cummulative Averages
                res.just_compose.avg_dockerfile_per_repo = res.just_compose.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.just_compose.avg_dockerfile_per_repo) / res.just_compose.total)
                if (res.just_compose.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.just_compose.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.just_compose.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.just_compose.avg_compose_per_repo = res.just_compose.avg_compose_per_repo + ((data.results.composefile.count - res.just_compose.avg_compose_per_repo) / res.just_compose.total)
                if (res.just_compose.n_compose_counter[data.results.composefile.count])
                    res.just_compose.n_compose_counter[data.results.composefile.count]++
                else
                    res.just_compose.n_compose_counter[data.results.composefile.count] = 1

            }

            //Category: Dockerfile OR Compose
            if (data.results.dockerfile.exist || data.results.composefile.exist) {
                res.dockerfile_or_compose.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.dockerfile_or_compose.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.dockerfile_or_compose.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.dockerfile_or_compose.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.dockerfile_or_compose.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.dockerfile_or_compose.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.dockerfile_or_compose.composefile.root_and_subfolders++

                //Cummulative Averages
                res.dockerfile_or_compose.avg_dockerfile_per_repo = res.dockerfile_or_compose.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.dockerfile_or_compose.avg_dockerfile_per_repo) / res.dockerfile_or_compose.total)
                if (res.dockerfile_or_compose.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.dockerfile_or_compose.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.dockerfile_or_compose.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.dockerfile_or_compose.avg_compose_per_repo = res.dockerfile_or_compose.avg_compose_per_repo + ((data.results.composefile.count - res.dockerfile_or_compose.avg_compose_per_repo) / res.dockerfile_or_compose.total)
                if (res.dockerfile_or_compose.n_compose_counter[data.results.composefile.count])
                    res.dockerfile_or_compose.n_compose_counter[data.results.composefile.count]++
                else
                    res.dockerfile_or_compose.n_compose_counter[data.results.composefile.count] = 1
            }

            //Category: Dockerfile AND Compose
            if (data.results.dockerfile.exist && data.results.composefile.exist) {
                res.dockerfile_and_compose.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.dockerfile_and_compose.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.dockerfile_and_compose.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.dockerfile_and_compose.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.dockerfile_and_compose.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.dockerfile_and_compose.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.dockerfile_and_compose.composefile.root_and_subfolders++

                //Cummulative Averages
                res.dockerfile_and_compose.avg_dockerfile_per_repo = res.dockerfile_and_compose.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.dockerfile_and_compose.avg_dockerfile_per_repo) / res.dockerfile_and_compose.total)
                if (res.dockerfile_and_compose.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.dockerfile_and_compose.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.dockerfile_and_compose.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.dockerfile_and_compose.avg_compose_per_repo = res.dockerfile_and_compose.avg_compose_per_repo + ((data.results.composefile.count - res.dockerfile_and_compose.avg_compose_per_repo) / res.dockerfile_and_compose.total)
                if (res.dockerfile_and_compose.n_compose_counter[data.results.composefile.count])
                    res.dockerfile_and_compose.n_compose_counter[data.results.composefile.count]++
                else
                    res.dockerfile_and_compose.n_compose_counter[data.results.composefile.count] = 1

            }

            //Category: No Dockerfile NOR Compose
            if (!data.results.dockerfile.exist && !data.results.composefile.exist) {
                res.no_docker.total++
            }

            //Language Stats
            if (!res.languages[data.info.language]) {
                res.languages[data.info.language] = {
                    total_repos: 0,
                    dockerfile: {
                        total: 0,
                        only_in_root: 0,
                        only_in_subfolders: 0,
                        root_and_subfolders: 0,
                    },
                    composefile: {
                        total: 0,
                        only_in_root: 0,
                        only_in_subfolders: 0,
                        root_and_subfolders: 0,
                    },
                    just_dockerfile: {
                        total: 0,
                        dockerfile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        composefile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        avg_dockerfile_per_repo: 0,
                        n_dockerfiles_counter: {},
                        avg_compose_per_repo: 0,
                        n_compose_counter: {},
                    },
                    just_compose: {
                        total: 0,
                        dockerfile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        composefile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        avg_dockerfile_per_repo: 0,
                        n_dockerfiles_counter: {},
                        avg_compose_per_repo: 0,
                        n_compose_counter: {},
                    },
                    dockerfile_or_compose: {
                        total: 0,
                        dockerfile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        composefile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        avg_dockerfile_per_repo: 0,
                        n_dockerfiles_counter: {},
                        avg_compose_per_repo: 0,
                        n_compose_counter: {},
                    },
                    dockerfile_and_compose: {
                        total: 0,
                        dockerfile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        composefile: {
                            only_in_root: 0,
                            only_in_subfolders: 0,
                            root_and_subfolders: 0,
                        },
                        avg_dockerfile_per_repo: 0,
                        n_dockerfiles_counter: {},
                        avg_compose_per_repo: 0,
                        n_compose_counter: {},
                    },
                    no_docker: {
                        total: 0,
                    }
                }
            }

            res.languages[data.info.language].total_repos++

            //dockerifle stats
            if (data.results.dockerfile.exist)
                res.languages[data.info.language].dockerfile.total++
            if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                res.languages[data.info.language].dockerfile.only_in_root++
            if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                res.languages[data.info.language].dockerfile.only_in_subfolders++
            if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                res.languages[data.info.language].dockerfile.root_and_subfolders++

            //composefile stats
            if (data.results.composefile.exist)
                res.languages[data.info.language].composefile.total++
            if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                res.languages[data.info.language].composefile.only_in_root++
            if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                res.languages[data.info.language].composefile.only_in_subfolders++
            if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                res.languages[data.info.language].composefile.root_and_subfolders++


            //Category Stats

            //Category: Just Dockerfile
            if (data.results.dockerfile.exist && !data.results.composefile.exist) {
                res.languages[data.info.language].just_dockerfile.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.languages[data.info.language].just_dockerfile.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].just_dockerfile.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].just_dockerfile.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.languages[data.info.language].just_dockerfile.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].just_dockerfile.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].just_dockerfile.composefile.root_and_subfolders++


                //Cummulative Averages
                res.languages[data.info.language].just_dockerfile.avg_dockerfile_per_repo = res.languages[data.info.language].just_dockerfile.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.languages[data.info.language].just_dockerfile.avg_dockerfile_per_repo) / res.languages[data.info.language].just_dockerfile.total)
                if (res.languages[data.info.language].just_dockerfile.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.languages[data.info.language].just_dockerfile.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.languages[data.info.language].just_dockerfile.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.languages[data.info.language].just_dockerfile.avg_compose_per_repo = res.languages[data.info.language].just_dockerfile.avg_compose_per_repo + ((data.results.composefile.count - res.languages[data.info.language].just_dockerfile.avg_compose_per_repo) / res.languages[data.info.language].just_dockerfile.total)
                if (res.languages[data.info.language].just_dockerfile.n_compose_counter[data.results.composefile.count])
                    res.languages[data.info.language].just_dockerfile.n_compose_counter[data.results.composefile.count]++
                else
                    res.languages[data.info.language].just_dockerfile.n_compose_counter[data.results.composefile.count] = 1


            }

            //Category: Just Compose
            if (!data.results.dockerfile.exist && data.results.composefile.exist) {
                res.languages[data.info.language].just_compose.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.languages[data.info.language].just_compose.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].just_compose.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].just_compose.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.languages[data.info.language].just_compose.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].just_compose.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].just_compose.composefile.root_and_subfolders++

                //Cummulative Averages
                res.languages[data.info.language].just_compose.avg_dockerfile_per_repo = res.languages[data.info.language].just_compose.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.languages[data.info.language].just_compose.avg_dockerfile_per_repo) / res.languages[data.info.language].just_compose.total)
                if (res.languages[data.info.language].just_compose.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.languages[data.info.language].just_compose.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.languages[data.info.language].just_compose.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.languages[data.info.language].just_compose.avg_compose_per_repo = res.languages[data.info.language].just_compose.avg_compose_per_repo + ((data.results.composefile.count - res.languages[data.info.language].just_compose.avg_compose_per_repo) / res.languages[data.info.language].just_compose.total)
                if (res.languages[data.info.language].just_compose.n_compose_counter[data.results.composefile.count])
                    res.languages[data.info.language].just_compose.n_compose_counter[data.results.composefile.count]++
                else
                    res.languages[data.info.language].just_compose.n_compose_counter[data.results.composefile.count] = 1

            }

            //Category: Dockerfile OR Compose
            if (data.results.dockerfile.exist || data.results.composefile.exist) {
                res.languages[data.info.language].dockerfile_or_compose.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.languages[data.info.language].dockerfile_or_compose.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_or_compose.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_or_compose.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.languages[data.info.language].dockerfile_or_compose.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_or_compose.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_or_compose.composefile.root_and_subfolders++

                //Cummulative Averages
                res.languages[data.info.language].dockerfile_or_compose.avg_dockerfile_per_repo = res.languages[data.info.language].dockerfile_or_compose.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.languages[data.info.language].dockerfile_or_compose.avg_dockerfile_per_repo) / res.languages[data.info.language].dockerfile_or_compose.total)
                if (res.languages[data.info.language].dockerfile_or_compose.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.languages[data.info.language].dockerfile_or_compose.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.languages[data.info.language].dockerfile_or_compose.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.languages[data.info.language].dockerfile_or_compose.avg_compose_per_repo = res.languages[data.info.language].dockerfile_or_compose.avg_compose_per_repo + ((data.results.composefile.count - res.languages[data.info.language].dockerfile_or_compose.avg_compose_per_repo) / res.languages[data.info.language].dockerfile_or_compose.total)
                if (res.languages[data.info.language].dockerfile_or_compose.n_compose_counter[data.results.composefile.count])
                    res.languages[data.info.language].dockerfile_or_compose.n_compose_counter[data.results.composefile.count]++
                else
                    res.languages[data.info.language].dockerfile_or_compose.n_compose_counter[data.results.composefile.count] = 1
            }

            //Category: Dockerfile AND Compose
            if (data.results.dockerfile.exist && data.results.composefile.exist) {
                res.languages[data.info.language].dockerfile_and_compose.total++

                //dockerifle stats
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount == 0)
                    res.languages[data.info.language].dockerfile_and_compose.dockerfile.only_in_root++
                if (data.results.dockerfile.rootCount == 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_and_compose.dockerfile.only_in_subfolders++
                if (data.results.dockerfile.rootCount > 0 && data.results.dockerfile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_and_compose.dockerfile.root_and_subfolders++

                //composefile stats
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount == 0)
                    res.languages[data.info.language].dockerfile_and_compose.composefile.only_in_root++
                if (data.results.composefile.rootCount == 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_and_compose.composefile.only_in_subfolders++
                if (data.results.composefile.rootCount > 0 && data.results.composefile.subFolderCount > 0)
                    res.languages[data.info.language].dockerfile_and_compose.composefile.root_and_subfolders++

                //Cummulative Averages
                res.languages[data.info.language].dockerfile_and_compose.avg_dockerfile_per_repo = res.languages[data.info.language].dockerfile_and_compose.avg_dockerfile_per_repo + ((data.results.dockerfile.count - res.languages[data.info.language].dockerfile_and_compose.avg_dockerfile_per_repo) / res.languages[data.info.language].dockerfile_and_compose.total)
                if (res.languages[data.info.language].dockerfile_and_compose.n_dockerfiles_counter[data.results.dockerfile.count])
                    res.languages[data.info.language].dockerfile_and_compose.n_dockerfiles_counter[data.results.dockerfile.count]++
                else
                    res.languages[data.info.language].dockerfile_and_compose.n_dockerfiles_counter[data.results.dockerfile.count] = 1

                res.languages[data.info.language].dockerfile_and_compose.avg_compose_per_repo = res.languages[data.info.language].dockerfile_and_compose.avg_compose_per_repo + ((data.results.composefile.count - res.languages[data.info.language].dockerfile_and_compose.avg_compose_per_repo) / res.languages[data.info.language].dockerfile_and_compose.total)
                if (res.languages[data.info.language].dockerfile_and_compose.n_compose_counter[data.results.composefile.count])
                    res.languages[data.info.language].dockerfile_and_compose.n_compose_counter[data.results.composefile.count]++
                else
                    res.languages[data.info.language].dockerfile_and_compose.n_compose_counter[data.results.composefile.count] = 1

            }

            //Category: No Dockerfile NOR Compose
            if (!data.results.dockerfile.exist && !data.results.composefile.exist) {
                res.languages[data.info.language].no_docker.total++
            }

        });
        return res
    },

    saveToFile: function (data, filename) {
        this.print('saving data to ' + filename)
        fs.writeFileSync(OUTPUT_DIR + filename, JSON.stringify(data, null, 2))
    }


};