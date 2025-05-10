FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install nodemon globally
RUN npm install -g nodemon

# Then install dependencies
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]