FROM node:20-alpine AS builder

WORKDIR /app/backend

# Copy dependency manifests first for maximum layer caching
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install --no-audit --no-fund

# Copy backend source
COPY backend/ ./

# Build production bundle
RUN npm run build

# Prune dev dependencies for a lightweight production runtime image
RUN npm prune --production --no-audit

# ─── Production Runner ──────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

# Copy only production dependencies, compiled output, and schemas
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
