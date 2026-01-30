# 🔧 Configuración Inicial - ShieldTrack

> **Nota:** Esta es una guía simplificada. Para documentación completa, ver [DOCUMENTATION.md](DOCUMENTATION.md)

## ⚡ Inicio en 2 Minutos

```bash
# Terminal 1: Backend
cd backend && npm install && npm run build && npm start

# Terminal 2: Frontend
cd frontend && npm install && npm start

# Acceder: http://localhost:4200
```

## 📋 Pre-requisitos

- Node.js 18.x o superior
- npm 9.x o superior
- MongoDB 6.x o superior
- Git

## 🔧 Instalación Detallada

### Backend

```bash
cd backend
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env (cambiar JWT_SECRET, MONGODB_URI, SMTP_*)
# Luego:
npm run build
npm start
# Backend en http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Frontend en http://localhost:4200
```

## 🆘 Solución de Problemas

**Puerto en uso:**
```powershell
# Encontrar proceso
netstat -ano | findstr :3000
```

**MongoDB no conecta:**
```powershell
# Iniciar servicio
net start MongoDB
```

**Módulos faltantes:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

📖 Para documentación completa, variables de entorno detalladas, arquitectura y más, ver: **[DOCUMENTATION.md](DOCUMENTATION.md)**
