# 🚀 GuíaRápida - Nuevos Componentes v1.7

## 📋 Tabla de Contenidos
1. [UserListImprovedComponent](#userlistimprovedcomponent)
2. [UserAssignmentDialogComponent](#userassignmentdialogcomponent)
3. [TenantBrandingConfigComponent](#tenantbrandingconfigcomponent)
4. [FindingDownloadButtonComponent](#findingdownloadbuttoncomponent)

---

## 👥 UserListImprovedComponent

**Localización:** `/admin/users`
**Componente:** `user-list-improved.component.ts`

### Características
- ✅ Gestión centralizada de usuarios
- ✅ Búsqueda y filtros avanzados
- ✅ Quick-actions (bloquear, asignar)
- ✅ Menú contextual con opciones

### Cómo Usar

#### 1. Acceder a la Interfaz
```
http://localhost:4200/admin/users
```

#### 2. Buscar Usuarios
En el campo "Buscar", escribe:
- Nombre: "Juan"
- Email: "juan@example.com"
- Apellido: "Pérez"

#### 3. Filtrar por Rol
```
Selector "Rol" > Selecciona tu rol > Se filtran usuarios
```

Roles disponibles:
- **Owner** ⭐ - Propietario de la plataforma
- **Platform Admin** 🔧 - Administrador de plataforma
- **Client Admin** 💼 - Administrador de cliente
- **Area Admin** 📁 - Administrador de área
- **Analyst** 📊 - Analista
- **Viewer** 👁️ - Solo visualización

#### 4. Filtrar por Estado
```
Selector "Estado" > [Todos | Activos | Bloqueados]
```

#### 5. Acciones Rápidas

**Botón Asignar** (assign icon):
```typescript
click → Abre UserAssignmentDialogComponent
```
Permite asignar usuario a:
- Clientes
- Proyectos
- Áreas

**Botón Bloquear** (block icon):
```typescript
click → Confirma bloqueo (prompt)
→ Usuario marcado como isDeleted: true
→ Lista se actualiza automáticamente
```

**Botón Más** (menu icon):
```typescript
- Editar usuario (TODO)
- Cambiar rol (TODO)
- Reset contraseña (envía email)
- Ver asignaciones → Abre assignment dialog
```

### Ejemplo de Código en tu Componente
```typescript
// Importar
import { UserListImprovedComponent } from './path/to/user-list-improved.component';

// Usar como standalone route (ya está hecho)
// O importar en otro componente
import { UserListImprovedComponent } from '@features/admin/users/user-list-improved.component';

// En template
<app-user-list-improved></app-user-list-improved>
```

---

## 🔄 UserAssignmentDialogComponent

**Componente:** `user-assignment-dialog.component.ts`
**Abierto por:** UserListImprovedComponent o cualquier otro componente

### Características
- ✅ 3 tabs: Clientes, Proyectos, Áreas
- ✅ Search en cada tab
- ✅ Multi-select checkboxes
- ✅ Summary de selecciones
- ✅ POST al backend para guardar

### Cómo Usar

#### 1. Abrir Dialog
En UserListImprovedComponent:
```typescript
<button mat-icon-button (click)="openAssignmentDialog(user)">
  <mat-icon>assignment</mat-icon>
</button>
```

#### 2. Tab 1: Seleccionar Clientes
```
Buscar por nombre en el campo superior
Clickear checkbox de clientes deseados
Contador muestra seleccionados: "2 clientes"
```

#### 3. Tab 2: Seleccionar Proyectos
```
Nota: Solo muestra proyectos de clientes seleccionados en Tab 1
Buscar por nombre de proyecto
Seleccionar múltiples proyectos
Contador: "3 proyectos"
```

#### 4. Tab 3: Seleccionar Áreas
```
Nota: Solo muestra áreas de proyectos seleccionados en Tab 2
Buscar por nombre de área
Seleccionar múltiples áreas
Contador: "1 área"
```

#### 5. Guardar Asignaciones
```
Click "Guardar" 
POST /api/auth/users/{userId}/assignments
{
  clientIds: ["id1", "id2"],
  projectIds: ["proj1", "proj2", "proj3"],
  areaIds: ["area1"]
}
Snackbar: "Asignaciones guardadas"
Dialog cierra → UserList se recarga
```

### Cómo Integrar en tu Componente
```typescript
import { MatDialog } from '@angular/material/dialog';
import { UserAssignmentDialogComponent } from '@features/admin/users/user-assignment-dialog.component';

export class MiComponente {
  constructor(private dialog: MatDialog) {}

  asignarUsuario(usuario: User) {
    this.dialog.open(UserAssignmentDialogComponent, {
      width: '800px',
      data: {
        userId: usuario._id,
        userName: `${usuario.firstName} ${usuario.lastName}`
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        // Usuario hizo clic en guardar
        // Recarga datos si es necesario
        this.recargar();
      }
    });
  }
}
```

---

## 🎨 TenantBrandingConfigComponent

**Localización:** `/admin/tenant-config`
**Componente:** `tenant-branding-config.component.ts`

### Características
- ✅ Configurar nombre mostrado del tenant
- ✅ Upload favicon
- ✅ Upload logo
- ✅ Color picker
- ✅ Preview en tiempo real

### Cómo Usar

#### 1. Acceder
```
http://localhost:4200/admin/tenant-config
```

#### 2. Tab "Información"

**Campo: Nombre del Cliente**
```
Ej: "ACME Corporation"
Este es el nombre interno/completo
```

**Campo: Nombre Mostrado (Display Name)**
```
Ej: "ACME"
Este nombre se muestra en la navbar y UI
La previsualización aparece debajo
```

#### 3. Tab "Favicon y Logo"

**Subir Favicon:**
```
1. Click "Subir Favicon"
2. Selecciona imagen (recomendado: 64x64 px)
3. Preview aparece automáticamente
4. Se guarda en backend
```

**Subir Logo:**
```
1. Click "Subir Logo"
2. Selecciona imagen (recomendado: 150px ancho)
3. Preview aparece automáticamente
4. Se guarda en backend
```

#### 4. Tab "Colores"

**Color Picker:**
```
1. Click en el campo de color
2. Selecciona color primario
3. Preview en vivo debajo mostrará el color
4. Se usa en botones y elementos primarios
```

#### 5. Guardar Cambios
```
Click "Guardar Configuración"
POST /api/clients/me/branding (FormData con archivos)
✅ Sincroniza automáticamente con localStorage
📱 Cambios visibles en toda la app
Snackbar: "Configuración guardada"
```

#### 6. Limpiar Formulario
```
Click "Limpiar"
Reseta todos los valores y previsualizaciones
No afecta datos guardados en servidor
```

### Backend Esperado

El backend debe tener este endpoint:
```http
POST /api/clients/me/branding
Content-Type: multipart/form-data

- name (text)
- displayName (text)
- primaryColor (text, ej: #1976D2)
- favicon (file, opcional)
- logo (file, opcional)
```

### Sincronización con App
```typescript
// En localStorage se guarda:
currentTenant = {
  name: "ACME Corporation",
  displayName: "ACME",
  favicon: "data:image/...",
  logo: "data:image/...",
  primaryColor: "#1976D2"
}

// La navbar puede acceder:
tenant = JSON.parse(localStorage.getItem('currentTenant'))
```

---

## 📥 FindingDownloadButtonComponent

**Componente:** `finding-download-button.component.ts`
**Usar en:** finding-list, finding-detail, cualquier lugar con hallazgos

### Características
- ✅ Descarga en CSV, PDF, JSON
- ✅ Copia al portapapeles
- ✅ Indicador de carga
- ✅ Error handling

### Cómo Usar

#### 1. Importar en tu Componente
```typescript
import { FindingDownloadButtonComponent } from '@shared/components/finding-download-button.component';

@Component({
  imports: [FindingDownloadButtonComponent, ...]
})
export class FindingListComponent {}
```

#### 2. Usar en Template
```html
<!-- Simple: solo con ID -->
<app-finding-download-button 
  [findingId]="finding._id">
</app-finding-download-button>

<!-- Completo: con datos para clipboard -->
<app-finding-download-button 
  [findingId]="finding._id"
  [findingData]="finding"
  (downloadComplete)="onDownloadComplete()">
</app-finding-download-button>
```

#### 3. En Loop
```html
<table>
  <tr *ngFor="let finding of findings">
    <td>{{ finding.title }}</td>
    <td>
      <app-finding-download-button 
        [findingId]="finding._id"
        [findingData]="finding">
      </app-finding-download-button>
    </td>
  </tr>
</table>
```

#### 4. Opciones de Descarga

**CSV:**
```
Click ícono descarga → CSV
Descarga archivo: finding-{id}.csv
Con UTF-8 BOM para Excel
```

**PDF:**
```
Click ícono descarga → PDF
Requiere: GET /api/findings/{id}/export/pdf
Descarga archivo: finding-{id}.pdf
```

**JSON:**
```
Click ícono descarga → JSON
Descarga: finding-{id}.json
Contiene todos los datos del hallazgo
```

**Copiar al Portapapeles:**
```
Click ícono descarga → Copiar al portapapeles
Copia JSON formateado (requiere [findingData])
Puedes pegar en otro editor
Snackbar: "Copiado al portapapeles"
```

### Ejemplo Completo
```typescript
import { Component } from '@angular/core';
import { FindingDownloadButtonComponent } from '@shared/components/finding-download-button.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-finding-list',
  imports: [FindingDownloadButtonComponent],
  template: `
    <table>
      <thead>
        <tr>
          <th>Hallazgo</th>
          <th>Severidad</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let f of findings">
          <td>{{ f.title }}</td>
          <td>{{ f.severity }}</td>
          <td>
            <app-finding-download-button 
              [findingId]="f._id"
              [findingData]="f"
              (downloadComplete)="onDownloaded()">
            </app-finding-download-button>
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class FindingListComponent {
  findings: any[] = [];

  constructor(private http: HttpClient) {}

  onDownloaded() {
    console.log('Descarga completada');
  }
}
```

### Backend Requerido

**Endpoints necesarios:**
```http
# CSV Export
GET /api/findings/{id}/export/csv
Response: Blob (CSV con UTF-8 BOM)

# PDF Export (opcional, pero recomendado)
GET /api/findings/{id}/export/pdf
Response: Blob (PDF)

# Get Finding (para JSON)
GET /api/findings/{id}
Response: Finding JSON
```

---

## 🔗 Dependencias Compartidas

### Material Design
```typescript
Todos los nuevos componentes usan:
- MatDialog
- MatSnackBar
- MatButton
- MatIcon
- MatMenu
- MatTable
- MatForm
- MatSelect
- MatChips
```

### Services Esperados
```typescript
// HttpClient para API calls
constructor(private http: HttpClient) {}

// Para snackbars
constructor(private snackBar: MatSnackBar) {}

// Para dialogs
constructor(private dialog: MatDialog) {}
```

### Environment
```typescript
// Todos usan environment.apiUrl
import { environment } from '@environments/environment';
http.get(`${environment.apiUrl}/endpoint`)
```

---

## ✅ Checklist de Integración

- [ ] UserListImprovedComponent está routed a `/admin/users`
- [ ] UserAssignmentDialogComponent se abre desde UserListImprovedComponent
- [ ] TenantBrandingConfigComponent está routed a `/admin/tenant-config`
- [ ] TenantBrandingConfigComponent tiene endpoint POST `/api/clients/me/branding`
- [ ] FindingDownloadButtonComponent agregado a finding-list
- [ ] FindingDownloadButtonComponent agregado a finding-detail
- [ ] Endpoints de descarga implementados en backend:
  - [ ] GET `/api/findings/{id}/export/csv`
  - [ ] GET `/api/findings/{id}/export/pdf` (opcional)
- [ ] UserAssignmentDialog tiene endpoint POST `/api/auth/users/{id}/assignments`
- [ ] Todos los componentes importan environment.apiUrl

---

## 📞 Soporte Rápido

**¿El dialog no abre?**
```
✅ Verificar: MatDialog está inyectado en UserListImprovedComponent
✅ Verificar: MatDialogModule importado en UserListImprovedComponent
```

**¿Las descargas no funcionan?**
```
✅ Verificar: Endpoints existen en backend
✅ Verificar: CORS configurado en NestJS
✅ Verificar: environment.apiUrl es correcto
```

**¿El color no se aplica?**
```
✅ Verificar: TenantBrandingConfigComponent POST guarda en backend
✅ Verificar: Componentes lean desde localStorage o API
✅ Verificar: CSS aplica el primaryColor desde servicios
```

**¿Las asignaciones no se guardan?**
```
✅ Verificar: POST /api/auth/users/{userId}/assignments existe
✅ Verificar: Endpoint acepta { clientIds[], projectIds[], areaIds[] }
✅ Verificar: User schema tiene campos assignments
```

---

## 🎓 Próximos Pasos

1. **Integrar inicialAdmin en client creation**
   - Campo adicional en client-create.component.ts
   - Backend ya soporta createClientDto.initialAdmin

2. **Agregar descarga a finding-detail**
   - Usar FindingDownloadButtonComponent
   - Colocar en header con otros botones

3. **Implementar audit logging**
   - `/admin/audit` existe pero está vacío
   - Requiere schema de auditoría en MongoDB
   - Middleware para registrar cambios

4. **WebSocket para real-time**
   - Reemplazar polling actual
   - Notificaciones en tiempo real
   - Socket.io configuración

5. **MFA Setup UI completion**
   - Mejorar flujo de setup
   - Recovery codes
   - Backup options

---

**¡Listo!** Todos los componentes están listos para usar. 🚀
