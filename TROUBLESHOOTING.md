# 🔧 GUÍA RÁPIDA DE TROUBLESHOOTING

## ⚡ Problemas Comunes y Soluciones

### 1. "MongoDB no se inicia automáticamente"

#### ✅ Solución:

**Windows:**
```powershell
# Verificar si MongoDB está instalado
mongod --version

# Si no está instalado, descargar desde:
# https://www.mongodb.com/try/download/community

# Instalar como servicio de Windows:
mongod --install

# Iniciar manualmente:
net start MongoDB

# O iniciar directamente:
mongod --dbpath C:\data\db
```

**macOS:**
```bash
# Instalar con Homebrew
brew install mongodb-community

# Iniciar servicio
brew services start mongodb-community

# O iniciar directamente:
mongod --dbpath ~/data/db
```

**Linux:**
```bash
# Instalar (Ubuntu/Debian)
sudo apt-get install mongodb

# Iniciar servicio
sudo systemctl start mongod

# O instalar con MongoDB repositorio oficial:
# https://docs.mongodb.com/manual/installation/

# Iniciar directamente:
mongod --dbpath /var/lib/mongodb
```

---

### 2. "El backend sigue dando error después de 30 intentos"

#### ✅ Soluciones:

**Paso 1: Verificar que MongoDB está realmente corriendo:**
```bash
# En otra terminal, verificar conexión
mongosh localhost:27017
```

**Paso 2: Revisar la URI de conexión:**
```bash
# Ver archivo .env en el backend
cat backend/.env | grep MONGODB_URI

# Debería ser algo como:
# MONGODB_URI=mongodb://localhost:27017/shieldtrack
```

**Paso 3: Verificar puerto 27017:**
```bash
# Windows:
netstat -ano | findstr 27017

# Linux/macOS:
lsof -i :27017
```

**Paso 4: Reiniciar MongoDB completamente:**
```bash
# Windows:
net stop MongoDB
net start MongoDB

# Linux:
sudo systemctl restart mongod

# macOS:
brew services restart mongodb-community
```

---

### 3. "Problemas de permisos en Linux"

#### ✅ Solución:

```bash
# Asegurar permisos corretos
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chmod -R 755 /var/lib/mongodb

# Reiniciar MongoDB
sudo systemctl restart mongod

# Verificar estado
sudo systemctl status mongod
```

---

### 4. "Error: EADDRINUSE (puerto ya en uso)"

#### ✅ Solución:

```bash
# Windows (encontrar proceso en puerto 27017):
netstat -ano | findstr :27017
taskkill /PID [PID] /F

# Linux/macOS:
lsof -i :27017
kill -9 [PID]

# Luego reiniciar MongoDB
```

---

### 5. "Backend compila pero no inicia"

#### ✅ Solución:

```bash
# Eliminar carpeta dist y recompilar
cd backend
rm -r dist
npm run build

# Verificar que no hay errores de TypeScript
npm run build 2>&1 | grep error

# Si hay errores, revisar los archivos modificados
```

---

### 6. "Script PowerShell no se ejecuta (Windows)"

#### ✅ Solución:

```powershell
# Cambiar política de ejecución temporalmente
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Luego ejecutar el script
.\START-BACKEND-ROBUST.ps1

# O ejecutar como administrador:
# Click derecho en PowerShell → "Ejecutar como administrador"
```

---

### 7. "Script Bash no tiene permisos (Linux/macOS)"

#### ✅ Solución:

```bash
# Dar permisos de ejecución
chmod +x start-backend-robust.sh

# Ejecutar
./start-backend-robust.sh

# O ejecutar con bash directamente
bash start-backend-robust.sh
```

---

### 8. "Logs del backend no muestran nada"

#### ✅ Solución:

**Aumentar verbosidad:**
```bash
# Editar main.ts y cambiar logger
cd backend
DEBUG=* npm run build
node dist/main.js
```

**Revisar logs guardados:**
```bash
# Los logs deberían estar en:
ls -la backend/logs/
cat backend/logs/error.log
```

---

### 9. "MongoDB en otro servidor/puerto"

#### ✅ Solución:

**Actualizar .env del backend:**
```env
# Cambiar la URI según su configuración
MONGODB_URI=mongodb://user:pass@servidor.com:27017/shieldtrack
```

**Nota:** El script de inicio automático solo funciona para localhost. Para servidores remotos:
- Verificar conectividad: `ping servidor.com`
- Verificar puerto abierto: `telnet servidor.com 27017`
- Verificar credenciales en MongoDB

---

### 10. "Error: Too many connections"

#### ✅ Solución:

**Aumentar límite de conexiones en MongoDB:**

En `backend/src/app.module.ts`, cambiar:
```typescript
maxPoolSize: 10,  // Aumentar si es necesario
minPoolSize: 2,   // Ajustar según carga
```

**También verificar conexiones activas:**
```bash
# Conectarse a MongoDB
mongosh localhost:27017

# Ver conexiones activas
db.currentOp()
```

---

## 🔍 Debugging Avanzado

### Ver logs detallados de Mongoose:

```bash
# En el terminal, establecer debug:
DEBUG=mongoose:* npm run start
```

### Ver todas las conexiones MongoDB:

```bash
mongosh localhost:27017
db.currentOp(true)
```

### Prueba de conectividad simple:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/shieldtrack', {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
})
.then(() => { console.log('✅ Conectado'); process.exit(0); })
.catch(err => { console.log('❌ Error:', err.message); process.exit(1); });
"
```

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verificar:

- [ ] MongoDB está instalado: `mongod --version`
- [ ] MongoDB está corriendo: `mongosh localhost:27017`
- [ ] Puerto 27017 está libre: `netstat -ano | findstr 27017`
- [ ] Backend se compila sin errores: `npm run build`
- [ ] Archivos modificados están en su lugar
- [ ] .env tiene la URI correcta
- [ ] Node.js es v16 o superior: `node --version`
- [ ] npm es v8 o superior: `npm --version`

---

## 📞 Si el Problema Persiste

1. Recopilar logs completos del backend:
   ```bash
   node dist/main.js 2>&1 | tee backend.log
   ```

2. Recopilar información del sistema:
   ```bash
   mongod --version
   node --version
   npm --version
   ```

3. Revisar documentación completa en:
   - `MONGODB-ROBUSTNESS-IMPROVEMENTS.md`
   - `CAMBIOS-IMPLEMENTADOS.md`

---

**Última actualización:** Enero 2026
**Estado:** ✅ Tested and Working
