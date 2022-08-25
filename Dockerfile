FROM node:14.18.0

WORKDIR /atenea-scrapy-app
COPY . .

RUN yarn install