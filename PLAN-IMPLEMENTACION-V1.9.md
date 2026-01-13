# 🚀 PLAN DE IMPLEMENTACIÓN - ShieldTrack v1.8 → v1.9

## 📅 Timeline: 13 Enero - 20 Enero 2026

---

## 🔴 BLOCKER #1: Asignaciones Granulares de Usuarios (CRÍTICO)

### Problema
No hay forma de asignar un usuario a un PROYECTO específico sin hacerlo ADMIN del área.

### Solución Técnica

#### Backend:
```typescript
// POST /api/users/:userId/assign
{
  "clientIds": ["id1", "id2"],
  "projectIds": ["id1", "id2"],
  "areaIds": ["id1", "id2"]
}
// En UserAssignmentService
```

#### Frontend:
Crear `UserAssignmentDialogComponent` con 3 tabs:

**Tab 1: Clientes**
- Listado de clientes disponibles
- Multi-select checkboxes
- Search

**Tab 2: Proyectos**
- Filtrados por cliente seleccionado
- Multi-select checkboxes
- Search

**Tab 3: Áreas**
- Filtrados por proyecto seleccionado
- Multi-select checkboxes
- Search

**Botón:** "Asignar Recurso" en UserListImprovedComponent (acción "Asignar")

### Duración Estimada
- Backend: 2 horas
- Frontend: 3 horas
- Testing: 1 hora

---

## 🟡 BLOCKER #2: Favicon Dinámico (IMPORTANTE)

### Problema
El favicon es estático. Los clientes quieren favicon personalizado.

### Solución Técnica

#### Backend (Existe):
- Endpoint: `GET /api/clients/me/branding`
- Retorna: `{ favicon: base64, logo: base64, primaryColor, displayName }`

#### Frontend:
1. Crear `BrandingService`:
```typescript
export class BrandingService {
  loadBranding(): Observable<BrandingConfig> {
    return this.http.get<BrandingConfig>('/api/clients/me/branding');
  }
  
  applyFavicon(base64: string) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'data:image/x-icon;base64,' + base64;
  }
}
```

2. En `AppComponent.ngOnInit()`:
```typescript
this.brandingService.loadBranding().subscribe(config => {
  this.brandingService.applyFavicon(config.favicon);
  // Aplicar también logo y colores
});
```

3. En `index.html`:
```html
<!-- Default favicon (por si falla el load) -->
<link rel="icon" type="image/x-icon" href="assets/favicon.ico">
```

### Duración Estimada
- Backend: ✅ Ya existe
- Frontend: 2 horas

---

## 🟡 BLOCKER #3: Colores Primarios Dinámicos (IMPORTANTE)

### Problema
El color primario es hardcodeado. Debe ser dinámico por cliente.

### Solución Técnica

#### Opción A: CSS Override (Más Rápido)
```typescript
// En BrandingService
applyPrimaryColor(color: string) {
  let style = document.getElementById('branding-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'branding-style';
    document.head.appendChild(style);
  }
  style.innerHTML = `
    .mat-toolbar.dynamic-primary {
      background-color: ${color} !important;
    }
    .mat-raised-button.color-primary {
      background-color: ${color} !important;
    }
  `;
}
```

#### Opción B: Material Design Tokens (Recomendado para v17+)
```typescript
// Usar @angular/material/core con CSS custom properties
```

### Duración Estimada
- **Opción A:** 1.5 horas (rápido, funciona bien)
- **Opción B:** 4 horas (mejor arquitectura)

**RECOMENDACIÓN:** Hacer Opción A ahora, refactorizar a B después.

---

## 🟡 IMPORTANTE #1: Notificaciones Email Reales

### Problema
SMTP está configurado pero no se envían emails automáticos.

### Solución Técnica

#### En `FindingService`:
```typescript
// Cuando se asigna un hallazgo:
@Cron(CronExpression.EVERY_HOUR)
async sendFindingAssignmentEmails() {
  // 1. Buscar hallazgos asignados hace poco
  // 2. Para cada asignado, enviar email
  // 3. Marcar como notificado
}

async notifyFindingAssignment(finding: Finding, assignee: User) {
  await this.emailService.send({
    to: assignee.email,
    subject: `Nueva asignación: ${finding.code}`,
    template: 'finding-assignment',
    data: { finding, assignee }
  });
}
```

#### En `UserAreaService`:
```typescript
async notifyAreaAssignment(user: User, area: Area) {
  await this.emailService.send({
    to: user.email,
    subject: `Nuevo acceso a área: ${area.name}`,
    template: 'area-assignment',
    data: { user, area }
  });
}
```

