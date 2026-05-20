# Etapa de compilación
FROM node:20-alpine AS build
WORKDIR /app/frontend
RUN corepack enable

# Copiar archivos necesarios para la instalación
COPY scripts /app/scripts
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY frontend . 

# Compilar
RUN pnpm run build --configuration production

# Etapa de servidor Nginx
FROM nginx:alpine
# Ajustamos la ruta segun angular.json (dist/shieldtrack-frontend/browser)
COPY --from=build /app/frontend/dist/shieldtrack-frontend/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
