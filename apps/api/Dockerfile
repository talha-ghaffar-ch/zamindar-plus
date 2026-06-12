FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY packages/shared/package*.json packages/shared/

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build:api
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start:prod", "-w", "apps/api"]
