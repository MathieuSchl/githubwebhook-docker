FROM alpine

RUN apk add docker docker-compose nodejs npm git

RUN mkdir /home/github-webhook
RUN mkdir /home/github-webhook/projects
WORKDIR /home/github-webhook

COPY ./package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
