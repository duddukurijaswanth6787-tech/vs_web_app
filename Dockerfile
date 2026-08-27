FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

RUN npm install

COPY backend ./backend

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ../node_modules
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
