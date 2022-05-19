# GitHub-WebHook-With-Docker

## <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Great_Britain_%281707%E2%80%931800%29.svg/2560px-Flag_of_Great_Britain_%281707%E2%80%931800%29.svg.png" alt="English_Flag" style="width:30px;"/> English

## Goal

The purpose of the project is to link a GitHub repository to a server. This allows to update services in containers of a server in an automatic way during push on github

I'm using this [guide](https://www.robinwieruch.de/github-webhook-node-js/) to create this project

## Setting up the service

Go to your server and clone this repo.
```
git clone https://github.com/MathieuSchl/githubwebhook-docker.git
cd githubwebhook-docker
```

Create the configuration file `config.json` in the root

```
{
    "webhook_secret": "YOURSECRET",
    "port": 2224,
    "github_repository": {}
}
```

In webhook_secret put your secret (like a password) that you choose. No secret idea click [here](https://miniwebtool.com/random-string-generator/).


## Commands docker to start

```
docker build -t gitwebhook .
docker run -itd --name github-webhook -p 2224:2224 -v /var/run/docker.sock:/var/run/docker.sock -v PATHTOPROJECTS:/home/github-webhook/projects/ gitwebhook npm run start
```
Replace PATHTOPROJECTS to your path to yours projects

## <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/2560px-Flag_of_France.svg.png" alt="French_Flag" style="width:27px;"/> Francais

## Objectif

Ce projet à pour but de lier un répertoire GitHub à un serveur. Cela permet de mettre à jour des services dans des conteneurs d'un serveur de manière automatique lors de push sur github.

## Mise en place du service

Allez sur votre serveur et clonez ce repo.
```
git clone https://github.com/MathieuSchl/githubwebhook-docker.git
cd githubwebhook-docker
```

Créez à la racine le fichier de configuration `config.json`

```
{
    "webhook_secret": "YOURSECRET",
    "port": 2224,
    "github_repository": {}
}
```

Dans webhook_secret mettez votre secret (comme un mot de passe) que vous choisissez. Pas d'idée de secret cliquez [ici](https://miniwebtool.com/fr/random-string-generator/).

## Paramétrage du repo

### Sur le serveur

#### Avec les commandes docker

Pour le paramétrage du repertoire git il fail faut

#### Avec les commandes docker-compose

## Commandes docker pour démarrer

```
docker build -t gitwebhook .
docker run -itd --name github-webhook -p 2224:2224 -v /var/run/docker.sock:/var/run/docker.sock -v PATHTOPROJECTS:/home/github-webhook/projects/ gitwebhook npm run start
```
Remplacez PATHTOPROJECTS par votre chemin vers vos projets.
