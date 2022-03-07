const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;
const config = require('./config.json');

const SECRET = config.webhook_secret;

const GITHUB_REPOSITORIES = config.github_repository;

function execSh(command, callback) {
    exec(command, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            return;
        }
        if (stderr) {
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
            console.log(isAllowed);

            const body = JSON.parse(chunk);

            const actualRepodata = GITHUB_REPOSITORIES[body ? body.repository ? body.repository.full_name : null : null];
            if (!actualRepodata || !body) return;
            const actualBranch = actualRepodata[body.req];
            if (!actualBranch) return;

            if (!actualBranch.allowAllUsers) {
                if (!actualBranch.allowedUsersId.includes(body.sender.id)) return;
            }

            const directory = "/home/" + actualRepodata.directory;
            try {
                execSh(`docker images | grep ${actualBranch.imageName}`, async (stdout) => {
                    for (const image of stdout.split('\n')) {
                        await new Promise((res) => {
                            const imageTag = image.split(' ')[2];
                            console.log(imageTag);
                            res();
                        })
                    }
                    console.log(stdout);
                })
            } catch (error) {
                console.log(error);
            }
        });

        res.end();
    })
    .listen(config.port);