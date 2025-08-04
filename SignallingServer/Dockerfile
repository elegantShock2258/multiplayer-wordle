FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY . .

RUN yarn
RUN yarn run build

EXPOSE 4301

CMD ["node","dist/signallingServer.js"]