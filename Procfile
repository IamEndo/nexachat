# Production start commands

# Server (API + WebSocket)
server: cd server && npm install --omit=dev && npm run build && node dist/index.js

# Client (built static)
client: cd client && npm install --omit=dev && npm run build && npx serve -s dist -l $PORT
