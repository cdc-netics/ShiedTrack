FROM node:20-alpine

# Dependencias de compilación para bcrypt y herramientas de MongoDB
RUN apk add --no-cache python3 make g++ mongodb-tools

WORKDIR /app

# Copiar solo archivos de dependencias primero para aprovechar el cache
COPY package*.json ./

# Forzamos la instalación limpia de dependencias en el contenedor
RUN npm ci --quiet

# Copiamos el resto del código
COPY . .

# Limpiar finales de línea de Windows y dar permisos
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Usamos el script de entrada en lugar de ejecutar node directamente
ENTRYPOINT ["./docker-entrypoint.sh"]
