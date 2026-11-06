# Dishcovery API for Cloud Run. Build context = repo root.
#
# Stage 1 installs the backend + shared workspaces and bundles the TypeScript API into one file.
# Stage 2 is the runtime: that bundle plus the data/ files the catalog is read from. No database.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY src/shared/package.json src/shared/
COPY src/backend/package.json src/backend/
COPY src/frontend/package.json src/frontend/
RUN npm ci --no-audit --no-fund --include-workspace-root -w src/shared -w src/backend
COPY tsconfig.base.json ./
COPY scripts/build-api.mjs scripts/
COPY src/shared src/shared
COPY src/backend src/backend
RUN node scripts/build-api.mjs

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/app/data
COPY --from=build /app/dist/server.mjs dist/server.mjs
# Only the folders the API reads. Raw downloads, archives and research stay out.
COPY data/venues data/venues
COPY data/published data/published
COPY data/upload data/upload
COPY data/coupons data/coupons
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8080)+'/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "dist/server.mjs"]
