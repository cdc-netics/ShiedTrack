# 🛡️ Mejoras de Robustez en Conexión a MongoDB

## Problema Original
El backend fallaba con errores de conexión a MongoDB:
```
connect ECONNREFUSED 127.0.0.1:27017
connect ECONNREFUSED ::1:27017
```

Esto ocurría cuando:
- MongoDB no estaba corriendo
- MongoDB no estaba accesible
- La conexión se perdía por problemas temporales de red

## Soluciones Implementadas

### 1. Servicio de Conexión Robusto (`MongoDBConnectionService`)

Se creó un nuevo servicio en `/backend/src/common/services/mongodb-connection.service.ts` que:

#### ✅ **Reintentos Automáticos con Backoff Exponencial**
- Realiza hasta 30 intentos de conexión
- Usa backoff exponencial (2^n) con jitter aleatorio
- Primera espera: 1 segundo
- Máxima espera entre reintentos: 30 segundos
- Evita el problema del "thundering herd" con jitter

```typescript
// Ejemplo de progresión de reintentos:
// Intento 1: falla inmediatamente
// Intento 2: espera 1s
// Intento 3: espera 2s
// Intento 4: espera 4s
// Intento 5: espera 8s
// ... hasta 30s máximo
```

#### 🚀 **Intento Automático de Iniciar MongoDB**
Si la conexión falla en el primer intento, el servicio intenta iniciar MongoDB automáticamente según el sistema operativo:

**Windows:**
- Intenta iniciar el servicio "MongoDB" con `net start MongoDB`
- Si falla, intenta ejecutar `mongod` directamente

**macOS:**
- Intenta iniciar con Homebrew: `brew services start mongodb-community`
- Si falla, ejecuta `mongod` directamente

**Linux:**
- Intenta con systemctl: `sudo systemctl start mongod`
- Intenta alternativa: `sudo systemctl start mongodb`
- Si falla, ejecuta `mongod` directamente

#### 🔧 **Configuración de Mongoose Mejorada**
En `app.module.ts` se añadió configuración robusta:
```typescript
MongooseModule.forRoot(mongoUri, {
  retryAttempts: 5,           // Reintentos internos de Mongoose
  retryDelay: 5000,           // Espera entre reintentos
  serverSelectionTimeoutMS: 10000,  // Timeout de selección
  connectTimeoutMS: 10000,    // Timeout de conexión
  socketTimeoutMS: 45000,     // Timeout de socket
  family: 4,                  // Usar IPv4 (evita problemas IPv6)
  maxPoolSize: 10,            // Pool máximo de conexiones
  minPoolSize: 2,             // Pool mínimo de conexiones
})
```

#### 📊 **Logs Detallados**
El servicio proporciona información clara:
```
📦 Iniciando servicio de conexión a MongoDB
🔗 URI de conexión: mongodb://localhost:27017/shieldtrack
⏳ Intento 1/30 de conexión a MongoDB
❌ Error al conectar a MongoDB: connect ECONNREFUSED ::1:27017
🚀 Intentando iniciar servicio MongoDB...
🔄 Reintentando en 1450ms (intento 1/30)
⏳ Intento 2/30 de conexión a MongoDB
✅ Conexión a MongoDB establecida correctamente
🚀 ShieldTrack Backend corriendo en: http://localhost:3000
```

### 2. Bootstrap Mejorado (`main.ts`)

Se actualizó el proceso de inicio:

```typescript
// 1. Crear contexto temporal para acceder al servicio
const tempApp = await NestFactory.createApplicationContext(AppModule);
const mongoConnectionService = tempApp.get(MongoDBConnectionService);

// 2. Intentar conectar con reintentos automáticos
await mongoConnectionService.connectWithRetry();

// 3. Si falla después de todos los intentos, detener la aplicación
// Si tiene éxito, crear la aplicación principal normalmente
```

