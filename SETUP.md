# 🚀 Guía de Configuración Inicial - ShieldTrack

## 📋 Pre-requisitos

Antes de iniciar el proyecto, asegúrate de tener instalado:

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- **MongoDB** 6.x o superior (local o remoto)
- **Git** para control de versiones

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/TU_USUARIO/ShieldTrack.git
cd ShieldTrack
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# Importante: Cambiar JWT_SECRET, MONGODB_URI y credenciales SMTP
```

**Archivo `.env` requerido:**

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shieldtrack

# JWT - CAMBIAR EN PRODUCCIÓN
JWT_SECRET=tu-clave-secreta-super-segura-aqui
JWT_EXPIRES_IN=8h

# Application
PORT=3000
FRONTEND_URL=http://localhost:4200

# SMTP para notificaciones de retest
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-o-app-password
SMTP_FROM=noreply@shieldtrack.com

# Almacenamiento de evidencias
EVIDENCE_STORAGE_PATH=./uploads/evidence
```

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

### 4. Inicializar Base de Datos

El backend crea automáticamente los índices necesarios al iniciar. Para un entorno de desarrollo completo con datos de prueba (Clientes, Áreas, Usuarios con distintos roles), ejecuta:

```bash
cd backend

# Cargar datos de prueba completos (P0)
# Crea usuarios: admin@shieldtrack.com, client-admin@acmecorp.com, etc.
npm run seed:test
```

Si solo necesitas un usuario administrador básico:

```bash
# Crear solo usuario owner
npm run seed:owner
```

## ▶️ Ejecución

### Desarrollo (2 terminales)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

La aplicación estará disponible en:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api

### Producción

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run build
# Los archivos estarán en frontend/dist/
# Servir con nginx, apache o cualquier servidor estático
```

## 🗄️ Configuración de MongoDB

### Opción 1: MongoDB Local

1. Instalar MongoDB Community Edition
2. Iniciar servicio: `mongod`
3. URI por defecto: `mongodb://localhost:27017/shieldtrack`

### Opción 2: MongoDB Atlas (Cloud)

1. Crear cuenta en https://www.mongodb.com/cloud/atlas
2. Crear cluster gratuito
3. Obtener connection string
4. Actualizar `MONGODB_URI` en `.env`:
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/shieldtrack?retryWrites=true&w=majority
   ```

## 📧 Configuración SMTP (Opcional)

Para habilitar notificaciones de retest:

### Gmail (Recomendado para testing)

1. Habilitar "Verificación en 2 pasos" en tu cuenta Google
2. Generar "Contraseña de aplicación": https://myaccount.google.com/apppasswords
3. Configurar en `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App password
   ```

### Otros Proveedores

- **Outlook/Office365:**
  - Host: smtp.office365.com
  - Port: 587
  - Secure: false

- **SendGrid:**
  - Host: smtp.sendgrid.net
  - Port: 587
  - User: apikey
  - Pass: tu-api-key

## 🔐 Primer Acceso

### Crear Usuario OWNER

**Opción 1: Script automatizado**
```bash
cd backend
node scripts/create-owner.js
```

**Opción 2: Manual con MongoDB**
```javascript
// En MongoDB Compass o mongo shell
use shieldtrack
db.users.insertOne({
  email: "admin@shieldtrack.com",
  password: "$2b$10$hashedPasswordHere", // Usar bcrypt para hashear
  role: "OWNER",
  isActive: true,
  mfaEnabled: false,
  createdAt: new Date()
})
```

**Opción 3: Endpoint de registro**
```bash
# Primera ejecución permite registro de OWNER
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "admin@shieldtrack.com",
  "password": "Admin123!",
  "role": "OWNER"
}
```

Luego accede a http://localhost:4200 y usa las credenciales creadas.

## 📊 Datos de Prueba (Opcional)

Para poblar la base de datos con datos de ejemplo:

```bash
cd backend
node scripts/seed-test-data.js
```

Esto crea:
- 2 clientes
- 3 proyectos
- 10 hallazgos de ejemplo
- 3 usuarios con diferentes roles

## 🧪 Verificación de Instalación

### Checklist Backend

```bash
# Verificar que el backend responde
curl http://localhost:3000/api/health

# Verificar Swagger
# Abrir en navegador: http://localhost:3000/api
```

### Checklist Frontend

1. Abrir http://localhost:4200
2. Verificar que carga la página de login
3. Login con usuario OWNER
4. Verificar que se carga el dashboard

### Checklist MongoDB

```bash
# Conectar con mongosh
mongosh

use shieldtrack
show collections
# Debe mostrar: users, clients, projects, findings, etc.
```

## ❗ Solución de Problemas Comunes

### Puerto 3000 o 4200 ocupado

**Windows:**
```powershell
# Liberar puerto 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Liberar puerto 4200
Get-NetTCPConnection -LocalPort 4200 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Linux/Mac:**
```bash
# Liberar puerto 3000
lsof -ti:3000 | xargs kill -9

# Liberar puerto 4200
lsof -ti:4200 | xargs kill -9
```

### Error: Cannot connect to MongoDB

- Verificar que MongoDB esté corriendo: `mongod --version`
- Verificar URI en `.env`
- Verificar firewall/red si usas MongoDB Atlas

### Error: SMTP authentication failed

- Verificar credenciales SMTP en `.env`
- Si usas Gmail, usar "Contraseña de aplicación" no tu password normal
- Verificar que el puerto no esté bloqueado por firewall

### Frontend no carga / pantalla en blanco

```bash
cd frontend

# Limpiar cache de Angular
rm -rf .angular/

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Reintentar
npm start
```

## 📚 Próximos Pasos

1. **Leer documentación completa:** `README.md` y `docs/architecture.md`
2. **Configurar clientes:** Crear tu primer tenant
3. **Crear áreas:** Organizar tu estructura
4. **Invitar usuarios:** Asignar roles y permisos
5. **Importar hallazgos:** Comenzar a gestionar vulnerabilidades

## 🆘 Soporte

- **Issues conocidos:** Ver `ISSUES.md`
- **Guía de testing:** Ver `docs/TESTING-GUIDE.md`
- **QA y validaciones:** Ver `docs/qa-plan-p0.md`

---

**Nota:** Este archivo es para nuevos usuarios. Los scripts `run.ps1`, `start-all.ps1`, etc. son específicos del entorno de desarrollo original y no deben versionarse en Git.
