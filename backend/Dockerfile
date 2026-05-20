FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build && pnpm prune --prod

FROM node:20-alpine

RUN apk add --no-cache mongodb-tools
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
