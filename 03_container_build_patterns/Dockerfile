FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package file and install dependencies
COPY ./app/package.json ./
RUN npm install

# Bundle app source
COPY ./app .

EXPOSE 8080
CMD [ "npm", "start" ]
