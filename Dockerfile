FROM alpine

RUN apk add docker
RUN apk add nodejs npm git openssh
COPY ./.ssh /root/.ssh

RUN mkdir /home/github-webhook
RUN mkdir /home/github-webhook/projects
WORKDIR /home/github-webhook

COPY ./package*.json ./
RUN npm install
COPY . .
