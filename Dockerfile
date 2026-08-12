# Single-stage build: dev deps are needed for `next build`, and keeping one
# stage avoids native-module (better-sqlite3) tracing pitfalls. Fine for a demo.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# SQLite lives here — mount a volume at /app/data to persist across restarts.
# Without one the app still works; it just reseeds demo data on every boot.
VOLUME /app/data

CMD ["npm", "run", "start"]