**Beneficios:**
- No inicia la aplicación principal hasta que MongoDB esté disponible
- Los reintentos se hacen antes de escuchar puertos
- Evita mensajes de error en el frontend por API no disponible

### 3. Scripts de Inicialización Mejorados

#### PowerShell (`START-BACKEND-ROBUST.ps1`)
```powershell
# Verifica si MongoDB está corriendo
# Intenta iniciar el servicio si no está disponible
# Compila el backend
# Inicia el servidor con manejo de errores
```

**Uso en Windows:**
```powershell
.\START-BACKEND-ROBUST.ps1
```

#### Bash (`start-backend-robust.sh`)
```bash
#!/bin/bash
# Detecta el SO (Linux/macOS)
# Intenta iniciar MongoDB con los comandos apropiados
# Compila e inicia el backend
```

**Uso en Linux/macOS:**
```bash
chmod +x start-backend-robust.sh
./start-backend-robust.sh
```

## Cómo Usar

### Opción 1: Scripts Automáticos (Recomendado)

**Windows:**
```powershell
.\START-BACKEND-ROBUST.ps1
```

**Linux/macOS:**
```bash
./start-backend-robust.sh
```

### Opción 2: Iniciar Manualmente

1. Asegúrese de que MongoDB esté instalado:
   - **Windows:** [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - **macOS:** `brew install mongodb-community`
   - **Linux:** `sudo apt-get install mongodb` (o el equivalente de su distribución)

2. Inicie MongoDB manualmente:
   ```bash
   mongod
   ```

3. En otra terminal, inicie el backend:
   ```bash
   cd backend
   npm install
   npm run build
   node dist/main.js
   ```

## Configuración Avanzada

### Variables de Entorno

En el archivo `.env` del backend:

```env
# URI de conexión a MongoDB (por defecto: localhost:27017)
MONGODB_URI=mongodb://localhost:27017/shieldtrack

# Puerto del servidor (por defecto: 3000)
PORT=3000

# URL del frontend
FRONTEND_URL=http://localhost:4200

# Otras configuraciones...
```

### Personalizar Reintentos

Para cambiar el número de reintentos o los delays, edite `mongodb-connection.service.ts`:

```typescript
private maxConnectionAttempts = 30;    // Cambiar cantidad de reintentos
private initialDelay = 1000;           // Cambiar delay inicial (ms)
private maxDelay = 30000;              // Cambiar delay máximo (ms)
```

## Ventajas

✅ **Eliminación de errores ECONNREFUSED**
- El servicio reintenta automáticamente
- Inicia MongoDB si no está corriendo
- Nunca falla por problemas temporales de conexión

✅ **Mejor Experiencia de Usuario**
- No se muestra "API no disponible" en el frontend
- El servidor espera a que MongoDB esté listo
- Recuperación automática ante interrupciones

✅ **Robustez en Producción**
- Manejo completo de errores
- Logging detallado para debugging
- Compatible con Docker y Kubernetes

✅ **Flexibilidad**
- Funciona con configuraciones locales y remotas de MongoDB
- Soporta diferentes sistemas operativos
- Configurable según necesidades

## Monitoreo

El servicio proporciona información de estado:

```typescript
const status = mongoConnectionService.getConnectionStatus();
console.log(status);
// {
//   isConnected: true,
//   attempts: 2,
//   maxAttempts: 30
// }
```

## Solución de Problemas

### Si MongoDB no se inicia automáticamente:

1. **Verificar instalación:**
   ```bash
   mongod --version
   ```

2. **Verificar servicio (Windows):**
   ```powershell
   Get-Service -Name MongoDB
   ```

3. **Iniciar manualmente:**
   ```bash
   mongod --dbpath ./data/db
   ```

4. **Verificar conexión:**
   ```bash
   mongosh localhost:27017/shieldtrack
   ```

### Si sigue fallando:

Revise los logs del backend para obtener información detallada sobre qué intento falla y por qué.

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Estado:** ✅ Implementado y Probado
