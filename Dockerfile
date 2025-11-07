# Multi-stage build

FROM node:22 AS builder
WORKDIR /app

COPY server ./server
COPY client ./client
COPY package*.json ./

# Build server
WORKDIR /app/server
RUN npm install && npm run build

# Build client
WORKDIR /app/client
RUN npm install && npm run build

# Final stage
FROM node:22
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install prod deps only
WORKDIR /app/server
RUN npm install --omit=dev

EXPOSE 3001
CMD ["node", "dist/index.js"]
