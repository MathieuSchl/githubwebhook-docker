# GitHub-WebHook-With-Docker

The project is not ready yet

I'm using this [guide](https://www.robinwieruch.de/github-webhook-node-js/) to create this project 

## Commands docker to start

```
docker build -t gitwebhook .
docker run -itd --name github-webhook -p 2224:2224 -v /home/debian/MyFabUltimate_Back:/home/github-webhook/projects/MyFabUltimate_Back gitwebhook sh
```