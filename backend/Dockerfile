FROM node:24-alpine AS builder

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

RUN echo "Bust Cache: 2026-08-27T23:19:00Z" > /usr/src/app/cache_bust.txt
COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM node:24-alpine

RUN apk add --no-cache wget libc6-compat

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

RUN mkdir -p /usr/src/app/storage && chown -R appuser:appgroup /usr/src/app

USER appuser

ENV NODE_ENV=production

CMD ["node", "dist/src/main.js"]
