const config = require('./config.json');


if (process.argv[2] === "help") {
    const keysRepos = Object.keys(config.github_repository);
    console.log("This repositories are configured:");
    for (const repo of keysRepos) {
        console.log("-" + repo);
        const keysBranches = Object.keys(config.github_repository[repo]);
        for (const branch of keysBranches) {
            if ((typeof config.github_repository[repo][branch]) === "object") {
                console.log("--" + branch);
            }
        }
    }
} else if (process.argv.length === 4) {
    const repo = process.argv[2];
    const branch = process.argv[3];
    if (!config.github_repository[repo]) {
        console.log("The repo is unknown");
        return;
    }
    if (!config.github_repository[repo][branch]) {
        console.log("The branch is unknown");
        return;
    }
    const actualRepodata = config.github_repository[repo];
    require("./index").runProcess(actualRepodata, branch);
} else {
    console.log("To run this command:\nIf you need help:\nnode cmd help\nIf you want to reload an image:\n-node cmd [repo name] [branch name]");
}