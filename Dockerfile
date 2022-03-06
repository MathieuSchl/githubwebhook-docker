FROM alpine

RUN apk add docker
RUN apk add nodejs npm

RUN mkdir /home/github-webhook
WORKDIR /home/github-webhook

