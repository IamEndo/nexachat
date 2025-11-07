# ---- build server ----
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/tsconfig.json ./tsconfig.json
COPY server/src ./src
RUN npm run build

# ---- build client ----
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ .
# build with API/WS URLs baked in (Railway can also supply at runtime if you serve statically)
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# install only prod deps for server
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# bring server dist
COPY --from=server-build /app/server/dist ./server/dist

# serve client as static files via Express (or you can host separately on Railway’s static service)
COPY --from=client-build /app/client/dist ./client/dist

# minimal express static hosting snippet is assumed in server code:
# app.use(express.static(path.join(__dirname, "../../client/dist")));
# app.get("*", (_, res) => res.sendFile(path.join(__dirname, "../../client/dist/index.html")));

EXPOSE 3000
CMD ["node", "server/dist/index.js"]
