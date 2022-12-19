const clone = require('git-clone');
const fs = require('fs');

const TEMP_DIR = "./temp/"
const OUTPUT_DIR = "./outputs/"
const OUTPUT_MIN_DIR = "./outputs.min/"
const REPOS_FILE = "./repos.json"

//const dockerfile_regex = /[Dd]ockerfile.*/; # initial regex
//const compose_regex = /.*[Cc]ompose.*ya*ml/; # initial regex
const dockerfile_regex = /.[Dd]ockerfile.*/i;
const compose_regex = /.*[Cc]ompose.*ya?ml/i;
const devcontainer_regex = /[Dd]evcontainer.*json/i;
const kustomize_regex = /.*[Kk]ustomization.*ya?ml/i;
const helm_regex = /.*[Cc]hart.*ya?ml/;
const k8s_regex_1 = /.*[Dd]eployment.*ya?ml/i;
const k8s_regex_2 = /.*[Ss]ervice.*ya?ml/i;
const k8s_regex_3 = /.*[Cc]onfigmap.*ya?ml/i;
const backstage_regex = /.*[Cc]atalog\-info.*ya?ml/i;
const terraform_regex_1 = /.*\.tf/i
const terraform_regex_2 = /.*\.hcl/i



//And of course... right when I saw I don't normally see something.Dockerfile, it shows up in the CAH today! 

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
            if (error) {
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

    minifyOutputs: function () {
        fs.readdirSync(OUTPUT_DIR).forEach(file => {
            if (!fs.existsSync(OUTPUT_MIN_DIR + file)) {
                this.print('minifying file: ' + file)
                var data = JSON.parse(fs.readFileSync(OUTPUT_DIR + file))
                delete data.struct
                fs.writeFileSync(OUTPUT_MIN_DIR + file, JSON.stringify(data, null, 2))
            }
        })

    },

    validate: function () {

        var validations = {
            dockerfiles: [],
            composefiles: [],
            kustomize: [],
            helm: [],
            k8s: [],
            backstage: [],
            terraform: [],
            multiple: []
        }

        fs.readdirSync(OUTPUT_DIR).every(file => {
            this.print('validating file: ' + file)
            var data = JSON.parse(fs.readFileSync(OUTPUT_DIR + '/' + file))
            var temp = this.validateStruct(data.struct)
            validations.dockerfiles = validations.dockerfiles.concat(temp.dockerfiles)
            validations.composefiles = validations.composefiles.concat(temp.composefiles)
            validations.kustomize = validations.kustomize.concat(temp.kustomize)
            validations.helm = validations.helm.concat(temp.helm)
            validations.k8s = validations.k8s.concat(temp.k8s)
            validations.backstage = validations.backstage.concat(temp.backstage)
            validations.terraform = validations.terraform.concat(temp.terraform)
            validations.multiple = validations.multiple.concat(temp.multiple)
            return true;
        })

        return validations
    },

    validateStruct: function (struct) {

        var validations = {
            dockerfiles: [],
            composefiles: [],
            kustomize: [],
            helm: [],
            k8s: [],
            backstage: [],
            terraform: [],
            multiple: []
        }

        for (var i in struct) {

            var validation = 0

            if (struct[i].isDockerfile) {
                console.log('Found Dockerfile')
                console.log(struct[i].name)
                validations.dockerfiles.push(struct[i].name)
                validation++
            }


            if (struct[i].isComposefile) {
                console.log('Found Compose file')
                console.log(struct[i].name)
                validations.composefiles.push(struct[i].name)
                validation++
            }

            if (struct[i].isKustomize) {
                console.log('Found Kustomize file')
                console.log(struct[i].name)
                validations.kustomize.push(struct[i].name)
                validation++
            }

            if (struct[i].isHelm) {
                console.log('Found Helm file')
                console.log(struct[i].name)
                validations.helm.push(struct[i].name)
                validation++
            }

            if (struct[i].isK8s) {
                console.log('Found K8s file')
                console.log(struct[i].name)
                validations.k8s.push(struct[i].name)
                validation++
            }

            if (struct[i].isBackstage) {
                console.log('Found Backstage file')
                console.log(struct[i].name)
                validations.backstage.push(struct[i].name)
                validation++
            }

            if (struct[i].isTerraform) {
                console.log('Found Terraform file')
                console.log(struct[i].name)
                validations.terraform.push(struct[i].name)
                validation++
            }


            if (validation > 1) {
                console.log('Found Multiple Regex Hits')
                validations.multiple.push(struct[i].name)
                console.log(struct[i].name)
            }

            if (struct[i].isDir) {
                var temp = this.validateStruct(struct[i].children)
                validations.dockerfiles = validations.dockerfiles.concat(temp.dockerfiles)
                validations.composefiles = validations.composefiles.concat(temp.composefiles)
                validations.kustomize = validations.kustomize.concat(temp.kustomize)
                validations.helm = validations.helm.concat(temp.helm)
                validations.k8s = validations.k8s.concat(temp.k8s)
                validations.backstage = validations.backstage.concat(temp.backstage)
                validations.terraform = validations.terraform.concat(temp.terraform)
                validations.multiple = validations.multiple.concat(temp.multiple)
            }

        }

        return validations

    },

    rescan: function () {
        fs.readdirSync(OUTPUT_DIR).every(file => {
            this.print('rescanning file: ' + file)
            var data = JSON.parse(fs.readFileSync(OUTPUT_DIR + '/' + file))
            data.struct = this.rescanStruct(data.struct)
            var res = this.processStruct(data.struct)
            data.results = res.results
            this.saveToFile(data, file)
            return true;
        })
    },

    rescanStruct: function (struct) {
        for (var i in struct) {
            if (!struct[i].isDir) {
                struct[i].isDockerfile = struct[i].name.match(dockerfile_regex) ? true : false;
                struct[i].isComposefile = struct[i].name.match(compose_regex) ? true : false;
                struct[i].isKustomize = struct[i].name.match(kustomize_regex) ? true : false;
                struct[i].isHelm = !struct[i].isComposefile && struct[i].name.match(helm_regex) ? true : false;
                if (!struct[i].isDockerfile &&
                    !struct[i].isComposefile &&
                    !struct[i].isHelm &&
                    (struct[i].name.match(k8s_regex_1) || struct[i].name.match(k8s_regex_2) || struct[i].name.match(k8s_regex_3))) {
                    struct[i].isK8s = true
                } else {
                    struct[i].isK8s = false
                }
                struct[i].isBackstage = struct[i].name.match(backstage_regex) ? true : false;
                if ((struct[i].name.match(terraform_regex_1) || struct[i].name.match(terraform_regex_2)) &&
                    !struct[i].name.match(/.*\.tflite/i) &&
                    !struct[i].name.match(/.*\.tfevents/i) &&
                    !struct[i].name.match(/.*\.tfrecord/i) &&
                    !struct[i].name.match(/.*\.tfm/i)) {
                    struct[i].isTerraform = true
                } else {
                    struct[i].isTerraform = false
                }
            } else {
                struct[i].isDockerfile = false
                struct[i].isComposefile = false
                struct[i].isKustomize = false
                struct[i].isHelm = false
                struct[i].isK8s = false
                struct[i].isBackstage = false
                struct[i].isTerraform = false
            }

            if (struct[i].isDockerfile && struct[i].isComposefile) {
                struct[i].isDockerfile = false
            }

            if (struct[i].isDir)
                this.rescanStruct(struct[i].children)
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
            },
            kustomize: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            },
            helm: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            },
            k8s: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            },
            backstage: {
                exist: false,
                count: 0,
                rootCount: 0,
                subFolderCount: 0,
                filepaths: []
            },
            terraform: {
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
            } else if (struct[i].isKustomize) {
                res.kustomize.exist = true
                res.kustomize.count++
                res.kustomize.rootCount++
                res.kustomize.filepaths.push(struct[i].path)
            } else if (struct[i].isHelm) {
                res.helm.exist = true
                res.helm.count++
                res.helm.rootCount++
                res.helm.filepaths.push(struct[i].path)
            } else if (struct[i].isK8s) {
                res.k8s.exist = true
                res.k8s.count++
                res.k8s.rootCount++
                res.k8s.filepaths.push(struct[i].path)
            } else if (struct[i].isBackstage) {
                res.backstage.exist = true
                res.backstage.count++
                res.backstage.rootCount++
                res.backstage.filepaths.push(struct[i].path)
            } else if (struct[i].isTerraform) {
                res.terraform.exist = true
                res.terraform.count++
                res.terraform.rootCount++
                res.terraform.filepaths.push(struct[i].path)
            } else if (struct[i].isDir) {
                directories.push(struct[i])
            }
        }

        for (var d in directories) {
            var temp = this.processStructAux(directories[d].children)

            // docker file
            res.dockerfile.exist = temp.dockerfile.exist ? true : res.dockerfile.exist
            res.dockerfile.count += temp.dockerfile.count
            res.dockerfile.subFolderCount += temp.dockerfile.rootCount + temp.dockerfile.subFolderCount
            res.dockerfile.filepaths = res.dockerfile.filepaths.concat(temp.dockerfile.filepaths)

            //compose file
            res.composefile.exist = temp.composefile.exist ? true : res.composefile.exist
            res.composefile.count += temp.composefile.count
            res.composefile.subFolderCount += temp.composefile.rootCount + temp.composefile.subFolderCount
            res.composefile.filepaths = res.composefile.filepaths.concat(temp.composefile.filepaths)

            //kustomize file
            res.kustomize.exist = temp.kustomize.exist ? true : res.kustomize.exist
            res.kustomize.count += temp.kustomize.count
            res.kustomize.subFolderCount += temp.kustomize.rootCount + temp.kustomize.subFolderCount
            res.kustomize.filepaths = res.kustomize.filepaths.concat(temp.kustomize.filepaths)

            //helm file
            res.helm.exist = temp.helm.exist ? true : res.helm.exist
            res.helm.count += temp.helm.count
            res.helm.subFolderCount += temp.helm.rootCount + temp.helm.subFolderCount
            res.helm.filepaths = res.helm.filepaths.concat(temp.helm.filepaths)

            //k8s file
            res.k8s.exist = temp.k8s.exist ? true : res.k8s.exist
            res.k8s.count += temp.k8s.count
            res.k8s.subFolderCount += temp.k8s.rootCount + temp.k8s.subFolderCount
            res.k8s.filepaths = res.k8s.filepaths.concat(temp.k8s.filepaths)

            //backstage file
            res.backstage.exist = temp.backstage.exist ? true : res.backstage.exist
            res.backstage.count += temp.backstage.count
            res.backstage.subFolderCount += temp.backstage.rootCount + temp.backstage.subFolderCount
            res.backstage.filepaths = res.backstage.filepaths.concat(temp.backstage.filepaths)

            //terraform file
            res.terraform.exist = temp.terraform.exist ? true : res.terraform.exist
            res.terraform.count += temp.terraform.count
            res.terraform.subFolderCount += temp.terraform.rootCount + temp.terraform.subFolderCount
            res.terraform.filepaths = res.terraform.filepaths.concat(temp.terraform.filepaths)
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
            kustomize: {
                total: 0,
            },
            helm: {
                total: 0,
            },
            k8s: {
                total: 0,
            },
            backstage: {
                total: 0,
            },
            terraform: {
                total: 0,
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

            //kustomize stats
            if (data.results.kustomize.exist)
                res.kustomize.total++

            //helm stats
            if (data.results.helm.exist)
                res.helm.total++

            //k8s stats
            if (data.results.k8s.exist)
                res.k8s.total++

            //backstage stats
            if (data.results.backstage.exist)
                res.backstage.total++

            //terraform stats
            if (data.results.terraform.exist)
                res.terraform.total++


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
                    kustomize: {
                        total: 0,
                    },
                    helm: {
                        total: 0,
                    },
                    k8s: {
                        total: 0,
                    },
                    backstage: {
                        total: 0,
                    },
                    terraform: {
                        total: 0,
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


            //kustomize stats
            if (data.results.kustomize.exist)
                res.languages[data.info.language].kustomize.total++

            //helm stats
            if (data.results.helm.exist)
                res.languages[data.info.language].helm.total++

            //k8s stats
            if (data.results.k8s.exist)
                res.languages[data.info.language].k8s.total++

            //backstage stats
            if (data.results.backstage.exist)
                res.languages[data.info.language].backstage.total++

            //terraform stats
            if (data.results.terraform.exist)
                res.languages[data.info.language].terraform.total++

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