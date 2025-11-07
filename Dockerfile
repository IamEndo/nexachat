# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# server deps
COPY server/package.json server/tsconfig.json ./server/
RUN cd server && npm ci

# client deps
COPY client/package.json client/tsconfig.json client/vite.config.ts ./client/
RUN cd client && npm ci

# copy sources
COPY server/src ./server/src
COPY client/index.html ./client/index.html
COPY client/src ./client/src

# build server & client
RUN cd server && npm run build
RUN cd client && npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# copy server build & runtime deps
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist

# copy client build into server public
COPY --from=builder /app/client/dist ./server/dist/public

EXPOSE 3000
CMD ["node", "server/dist/index.js"]
