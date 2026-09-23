# One image: the API, with the built SPA baked in and served from the same origin.
# Same-origin keeps the session cookie SameSite=Lax, which is what mobile browsers
# need (docs/ARCHITECTURE.md -> Security Architecture). Used by both `docker compose`
# and Render.

FROM node:24-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:24-alpine AS api
WORKDIR /api
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=api /api/dist ./dist
COPY --from=web /web/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
