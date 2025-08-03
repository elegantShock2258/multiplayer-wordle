FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY . .

RUN yarn
RUN yarn run build
RUN yarn add -D concurrently

EXPOSE 3000
EXPOSE 4301

CMD ["yarn", "concurrently", "\"yarn start\"", "\"yarn local:server\""]