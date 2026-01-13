# 🚀 QUICK START - Iniciar ShieldTrack v1.8

## ⚡ En 2 Minutos

### 1. Compilar Backend
```powershell
cd 'c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\backend'
npm run build
npm start
# Backend escuchando en http://localhost:3000
```

### 2. Compilar Frontend
```powershell
cd 'c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\frontend'
npm run build
npm start
# Frontend en http://localhost:4200
```

### 3. Acceder al Sistema
```
URL: http://localhost:4200
Usuario: admin@shieldtrack.com (si existe en DB)
```

---

## 📊 Usar Tareas Pre-configuradas

### Opción A: PowerShell (Recomendado)
```powershell
# Abrir VS Code
# Presionar Ctrl+Shift+P
# Escribir "Tasks: Run Task"
# Seleccionar:
#   - "🎨 Frontend" (npm start)
#   - "🚀 Backend" (node dist/main.js)
```

### Opción B: Terminal Manual
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
cd frontend && npm start
```

---

## 🔍 Verificar que Todo Funciona

### Frontend
- [ ] Abre http://localhost:4200
- [ ] Ves pantalla de login
- [ ] No hay errores en console (F12)

### Backend
- [ ] Endpoint disponible: `curl http://localhost:3000/api/health`
- [ ] BD conectada: MongoDB ejecutándose
- [ ] Logs sin errores

### Base de Datos
```powershell
# Verificar MongoDB
mongosh
use shieldtrack
db.users.countDocuments()

# Debería retornar > 0
```

---

## 📁 Documentos Generados (Leer en Orden)

1. **`RESUMEN-EJECUTIVO-V1.8.md`** ← 📌 LEER PRIMERO
   - Estado general
   - Qué está hecho, qué falta
   - Recomendaciones

2. **`DIAGRAMA-ESTADO-V1.8.md`**
   - Visualización gráfica
   - Prioridades
   - Timeline

3. **`VERIFICACION-ESTADO-V1.8.md`**
   - Análisis detallado
   - Tabla completa de funcionalidades
   - Archivos clave

4. **`PLAN-IMPLEMENTACION-V1.9.md`**
   - Plan técnico de qué falta
   - Código de ejemplo
   - Estimaciones

---

## 🎯 Próximas Tareas Prioritarias

### HOY (13-01) - 3.5 horas:
```
[ ] Implementar Favicon dinámico (2h)
[ ] Implementar Colores dinámicos (1.5h)
```

### MAÑANA (14-01) - 6 horas:
```
[ ] Implementar UserAssignmentDialog (6h)
```

### ESTA SEMANA (15-17) - 5 horas:
```
[ ] Notificaciones email reales (4h)
[ ] Descarga individual hallazgos (1h)
```

---

## 🆘 Solucionar Problemas Comunes

### Error: "Port 3000 already in use"
```powershell
# Encontrar proceso usando puerto 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
taskkill /PID [PID] /F
```

### Error: "Cannot find module"
```powershell
cd backend && npm install
cd frontend && npm install
```

### Error: "MongoDB connection refused"
```powershell
# Verificar que MongoDB está ejecutándose
mongosh --version
# Si no existe, instalar MongoDB Community
```

### Error de compilación TypeScript
```powershell
# Limpiar y reconstruir
rm -r dist
npm run build
```

---

## 📞 Contacto y Soporte

**Documentación disponible en:**
- Raíz del proyecto: `RESUMEN-EJECUTIVO-V1.8.md`
- Raíz del proyecto: `PLAN-IMPLEMENTACION-V1.9.md`

**Estado del sistema:**
- ✅ Compila correctamente
- ✅ 77% funcionalidades implementadas  
- ⏳ 23% en lista de prioridades

**Recomendación:**
Proceder con implementación de bloqueadores hoy mismo.

---

**Guía generada:** 13 de Enero de 2026  
**Versión:** v1.8  
**Estado:** ✅ LISTO PARA USAR
