FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
RUN corepack enable

# Copiar archivos necesarios para la instalación
COPY scripts /app/scripts
COPY backend/package.json backend/pnpm-lock.yaml* ./

# Instalar dependencias
# --shamefully-hoist crea node_modules plano (sin symlinks de pnpm virtual store)
# para que COPY --from=build funcione correctamente en el stage runtime
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copiar el resto del código fuente
COPY backend . 

# Compilar y eliminar devDependencies
RUN pnpm run build && pnpm prune --prod

FROM node:20-alpine

RUN apk add --no-cache mongodb-tools
# Necesario para que docker-entrypoint.sh pueda llamar pnpm run seed:*
RUN corepack enable
WORKDIR /app

COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/docker-entrypoint.sh ./docker-entrypoint.sh
COPY scripts ./scripts

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
