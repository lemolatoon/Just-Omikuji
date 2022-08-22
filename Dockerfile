FROM node:latest

ARG NPM_CONFIG_PRODUCTION
ARG TOKEN

WORKDIR /usr/src/app


COPY package*.json ./


RUN npm install --omit=dev

COPY . .

RUN npm install -g typescript
RUN npm run build_global


CMD ["npm", "run", "start"]
