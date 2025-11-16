FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm install --prefix ./apps/web

COPY . .

WORKDIR /app/apps/web

CMD ["npm", "run", "dev"]


