FROM node:24-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
