FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5003

CMD ["npm", "start"]