FROM node:18-alpine
WORKDIR /app
RUN npm ci
COPY package.json ./
COPY package-lock.json ./
COPY ./ ./
CMD ["npm", "run", "start"]