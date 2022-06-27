const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;
var CronJob = require('cron').CronJob;
const config = require('./config.json');

const SECRET = config.webhook_secret;

const GITHUB_REPOSITORIES = config.github_repository;

function getTimeStamp() {
    const actualDate = new Date();
    return `[${actualDate.getDate()}/${actualDate.getMonth()}/${actualDate.getFullYear()} ${actualDate.getHours()}:${actualDate.getMinutes()}]`;
}

async function startCron() {
    if (!config.cron) return;
    for (let index = 0; index < config.cron.length; index++) {
        const element = config.cron[index];
        try {
            console.log("Start Job\nCron : '" + element.cron + "'\nCmd : " + element.cmd);
            new CronJob(element.cron, async function () {
                await new Promise((res) => {
                    execSh(element.cmd, true, false, async (stdout) => {
                        if (stdout && stdout !== "") console.log(stdout);
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

module.exports.runProcess = runProcess;

function runProcess(actualRepodata, branchFullName, actualBranch) {
    const projectName = actualRepodata.directory;
    const directory = "/home/github-webhook/projects/" + actualRepodata.directory;
    const pathToDockerCompose = actualRepodata.directoryComoseYml ? "/home/github-webhook/projects/" + actualRepodata.directoryComoseYml : directory;
    console.log(getTimeStamp() + `Project : ${projectName} Branch : ${branchFullName} update detected`);
    try {
        //Pull modification from git
        execSh(`cd ${directory} && git config --global --add safe.directory ${directory}`, false, false, async (stdout) => {
            console.log(getTimeStamp() + `${projectName} : git fetch`);
            execSh(`cd ${directory} && git fetch`, false, false, async (stdout) => {
                console.log(getTimeStamp() + `${projectName} : git checkout`);
                execSh(`cd ${directory} && git checkout ${actualBranch.branchName}`, false, false, async (stdout) => {
                    console.log(getTimeStamp() + `${projectName} : git pull`);
                    execSh(`cd ${directory} && git pull`, false, false, async (stdout) => {


                        if (!actualRepodata.isDockerCompose) {
                            //create new image and start new container with docker command
                            console.log(getTimeStamp() + `${projectName} : docker build`);
                            execSh(`cd ${directory} && ${actualBranch.buildCommand}`, true, false, async (stdout) => {
                                console.log(getTimeStamp() + `${projectName} : docker rm ${actualBranch.imageName}`);
                                execSh(`docker rm -f ${actualBranch.conatinerName}`, true, false, async (stdout) => {
                                    console.log(getTimeStamp() + `Remove unused images`);
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
                                        execSh(getTimeStamp() + `cd ${directory} && ${actualBranch.runCommand}`, true, false, async (stdout) => {
                                            console.log(`Container '${actualBranch.conatinerName}' is now updated`);
                                        })
                                    })
                                })
                            })
                        } else {
                            //create new image and start new container with docker-compose command
                            console.log(getTimeStamp() + `${projectName} : docker-compose build`);
                            execSh(`cd ${pathToDockerCompose} && docker-compose build ${actualBranch.serviceName}`, true, true, async (stdout) => {
                                console.log(getTimeStamp() + `docker-compose : stop service ${actualBranch.serviceName}`);
                                execSh(`cd ${pathToDockerCompose} && docker-compose rm -sf ${actualBranch.serviceName}`, true, true, async (stdout) => {
                                    console.log(getTimeStamp() + `Remove unused images`);
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
                                        console.log(getTimeStamp() + `docker-compose : start service ${actualBranch.serviceName}`);
                                        execSh(`cd ${pathToDockerCompose} && docker-compose up -d ${actualBranch.serviceName}`, true, false, async (stdout) => {
                                            console.log(getTimeStamp() + `Container '${actualBranch.conatinerName}' is now updated`);
                                        })
                                    })
                                })
                            })
                        }
                    })
                })
            })
        })
    } catch (error) {
        console.log(error);
    }
}

function start() {
    startCron();
    http
        .createServer((req, res) => {
            req.on('data', chunk => {
                const signature = `sha1=${crypto
        .createHmac('sha1', SECRET)
        .update(chunk)
        .digest('hex')}`;

                //secret verification
                const isAllowed = req.headers['x-hub-signature'] === signature;

                const body = JSON.parse(chunk);

                //project verification
                const actualRepodata = GITHUB_REPOSITORIES[body ? body.repository ? body.repository.full_name : null : null];
                if (!isAllowed || !actualRepodata || !body) return;
                const actualBranch = actualRepodata[body.ref];
                if (!actualBranch) return;

                //user verification
                if (!actualBranch.allowAllUsers) {
                    if (!actualBranch.allowedUsersId.includes(body.sender.id)) return;
                }

                const branchName = body.ref.split("/")[body.ref.split("/").length - 1];
                runProcess(actualRepodata, branchName, actualBranch);
            });

            res.end();
        })
        .listen(config.port);

    console.log("Port " + config.port + " is now listened");
    console.log("System start at " + new Date());
}

if (process.argv[2] === "start") start();