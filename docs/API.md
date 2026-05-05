# API HTTP — ShieldTrack

Referencia operativa del backend NestJS. La fuente detallada por endpoint sigue siendo **Swagger** en el propio servidor.

---

## Base URL y prefijo

- Todas las rutas REST viven bajo el prefijo global: **`/api`**
- Ejemplo local: `http://localhost:3000/api/...`

---

## Documentación interactiva (OpenAPI / Swagger)

| Entorno | URL |
|---------|-----|
| Local | `http://localhost:{PORT}/api/docs` |
| Producción | `https://{su-dominio-api}/api/docs` |

Autenticación en Swagger: botón **Authorize** ? esquema **JWT-auth** ? pegar el token Bearer sin la palabra `Bearer`.

---

## Autenticación

- **Esquema:** JWT en cabecera  
  `Authorization: Bearer <access_token>`
- El token se obtiene en los endpoints de autenticación documentados en Swagger (tag **Auth**).

---

## Cabeceras habituales

| Cabecera | Uso |
|----------|-----|
| `Authorization` | JWT (obligatorio en rutas protegidas) |
| `Content-Type` | `application/json` en cuerpos JSON |
| `X-Tenant-Id` | Contexto de tenant cuando el endpoint o el flujo lo requieren (validación de permisos en backend) |

Los valores exactos y si son obligatorios dependen de cada ruta; consúltese Swagger.

---

## Validación de entrada

El bootstrap registra un `ValidationPipe` global con:

- `whitelist: true` — elimina propiedades no declaradas en el DTO
- `forbidNonWhitelisted: true` — rechaza la petición si vienen propiedades extra (**400 Bad Request**)
- `transform: true` — instancia los DTO y convierte tipos cuando aplica

Por tanto, los clientes deben enviar **solo** los campos definidos en los DTOs publicados (Swagger / código).

---

## CORS (clientes browser)

El navegador envía `Origin`. El servidor permite solo orígenes listados en `CORS_ORIGINS` o `FRONTEND_URL` (ver [DEPLOYMENT.md](DEPLOYMENT.md)). Si el front corre en otro origen, debe añadirse a la lista.

---

## Códigos de error habituales

| Código | Situación típica |
|--------|------------------|
| 400 | Cuerpo inválido, validación class-validator, propiedades no permitidas |
| 401 | Sin token o token inválido/expirado |
| 403 | Autenticado pero sin rol/permiso |
| 404 | Recurso inexistente o fuera de alcance (p. ej. otro tenant/área) |

Los mensajes concretos siguen el filtro global de excepciones (`HttpExceptionFilter`).

---

## Multi-tenant y “áreas”

Conceptualmente el producto prioriza **áreas** como unidad de trabajo visible en UI; a nivel de datos y seguridad coexisten `tenantId` y campos legacy (p. ej. `clientId`). Detalle: [MULTI-TENANCY.md](MULTI-TENANCY.md).

---

## Colecciones Postman

En `docs/ShieldTrack-P0-Tests.postman_collection.json` hay una colección de pruebas; flujo descrito en [TESTING-GUIDE.md](TESTING-GUIDE.md).
