FROM node:17.1.0-alpine3.12

RUN apk update && \
    apk add --no-cache tzdata

WORKDIR /usr/src/app
COPY package.json  yarn.lock  ./
RUN yarn install

COPY . .

CMD ["yarn", "start"]
