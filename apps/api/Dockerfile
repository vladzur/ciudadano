# Etapa de build
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/api apps/api

# Build de todos los paquetes del workspace
RUN pnpm build

# pnpm deploy crea un directorio autocontenido con dependencias de produccion
RUN pnpm --filter @ciudadano/api deploy /app/prod

# Etapa de produccion
FROM node:20-alpine

COPY --from=builder /app/prod /app

WORKDIR /app

EXPOSE 3000

CMD ["node", "dist/main.js"]
