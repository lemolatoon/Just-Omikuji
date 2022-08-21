FROM node:latest

ARG NPM_CONFIG_PRODUCTION
ARG TOKEN

WORKDIR /usr/src/app


COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "run"]
