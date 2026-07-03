FROM node:22-alpine AS build

RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
ENV CI=true
RUN corepack enable

# Copiar archivos necesarios para la instalación
COPY scripts /app/scripts
COPY backend/package.json backend/pnpm-lock.yaml* backend/pnpm.yaml* backend/pnpm-workspace.yaml* backend/.npmrc ./

# Instalar todas las dependencias (dev + prod) para poder compilar
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copiar el resto del código fuente y compilar
COPY backend .
RUN pnpm run build

FROM node:22-alpine

RUN apk add --no-cache mongodb-tools
RUN corepack enable

# Los scripts raíz van en /app/scripts para que el preinstall del backend
# (que corre desde /app/backend/) pueda resolverlos con ../scripts/
WORKDIR /app
COPY scripts ./scripts

# WORKDIR igual que en build stage: así ../scripts/ y paths relativos del
# entrypoint (dist/main.js, scripts/seeds/) resuelven correctamente
WORKDIR /app/backend
ENV CI=true

COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/pnpm-lock.yaml ./
COPY --from=build /app/backend/pnpm-workspace.yaml ./
COPY --from=build /app/backend/pnpm.yaml ./
# .npmrc ensures shamefully-hoist=true is used by any pnpm invocation (including
# runDepsStatusCheck reinstalls triggered at runtime by `pnpm run seed:*`)
COPY --from=build /app/backend/.npmrc ./

# Instalar solo dependencias de producción
# Sin --ignore-scripts: preinstall (node ../scripts/enforce-pnpm.js) resuelve a
# /app/scripts/enforce-pnpm.js ✓ y allowBuilds en pnpm-workspace.yaml permite
# los build scripts de @nestjs/core y @scarf/scarf, evitando runDepsStatusCheck
RUN pnpm install --frozen-lockfile --shamefully-hoist --prod

COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/scripts ./scripts
COPY --from=build /app/backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
