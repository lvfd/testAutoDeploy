# syntax=docker/dockerfile:1

# FROM node:18.13.0-alpine
FROM ${src}/node:18.18.0-alpine
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied

# Copy .npmrc file (for private registry etc.)
COPY .npmrc .npmrc

# where available (npm@5+)
COPY package*.json ./
# COPY package.json package.json

# RUN npm install --omit=dev
# If you are building your code for production
# RUN npm ci --only=production
RUN npm ci --omit=dev

RUN rm .npmrc

# Bundle app source
COPY . .

EXPOSE 3000

CMD [ "npm", "run", "start" ]
