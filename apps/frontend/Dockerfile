# -------- stage 1: build con vite --------
FROM node:20-alpine AS builder
WORKDIR /app

# Manifests de todos los workspaces (yarn los necesita para instalar)
COPY package.json yarn.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY domain/package.json ./domain/

RUN yarn install --frozen-lockfile

# Fuentes del frontend (y del dominio, por si Vite lo referencia)
COPY apps/frontend/ ./apps/frontend/
COPY domain/ ./domain/

# VITE_API_BASE_URL entra al build (Vite hace inline)
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN yarn workspace @mi-proyecto/frontend build

# -------- stage 2: nginx sirve el bundle estatico --------
FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
