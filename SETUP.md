# 🔧 Configuración Inicial - ShieldTrack

Esta guía proporciona instrucciones detalladas para poner en marcha ShieldTrack en entornos de desarrollo.

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**: v24.x o superior (LTS recomendado).
- **npm**: v10.x o superior.
- **MongoDB**: v6.x o v7.x (Local o Atlas).
- **Git**: Para control de versiones.

---

## ⚡ Inicio Rápido

### Opción 1: Windows (Recomendado)
Usa el script maestro para levantar todo (MongoDB, Backend, Frontend) automáticamente:

```powershell
npm start
```

### Opción 2: Manual (Cualquier SO)

**1. Backend (NestJS)**
```bash
cd backend
npm install
cp .env.example .env
npm run build
npm start
```

**2. Frontend (Angular)**
```bash
cd frontend
npm install
npm start
```

---

## 🔐 Configuración de Variables (.env)

El archivo `backend/.env` es crítico. Asegúrate de configurar:
- `MONGODB_URI`: Dirección de tu instancia de MongoDB.
- `JWT_SECRET`: Una cadena larga y segura.

---

## 🧪 Datos de Prueba

Para cargar datos iniciales y roles de prueba:
```bash
cd backend
npm run seed:test
```

---

## 🆘 Solución de Problemas Comunes

### Error: "Cannot find module evidence.module"
Ejecuta `npm install` nuevamente en la carpeta `backend`.

### Puerto en uso (3000 o 4200)
```powershell
# Windows: encontrar y matar proceso
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### MongoDB no conecta
Asegúrate de que el servicio esté corriendo (`net start MongoDB`) o usa `npm start` para que el script intente iniciarlo por ti.

---

📖 Para detalles técnicos, consulta **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
