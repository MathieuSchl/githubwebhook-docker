const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;
var CronJob = require('cron').CronJob;
const config = require('./config.json');

const SECRET = config.webhook_secret;

const GITHUB_REPOSITORIES = config.github_repository;


async function startCron(){
    for(let index = 0; index < config.cron.length; index++){
        const element = config.cron[index];
        try {
            console.log("Start Job\nCron : '" + element.cron + "'\nCmd : " + element.cmd);
            new CronJob(element.cron, async function() {
                await new Promise((res) => {
                    execSh(element.cmd, true, false, async (stdout) => {
                        if(stdout && stdout !== "") console.log(stdout);
                        res();
                    })
                })
            }, null, true);
        } catch (error) {
            console.log(error);
        }
    }
}

function execSh(command, activeErr, ignoreErr, callback) {
    exec(command, function (err, stdout, stderr) {
        if (activeErr && err) {
            if (ignoreErr) callback(stdout);
            else console.log(err);
            return;
        }
        if (activeErr && stderr) {
            if (ignoreErr) callback(stdout);
            else console.log(stderr);
            return;
        }
        callback(stdout);
    });
}

startCron();
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
            const actualBranch = actualRepodata[body.ref];
            if (!actualBranch) return;

            if (!actualBranch.allowAllUsers) {
                if (!actualBranch.allowedUsersId.includes(body.sender.id)) return;
            }

            const projectName = actualRepodata.directory;

            const directory = "/home/github-webhook/projects/" + projectName;
            const branchName = body.ref.split("/")[body.ref.split("/").length - 1];
            console.log(`Project : ${projectName} Branch : ${branchName} update detected`);
            try {
                console.log(`${projectName} : git fetch`);
                execSh(`cd ${directory} && git fetch`, false, false, async (stdout) => {
                    console.log(`${projectName} : git checkout`);
                    execSh(`cd ${directory} && git checkout ${branchName}`, false, false, async (stdout) => {
                        console.log(`${projectName} : git pull`);
                        execSh(`cd ${directory} && git pull`, false, false, async (stdout) => {
                            console.log(`${projectName} : docker build`);
                            execSh(`cd ${directory} && ${actualBranch.buildCommand}`, true, false, async (stdout) => {
                                console.log(`${projectName} : docker rm ${actualBranch.imageName}`);
                                execSh(`docker rm -f ${actualBranch.conatinerName}`, true, false, async (stdout) => {
                                    execSh(`docker images | grep "<none>"`, false, false, async (stdout) => {
                                        for (const image of stdout.split('\n')) {
                                            await new Promise((res) => {
                                                const imageTag = image.split(' ').filter(word => word !== "")[2];
                                                if (imageTag == null) {
                                                    res();
                                                    return;
                                                } else {
                                                    execSh(`docker image rm ${imageTag}`, true, true, async (stdout) => {
                                                        res();
                                                    })
                                                }
                                            })
                                        }
                                        execSh(`cd ${directory} && ${actualBranch.runCommand}`, true, false, async (stdout) => {
                                            console.log(`Container '${actualBranch.conatinerName}' is now updated`);
                                        })
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

console.log("Port " + config.port + " is now listened");
