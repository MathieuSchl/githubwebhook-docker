FROM alpine

RUN apk add docker nodejs npm git

RUN mkdir /home/github-webhook
RUN mkdir /home/github-webhook/projects
WORKDIR /home/github-webhook

COPY ./package*.json ./
RUN npm install
COPY . .
