# Builds the React client, then runs the Express API, which also serves the client build.
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
# The client lock file drifts from package.json (Vercel uses npm install too)
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client /app/client/build ../client/build
USER node
EXPOSE 5000
CMD ["node", "index.js"]
