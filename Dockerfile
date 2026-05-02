FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/data/buyers_agent.db

EXPOSE 3001

VOLUME ["/data"]

WORKDIR /app/backend

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
