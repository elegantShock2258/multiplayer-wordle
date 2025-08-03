FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY . .

#RUN yarn
RUN yarn run build

EXPOSE 3000
EXPOSE 4301

RUN yarn concurrently "yarn start" "yarn local:server"
