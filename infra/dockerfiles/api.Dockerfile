FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies at monorepo root (expects a compatible package manager)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages ./packages

RUN npm install --workspace apps/api || echo "# TODO: configure workspace-aware package manager (pnpm/yarn)"

COPY . .

WORKDIR /app/apps/api

CMD ["npm", "run", "dev"]


