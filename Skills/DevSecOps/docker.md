## 1. Arquitectura de Imágenes: Multi-Stage Builds (Producción-Ready)
No usamos la misma imagen para desarrollar que para producir. El skill generará `Dockerfiles` que separan las dependencias de construcción de las de ejecución.

*   **Para Angular:** 
    *   *Stage 1 (Build):* Usa Node-Alpine para compilar el proyecto.
    *   *Stage 2 (Servidor):* Toma solo los archivos estáticos de `/dist` y los coloca en una imagen de **Nginx Unprivileged** (más segura y ligera).
*   **Para Node.js:**
    *   *Stage 1 (Deps):* Instala todas las dependencias (incluyendo `devDependencies`).
    *   *Stage 2 (Runtime):* Instala solo `production dependencies` y copia el código compilado. Usa imágenes **Distroless** o **Alpine** para reducir la superficie de ataque.

## 2. Optimización de Caché (Layer Caching)
El skill organiza los comandos para aprovechar al máximo el sistema de capas de Docker:
*   Copia primero los archivos `package.json` y `package-lock.json` antes de copiar el resto del código.
*   Esto garantiza que `npm install` solo se ejecute si cambiaste alguna dependencia, ahorrando minutos en cada build.

## 3. Estrategias de Desarrollo con "Hot Reload" Optimizado
Para el stack MEAN, el skill configura:
*   **Anonymous Volumes para `node_modules`:** Evita que los módulos instalados en tu Windows/Mac sobrescriban los del contenedor Linux (evita errores de binarios incompatibles).
*   **Bind Mounts Selectivos:** Solo mapea el código fuente (`src`), evitando que archivos temporales del host ensucien el contenedor.
*   **Polling de Watchers:** Detecta si estás en un sistema de archivos remoto o Windows (WSL) y activa el polling en `ng serve` o `nodemon` solo si es estrictamente necesario para no saturar el CPU.

## 4. Diseño de Redes y Seguridad (Hardening)
*   **Redes Aisladas:** El contenedor de MongoDB **no expone puertos al mundo exterior** por defecto; solo es accesible para el backend a través de la red interna de Docker.
*   **User Privileges:** Las imágenes no corren como `root`. El skill añade automáticamente la creación de un usuario `node` con permisos limitados.
*   **Healthchecks Nativos:** Incluye la instrucción `HEALTHCHECK` en el `docker-compose.yml` para que los servicios dependientes (como el API) no arranquen hasta que la base de datos esté realmente lista para recibir conexiones.

---

## Estructura de Archivos Recomendada (Monorepo/Separated)

El generador organizará tu proyecto así:

```text
.
├── angular-frontend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── nginx.conf
├── node-backend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
└── scripts/
    └── init-mongo.js (Configuración de índices y usuarios iniciales)
```

## Resumen de Beneficios Técnicos Incluidos:

| Práctica | Beneficio |
| :--- | :--- |
| **Distroless/Alpine Images** | Reduce el tamaño de imagen de ~900MB a ~100MB. |
| **.dockerignore inteligente** | Evita subir `node_modules`, `.git` y logs al contexto de build. |
| **Environment Parity** | Usa `.env` compartido para que los puertos coincidan entre Front y Back. |
| **Tunning de MongoDB** | Configura límites de memoria (`deploy.resources`) para que la DB no consuma toda tu RAM en desarrollo. |
| **Log Rotation** | Configura el driver de logs de Docker para que los archivos de texto no llenen tu disco duro con el tiempo. |

---