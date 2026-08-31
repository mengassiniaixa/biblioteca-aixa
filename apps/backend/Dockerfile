# -------- stage 1: dependencias (cachea node_modules) --------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY domain/package.json ./domain/
RUN yarn install --frozen-lockfile

# -------- stage 2: build (compila domain y backend con tsc) --------
FROM deps AS builder
COPY domain/ ./domain/
COPY apps/backend/ ./apps/backend/
RUN yarn workspace @mi-proyecto/domain build \
 && yarn workspace @mi-proyecto/backend build \
 && node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('domain/package.json','utf8'));p.main='dist/index.js';p.types='dist/index.d.ts';fs.writeFileSync('domain/package.json',JSON.stringify(p,null,2))"

# -------- stage 3: runtime slim --------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# manifests con el package.json del dominio ya parcheado
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY --from=builder /app/domain/package.json ./domain/package.json

# solo deps de produccion
RUN yarn install --frozen-lockfile --production && yarn cache clean

# artefactos compilados y migraciones
COPY --from=builder /app/domain/dist ./domain/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/migrations ./apps/backend/migrations

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/index.js"]
