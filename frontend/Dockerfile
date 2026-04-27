# Etapa de compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa de servidor Nginx
FROM nginx:alpine
# Ajustamos la ruta segun angular.json (dist/shieldtrack-frontend/browser)
COPY --from=build /app/dist/shieldtrack-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
