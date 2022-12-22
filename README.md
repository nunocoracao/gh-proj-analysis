# proj-data

```bash
node repoJsonBuilder.js 
node processRepos.js --node-args="--max_old_space_size=8192"
node rescanOutputs.js 
node minifyOutputs.js
node validate.js
node processFinalResults.js
```

```bash
node rescanOutputs.js --node-args="--max_old_space_size=8192" &&\
node minifyOutputs.js --node-args="--max_old_space_size=8192" &&\
node validate.js --node-args="--max_old_space_size=8192" &&\
node processFinalResults.js --node-args="--max_old_space_size=8192"
```