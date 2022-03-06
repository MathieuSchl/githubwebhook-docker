const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;
const config = require('./config.json');

const SECRET = config.webhook_secret;

const GITHUB_REPOSITORIES_TO_DIR = config.github_repository_to_dir;

http
    .createServer((req, res) => {
        req.on('data', chunk => {
            const signature = `sha1=${crypto
        .createHmac('sha1', SECRET)
        .update(chunk)
        .digest('hex')}`;

            const isAllowed = req.headers['x-hub-signature'] === signature;

            const body = JSON.parse(chunk);

            const isMaster = body ? body.ref === 'refs/heads/master' : null;
            const directory = GITHUB_REPOSITORIES_TO_DIR[body ? body.repository ? body.repository.full_name : null : null];

            if (isAllowed && isMaster && directory) {
                try {
                    exec(`cd ${directory} && bash deploy.sh`);
                } catch (error) {
                    console.log(error);
                }
            }
        });

        res.end();
    })
    .listen(8080);