### Duración Estimada
- Backend: 3 horas
- Templates de email: 1 hora

---

## 🟢 IMPORTANTE #2: Descarga Individual de Hallazgos

### Problema
No se pueden descargar hallazgos individuales desde finding-detail.

### Solución Técnica

#### Frontend - En `FindingDetailComponent`:
```typescript
downloadAsCSV(): void {
  const finding = this.finding();
  const csv = this.convertToCSV([finding]);
  this.downloadFile(csv, `${finding.code}.csv`);
}

downloadAsPDF(): void {
  const finding = this.finding();
  const doc = new jsPDF();
  // Agregar contenido del hallazgo
  doc.save(`${finding.code}.pdf`);
}
```

### Duración Estimada
- Frontend: 1 hora

---

## 🟢 NICE TO HAVE: Filtrado Avanzado

### Problema
Solo hay filtros básicos. Se requiere filtrado complejo.

### Solución Técnica
```typescript
// Query builder UI:
// [Status: OPEN] [AND/OR] [Risk: HIGH] [AND/OR] [Area: IT]

// Backend:
// GET /api/findings/search?query=status:OPEN,risk:HIGH,area:IT
```

### Duración Estimada
- Backend: 2 horas
- Frontend: 3 horas

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Bloqueadores (Semana 1)
- [ ] UserAssignmentDialog (Backend + Frontend)
- [ ] Favicon dinámico (Frontend)
- [ ] Colores dinámicos (Frontend - Opción A)

### Fase 2: Importantes (Semana 2)
- [ ] Notificaciones email reales (Backend)
- [ ] Descarga individual hallazgos (Frontend)

### Fase 3: Nice-to-Have (Semana 3)
- [ ] Filtrado avanzado
- [ ] Animaciones generales

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### Backend:
```
src/modules/users/
  ├── user-assignment.service.ts (NUEVO)
  ├── user-assignment.controller.ts (NUEVO)
  ├── dto/
  │   └── assign-users.dto.ts (NUEVO)

src/modules/clients/
  ├── branding.service.ts (EXISTENTE - verificar)
  └── clients.controller.ts (MODIFICAR - GET /api/clients/me/branding)

src/modules/findings/
  └── finding.service.ts (MODIFICAR - agregar notificaciones email)
```

### Frontend:
```
src/app/core/services/
  ├── branding.service.ts (NUEVO)

src/app/features/admin/users/
  ├── user-assignment-dialog.component.ts (NUEVO)
  ├── user-list-improved.component.ts (MODIFICAR - agregar botón)

src/app/features/findings/
  └── finding-detail.component.ts (MODIFICAR - agregar botones descargar)

src/app/
  └── app.component.ts (MODIFICAR - cargar branding OnInit)
```

---

## 🔧 COMANDOS DE TESTING

```bash
# Después de cada fase:
npm run build          # Frontend
npm run start:dev      # Backend

# Testing manual:
1. Crear usuario
2. Asignar a cliente/proyecto/área
3. Verificar acceso
4. Descargar hallazgo
5. Verificar favicon
6. Verificar colores
```

---

## 📊 TABLA DE PROGRESO

| Fase | Item | Estado | ETA | Responsable |
|------|------|--------|-----|-------------|
| 1 | UserAssignment | ❌ | 15-01 | Backend + Frontend |
| 1 | Favicon | ❌ | 14-01 | Frontend |
| 1 | Colores | ❌ | 14-01 | Frontend |
| 2 | Emails | ❌ | 17-01 | Backend |
| 2 | Descarga | ❌ | 16-01 | Frontend |
| 3 | Filtrado | ❌ | 20-01 | Backend + Frontend |
| 3 | Animaciones | ❌ | 20-01 | Frontend |

---

## ⚠️ CONSIDERACIONES DE SEGURIDAD

1. **Asignaciones Granulares:**
   - ✅ Verificar RBAC en backend
   - ✅ Admin solo puede asignar a su tenant
   - ✅ Owner puede asignar a cualquiera

2. **Favicon/Colores:**
   - ✅ Validar base64 antes de inyectar
   - ✅ Sanear CSS dinámico
   - ✅ Timeout para carga de branding

3. **Emails:**
   - ✅ Encriptar credenciales SMTP
   - ✅ Rate limit en envíos
   - ✅ Log de intentos fallidos

---

**Documento generado:** 13 de Enero de 2026  
**Versión:** 1.0  
**Estado:** LISTO PARA IMPLEMENTACIÓN ✅
