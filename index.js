const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;
const config = require('./config.json');

const SECRET = config.webhook_secret;

const GITHUB_REPOSITORIES = config.github_repository;

function execSh(command, activeErr, callback) {
    exec(command, function (err, stdout, stderr) {
        if (activeErr && err) {
            console.log(err);
            return;
        }
        if (activeErr && stderr) {
            console.log(stderr);
            return;
        }
        callback(stdout);
    });
}

http
    .createServer((req, res) => {
        req.on('data', chunk => {
            const signature = `sha1=${crypto
        .createHmac('sha1', SECRET)
        .update(chunk)
        .digest('hex')}`;

            const isAllowed = req.headers['x-hub-signature'] === signature;

            const body = JSON.parse(chunk);

            const actualRepodata = GITHUB_REPOSITORIES[body ? body.repository ? body.repository.full_name : null : null];
            if (!isAllowed || !actualRepodata || !body) return;
            console.log(body);
            const actualBranch = actualRepodata[body.ref];
            if (!actualBranch) return;

            if (!actualBranch.allowAllUsers) {
                if (!actualBranch.allowedUsersId.includes(body.sender.id)) return;
            }

            const directory = "/home/github-webhook/projects/" + actualRepodata.directory;
            try {
                execSh(`cd ${directory} && git fetch`, false, async (stdout) => {
                    execSh(`cd ${directory} && git checkout ${body.ref.split("/")[body.ref.split("/").length - 1]}`, false, async (stdout) => {
                        execSh(`cd ${directory} && git pull`, false, async (stdout) => {
                            execSh(`cd ${directory} && ${actualBranch.buildCommand}`, true, async (stdout) => {
                                console.log(stdout);
                                execSh(`docker images | grep "<none>"`, false, async (stdout) => {
                                    for (const image of stdout.split('\n')) {
                                        await new Promise((res) => {
                                            const imageTag = image.split(' ').filter(word => word !== "")[2];
                                            if (imageTag == null) {
                                                res();
                                                return;
                                            } else {
                                                execSh(`docker image rm ${imageTag}`, true, async (stdout) => {
                                                    res();
                                                })
                                            }
                                        })
                                    }
                                    execSh(`cd ${directory} && ${actualBranch.runCommand}`, true, async (stdout) => {
                                        console.log(`Container '${actualBranch.myfab_back}' is now updated`);
                                    })
                                })
                            })
                        })
                    })
                })
            } catch (error) {
                console.log(error);
            }
        });

        res.end();
    })
    .listen(config.port);