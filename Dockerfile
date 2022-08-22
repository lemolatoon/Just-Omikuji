FROM node:latest

ARG NPM_CONFIG_PRODUCTION
ARG TOKEN

WORKDIR /usr/src/app


COPY package*.json ./

RUN npm install

RUN npm run build

COPY . .

CMD ["node", "src/main.js"]
